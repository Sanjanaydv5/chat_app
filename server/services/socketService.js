const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");

// userId => Set<socketId>
const onlineUsers = new Map();

// userId => { conversationId: timeout }
const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ["GET", "POST"],
            credentials: true,
        },
        pingTimeout: 60000,
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);
        let userId = null;

        // ================= USER CONNECT =================
        socket.on("user_connected", async (connectingUserId) => {
            console.log("user_connected event received for userId:", connectingUserId);
            userId = connectingUserId;
            
            // Join a room named after the userId. This allows us to target multiple sessions/tabs.
            socket.join(userId);

            // Track all active sockets for this user to support multiple sessions/tabs.
            let userSockets = onlineUsers.get(userId);
            if (!userSockets) {
                userSockets = new Set();
                onlineUsers.set(userId, userSockets);
            }
            userSockets.add(socket.id);

            // Clean up this socket from the user's set when it disconnects.
            socket.once("disconnect", () => {
                const socketsForUser = onlineUsers.get(userId);
                if (!socketsForUser) return;
                socketsForUser.delete(socket.id);
                if (socketsForUser.size === 0) {
                    onlineUsers.delete(userId);
                }
            });

            await User.findByIdAndUpdate(userId, {
                isOnline: true,
                lastSeen: new Date(),
            });

            // Broadcast to all clients that this user is online
            io.emit("user_status", { userId, isOnline: true });
            console.log("Broadcasted user_status for userId:", userId);
        });

        // ================= GET USER STATUS =================
        socket.on("get_user_status", (requestedUserId, callback) => {
            const socketsForUser = onlineUsers.get(requestedUserId);
            const isOnline = !!(socketsForUser && socketsForUser.size > 0);
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,
            });
        });

        // ================= SEND MESSAGE =================
        socket.on("send_message", (message) => {
            const receiverId = message.receiver?._id || message.receiver;
            if (receiverId) {
                // Emit to the receiver's room (which includes all their active sockets)
                io.to(receiverId.toString()).emit("receive_message", message);
            }
        });

        // ================= TYPING START =================//
        socket.on("typing_start", ({ conversationId, receiverId }) => {
            if (!userId || !receiverId) return;

            io.to(receiverId.toString()).emit("user_typing", {
                conversationId,
                userId,
                isTyping: true,
            });
        });

        // ================= TYPING STOP =================
        socket.on("typing_stop", ({ conversationId, receiverId }) => {
            if (!userId || !receiverId) return;

            io.to(receiverId.toString()).emit("user_typing", {
                conversationId,
                userId,
                isTyping: false,
            });
        });

        // ================= ADD REACTION =================
        socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message) return;

                const index = message.reactions.findIndex(
                    (r) => r.user.toString() === reactionUserId
                );

                if (index > -1) {
                    if (message.reactions[index].emoji === emoji) {
                        message.reactions.splice(index, 1);
                    } else {
                        message.reactions[index].emoji = emoji;
                    }
                } else {
                    message.reactions.push({ user: reactionUserId, emoji });
                }

                await message.save();

                const populatedMessage = await Message.findById(messageId)
                    .populate("sender", "username profilePicture")
                    .populate("receiver", "username profilePicture")
                    .populate("reactions.user", "username");

                const update = {
                    messageId,
                    reactions: populatedMessage.reactions,
                };

                const senderId = populatedMessage.sender._id.toString();
                const receiverId = populatedMessage.receiver._id.toString();

                io.to(senderId).emit("reaction_update", update);
                io.to(receiverId).emit("reaction_update", update);
            } catch (error) {
                console.error("Reaction error:", error);
            }
        });

        // ================= DISCONNECT =================
        socket.on("disconnect", async () => {
            if (!userId) return;

            onlineUsers.delete(userId);

            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date(),
            });

            io.emit("user_status", {
                userId,
                isOnline: false,
                lastSeen: new Date(),
            });

            console.log("User disconnected:", userId);
        });

        // ================= VIDEO CALL SIGNALING =================
        socket.on("call_user", (data) => {
            const { userToCall, signalData, from, name } = data;
            console.log(`call_user: ${from} calling ${userToCall}`);
            io.to(userToCall).emit("call_incoming", {
                signal: signalData,
                from,
                name
            });
        });

        socket.on("answer_call", (data) => {
            const { to, signal } = data;
            console.log(`answer_call: answering to ${to}`);
            io.to(to).emit("call_accepted", signal);
        });

        socket.on("ice_candidate", (data) => {
            const { to, candidate } = data;
            io.to(to).emit("ice_candidate", candidate);
        });

        socket.on("end_call", (data) => {
            const { to } = data;
            io.to(to).emit("call_ended");
        });
    });

    io.socketUserMap = onlineUsers;
    return io;
};

module.exports = initializeSocket;
