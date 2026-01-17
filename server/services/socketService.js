const { Server } = require("socket.io");
const User = require("../models/User");
const conversation = require("../models/conversation");
const Message = require("../models/Message");

//Map to store online users --> userId, socketId
const onlineUsers = new Map();

//Map to track typing status --> conversationId, Set of userIds: boolen
const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true,
        },
        pingTimeout: 60000, // 60 seconds to disconnect inactive clients
    });
    //when a new socket connection is established
    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);
        let userId = null;

        //Handle user connection and store in onlineUsers map
        socket.on("user-connected", async (connectingUserId) => {
            userId = connectingUserId;
            onlineUsers.set(userId, socket.id);
            socket.join(userId); //join room with userId
            //Update user status to online in DB
            await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
        });
    });

    //notify all users that a user is online
    io.emit("user_status", { userId, isOnline: true });


};
//return online status of requested users

socket.on("get_user_status", async (requestedUserIds, callback) => {
    const isOnline = onlineUsers.has(requestedUserIds);
    callback({ userId: requestedUserIds, isOnline, lastSeen: isOnline ? new Date() : null });
});

//forward message to receiver if online
socket.on("send_message", async (messageData) => {
    try {
        const receiverSocketId = onlineUsers.get(message.receiver?._id);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", message);
        }
    } catch (error) {
        console.error("Error Sending message:", error);
        socket.emit("error", { message: "Error sending message" });
    }
});

//Update messages as read and notify sender
socket.on("messages_read", async ({ messageId, senderId }) => {
    try {
        await Message.updateMany(
            { _id: { $in: messageId } },
            { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
            messageId.forEach((messageId) => {
                io.to(senderSocketId).emit("messages_status_update", {
                    messageId,
                    messageStatus: "read"
                });
            });
        }
    } catch (error) {
        console.error("Error updating messages as read:", error);
    }
});

//Handle typing start event and auto-stop after 3s
socket.on("typing_start", ({ conversationId, receiverId }) => {
    if (!userId || !conversationId || !receiverId) return;
    if (!typingUsers.has(userId)) typingUsers.set(userId, {});
    const userTyping = typingUsers.get(userId);
    userTyping[conversationId] = true;

    //Clear any existing timeout
    if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
    }

    //auto-stop typing after 3s of inactivity
    userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", { conversationId, userId, isTyping: false })
    }, 3000);

    //Notify receiver that user has started typing
    socket.to(receiverId).emit("user_typing", { conversationId, userId, isTyping: true });
});

//Handle typing stop event
socket.on("typing_stop", ({ conversationId, receiverId }) => {
    if (!userId || !conversationId || !receiverId) return;
    if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
            clearTimeout(userTyping[`${conversationId}_timeout`]);
            delete userTyping[`${conversationId}_timeout`];
        }
        //Notify receiver that user has stopped typing
        socket.to(receiverId).emit("user_typing", { conversationId, userId, isTyping: false });
    }
});

//Add or update reaction to a message
socket.on("add_reaction", async ({ messageId, emoji, userId, reactionUserId }) => {
    try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactionUserId
        )

        if (existingIndex > -1) {
            const existing = message.reactions(existingIndex)
            if (existing.emoji === emoji) {
                //remove same reactions
                message.reactions.splice(existingIndex, 1)
            } else {
                message.reactions(existingIndex).emoji = emoji;
            }
        } else{
            //add new reactions
            message.reactions.push({user:reactionUserId,emoji});
        }
        await message.save();

        const populateMessage = await Message.findOne(message?.id)
        .populate("sender","username profilePicture")
        .populate("receiver","username profilePicture")
        .populate("reactions.User","username")        

        const reactionUpdated = {
            messageId,
            reaction:populatedMessage.reactions
        }

    } catch (error) {

    }
})