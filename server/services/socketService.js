const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");

// userId => socketId
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
            onlineUsers.set(userId, socket.id);
            socket.join(userId);
            
            console.log("Online users map:", Array.from(onlineUsers.entries()));

            await User.findByIdAndUpdate(userId, {
                isOnline: true,
                lastSeen: new Date(),
            });

            io.emit("user_status", { userId, isOnline: true });
            console.log("Broadcasted user_status for userId:", userId);
        });

        // ================= GET USER STATUS =================
        socket.on("get_user_status", (requestedUserId, callback) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,
            });
        });

        // ================= TYPING START =================//
        socket.on("typing_start", ({ conversationId, receiverId }) => {
            if (!userId) return;

            socket.to(receiverId).emit("user_typing", {
                conversationId,
                userId,
                isTyping: true,
            });
        });

        // ================= TYPING STOP =================
        socket.on("typing_stop", ({ conversationId, receiverId }) => {
            if (!userId) return;

            socket.to(receiverId).emit("user_typing", {
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

                const senderSocket = onlineUsers.get(
                    populatedMessage.sender._id.toString()
                );
                const receiverSocket = onlineUsers.get(
                    populatedMessage.receiver._id.toString()
                );

                if (senderSocket) io.to(senderSocket).emit("reaction_update", update);
                if (receiverSocket) io.to(receiverSocket).emit("reaction_update", update);
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
    });

    io.socketUserMap = onlineUsers;
    return io;
};

module.exports = initializeSocket;
