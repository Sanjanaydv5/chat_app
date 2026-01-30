import { create } from 'zustand';
import { getSocket } from "../services/chat.service";
import  axiosInstance  from "../services/url.service";


export const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),



    //socket event listeners setup
    initSocketListeners: () => {
        const socket = getSocket(); // Assume getSocket is a function that returns the socket instance
        if (!socket) return;

        //remove existing listeners to avoid duplicates
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_status');
        socket.off('send_message');
        socket.off('message_error');
        socket.off('message_delete');
        socket.off('message_read');
        socket.off('reaction_update');

        //listen for incoming messages
        socket.on('receive_message', (message) => {
            const { currentConversation, messages, currentUser } = get();
            
            // Add message if it doesn't already exist and belongs to current conversation
            const messageExists = messages.some((msg) => msg._id === message._id);
            if (!messageExists && message.conversation === currentConversation) {
                set({ messages: [...messages, message] });
            }
            
            // Always update conversations list with new message
            set((state) => {
                const updatedConversations = state.conversations?.data?.map((conv) => {
                    if (conv._id === message.conversation) {
                        return {
                            ...conv,
                            lastMessage: message,
                            unreadCount: message?.receiver?._id === currentUser?._id
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
        });

        //listen for message read updates
        socket.on('message_read', (updatedMessage) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === updatedMessage._id 
                        ? { ...msg, messageStatus: updatedMessage.messageStatus } 
                        : msg
                )
            }));
        });

        //confirm message sent
        socket.on('message_send', (message) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === message._id ? { ...msg, messageStatus: 'sent' } : msg
                )
            }));
        });

        //Update message status
        socket.on('message_status_update', ({ messageId, messageStatus }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, messageStatus: messageStatus } : msg
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
        const { conversations, currentUser } = get();
        if (conversations?.data?.length > 0) {
            conversations.data?.forEach((conv) => {
                const otherUser = conv.participants.find(
                    (p) => p._id !== currentUser?._id
                );
                if (otherUser?._id) {
                    socket.emit("get_user_status", otherUser._id, (status) => {
                        set((state) => {
                            const newOnlineUsers = new Map(state.onlineUsers);
                            newOnlineUsers.set(otherUser._id, {
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

            get().initSocketListeners();
            return data;
        } catch (error) {
            set({ error: error?.response?.data?.message || error?.message, loading: false });
            return null;
        }
    },

    //fetch messages for a conversation
    fetchMessages: async (conversationId) => {
        if (!conversationId) {
            console.log("fetchMessages: No conversationId provided");
            return;
        }
        console.log("fetchMessages: Fetching messages for conversation:", conversationId);
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get(
                `/chats/conversations/${conversationId}/messages`
            );
            console.log("fetchMessages: Response data:", data);
            const messageArray = data.data || data || [];
            console.log("fetchMessages: Message array:", messageArray);
            set({
                messages: messageArray,
                currentConversation: conversationId, loading: false
            });

            //mark messages as read
            const { markMessagesAsRead } = get();
            markMessagesAsRead();

            return messageArray;
        } catch (error) {
            console.error("fetchMessages: Error:", error);
            set({ error: error?.response?.data?.message || error?.message, loading: false });
            return [];
        }
    },
    //send message in real time
    sendMessage: async (formData) => {
        console.log("chatStore sendMessage called");
        const senderId = formData.get("senderId");
        const receiverId = formData.get("receiverId");
        const media = formData.get("media");
        const content = formData.get("content");
        const messageStatus = formData.get("messageStatus");
        
        console.log("FormData values:", { senderId, receiverId, content, messageStatus, media: media?.name });


        const { conversations } = get();
        let conversationId = null;
        if (conversations?.data?.length > 0) {
            const conversation = conversations.data.find((conv) =>
                conv.participants.some((p) => p._id === senderId) &&
                conv.participants.some((p) => p._id === receiverId));
            if (conversation) {
                conversationId = conversation._id;
                set({ currentConversation: conversation._id })
            }
        }
        //temp message before actual response
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            sender: { _id: senderId },
            receiver: { _id: receiverId },
            conversation: conversationId,
            imageOrVideoUrl: media && typeof media !== 'string' ? URL.createObjectURL(media) : null,
            content:content,
            contentType : media ? media.type.startsWith("image") ? "image" : "video" : "text",
            createdAt : new Date().toISOString(),
            messageStatus,
        };
        set((state) => ({
    messages: [...state.messages, optimisticMessage]
}));
        try {
    const response = await axiosInstance.post(
        "/chats/send-message",
        formData,
        {
            headers: {
                // Let axios set the boundary automatically
                "Content-Type": "multipart/form-data",
            },
        }
    );
    
    console.log("sendMessage response:", response.data);

    const messageData = response.data?.data ?? response.data;
    console.log("sendMessage messageData:", messageData);

    // Replace optimistic message with real one
    set((state) => ({
        messages: state.messages.map((msg) =>
            msg._id === tempId ? messageData : msg
        ),
        currentConversation: messageData.conversation ?? state.currentConversation,
        error: null,
    }));

    return messageData;
} catch (error) {
    console.error("Error sending message", error);

    set((state) => ({
        messages: state.messages.map((msg) =>
            msg._id === tempId
                ? { ...msg, messageStatus: "failed" }
                : msg
        ),
        error:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to send message",
    }));

    throw error;
}

    },
    receiveMessage: (message) => {
        if (!message) return;
        const { currentConversation, currentUser } = get();
        const { messages } = get();
        const messageExists = messages.some((msg) => msg._id === message._id);
        if (messageExists) return;
        if (message.conversation === currentConversation) {
            set((state) => ({
                messages: [...state.messages, message]
            }));
            //automatically mark messages as read
            if (message.receiver?._id === currentUser?._id) {
                const { markMessagesAsRead } = get();
                markMessagesAsRead();
            }
        }

        //update conversations preview and unread count
        set((state) => {
            const updatedConversations = state.conversations?.data?.map((conv) => {
                if (conv._id === message.conversation) {
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

    },
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
            console.log('Marked messages as read:', data);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    unreadIds.includes(msg._id) ? { ...msg, messageStatus: 'read' } : msg
                )
            }));
            const socket = getSocket();
            if (socket) {
                socket.emit('messages_read', { messageIds: unreadIds, senderId: messages[0].sender?._id });
            }
            return data;
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    },
    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/chats/messages/${messageId}`);
            set((state) => ({
                messages: state.messages?.filter((msg) => msg?._id !== messageId)
            }));
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            set({ error: error?.response?.data?.message || error?.message });
            return false;
        }
    },
    //add/change reaction on a message
    addReaction: async (messageId, emoji) => {
        const socket = getSocket();
        const { currentUser } = get();
        if (socket && currentUser) {
            socket.emit('add_reaction', {
                messageId,
                emoji,
                reactionUserId: currentUser?._id
            });
        }
    },
    //start typing indicator
    startTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();
        if (socket && currentConversation && receiverId) {
            socket.emit('typing_start', {
                conversationId: currentConversation,
                receiverId
            });
        }
    },
    //stop typing indicator
    stopTyping: (receiverId) => {
        const { currentConversation } = get();
        const socket = getSocket();
        if (socket && currentConversation && receiverId) {
            socket.emit('typing_stop', {
                conversationId: currentConversation,
                receiverId
            });
        }
    },
    //is user typing in current conversation
    isUserTyping: (userId) => {
        const { currentConversation, typingUsers } = get();
        if (!currentConversation || !typingUsers.has(currentConversation) || !userId) {
            return false
        };
        return typingUsers.get(currentConversation).has(userId);
    },
    //get online status of a user
    isUserOnline: (userId) => {
        if (!userId) return null;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.isOnline || false;
    },
    //get last seen of a user
    getUserLastSeen: (userId) => {
        if (!userId) return null;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.lastSeen || null;
    },
    //clear chat store
    cleanup: () => {
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            loading: false,
            error: null,
            onlineUsers: new Map(),
            typingUsers: new Map(),
        });
    }
}));