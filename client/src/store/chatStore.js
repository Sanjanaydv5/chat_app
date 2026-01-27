import { create } from 'zustand';
import { getSocket } from '../services/chat.service';
import { axiosInstance } from '../services/chat.service';

export const chatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),



    //socket event listeners setup
    initsocketListeners: () => {
        const socket = getSocket(); // Assume getSocket is a function that returns the socket instance
        if (!socket) return;

        //remove existing listeners to avoid duplicates
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_status');
        socket.off('message_send');
        socket.off('message_error');
        socket.off('message_delete');

        //listen for incoming messages
        socket.on('receive_message', (message) => {
            const { currentConversation, messages } = get();
            if (currentConversation && message.conversationId === currentConversation.id) {
                set({ messages: [...messages, message] });
            }
        });

        //conform message sent
        socket.on('message_send', (message) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === message._id ? { ...msg, status: 'sent' } : msg
                )
            }));
        });

        //Update message status
        socket.on('message_status_update', ({ messageId, messageStatus }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, status: messageStatus } : msg
                )
            }));
        });

        //handle reaction on messages
        socket.on('reaction_update', ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                )
            }));
        });

        //handle remove message from local state
        socket.on('message_deleted', ({ deletedMessageId }) => {
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== deletedMessageId)
            }));
        });

        //handle any message sending errors
        socket.on('message_error', ({ error }) => {
            console.error('Message error:', error);
        });

        //listen for typing indicators
        socket.on('user_typing', ({ conversationId, userId, isTyping }) => {
            set((state) => {
                const newTypingUsers = new Map(state.typingUsers);
                if (!newTypingUsers.has(conversationId)) {
                    newTypingUsers.set(conversationId, new Set());
                }
                const typingSet = newTypingUsers.get(conversationId);
                if (isTyping) {
                    typingSet.add(userId);
                } else {
                    typingSet.delete(userId);
                }
                return { typingUsers: newTypingUsers };
            });
        });
        //listen for user online/offline status updates
        socket.on('user_status', ({ userId, isOnline, lastSeen }) => {
            set((state) => {
                const newOnlineUsers = new Map(state.onlineUsers);
                newOnlineUsers.set(userId, { isOnline, lastSeen });
                return { onlineUsers: newOnlineUsers };
            });
        });
        //emit status check for all users in conversations list
        const { conversations } = get();
        if (conversations?.data?.length > 0) {
            conversations.data?.forEach((conv) => {
                const otherUser = conv.participants.find(
                    (p) => p._id !== get().currentUser._Id
                );
                if (otherUser._id) {
                    socket.emit("get_user_status", otherUser._id, (status) => {
                        set((state) => {
                            const newOnlineUsers = new Map(state.onlineUsers);
                            newOnlineUsers.set(state.userId, {
                                isOnline: status.isOnline,
                                lastSeen: status.lastSeen,
                            });
                            return { onlineUsers: newOnlineUsers };
                        });
                    });
                }
            });
        }
    },

    setCurrentUser: (user) => set({ currentUser: user }),
    fetchConversations: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get('/chats/conversations');
            set({ conversations: data, loading: false });
            get().initsocketListeners();
            return data;
        } catch (error) {
            set({ error: error?.response?.data?.message || error?.message, loading: false });
            return null;
        }
    },

    //fetch messages for a conversation
    fetchMessages: async (conversationId) => {
        if (!conversationId) return;
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get(
                `/chats/conversations/${conversationId}/messages`
            );
            const messageArray = data.data || data || [];
            set({
                messages: messageArray,
                currentConversation: conversationId, loading: false
            });

            //mark messages as read
            return data;
        } catch (error) {
            set({ error: error?.response?.data?.message || error?.message, loading: false });
            return [];
        }
    },
    sendMessage: async (formData) => {
        const socket = getSocket();
        if (!socket) return;
        socket.emit('send_message', formData);
    },
    receiveMessage: (message) => {
        if (!message) return;
        const { currentConversation, currentUser, messages } = get();
        const messageExists = message.some((msg) => msg._id === message._id);
        if (messageExists) return;
        if (message.conversation === currentConversation) {
            set((state) => ({
                messages: [...state.messages, message]
            }));
        }

        //update conversations preview and unread count
        set((state) => {
            const updatedConversations = state.conversations?.data?.map((conv) => {
                if (conv._id === message.conversationId) {
                    return {
                        ...conv,
                        lastMessage: message,
                        unreadCount: message?.receiver?._id === currentUser._id
                            ? (conv.unreadCount || 0) + 1
                            : conv.unreadCount || 0
                    };
                }
                return conv;
            });

            return {
                conversations: {
                    ...state.conversations,
                    data: updatedConversations
                }
            };
        });

    }
    //mark messages as read
    markMessagesAsRead: async () => {
        const { currentUser, messages } = get();
        if (!currentUser || messages.length === 0) return;
        const unreadIds = messages.filter((msg) =>
            msg.messageStatus !== 'read' && msg.receiver?._id === currentUser?._id)
            .map((msg) => msg._id).filter(Boolean);
        if (unreadIds.length === 0) return;
        try {
            const { data } = await axiosInstance.put('/chats/messages/read', {
                messageIds: unreadIds
            });
            set((state) => ({
                messages: state.messages.map((msg) =>
                    unreadIds.includes(msg._id) ? { ...msg, messageStatus: 'read' } : msg
                )
            }));
            return data;
        } catch (error) {
            console.error('Error marking messages as read:', error);
}));