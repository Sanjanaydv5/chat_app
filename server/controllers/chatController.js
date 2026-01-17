const conversation = require("../models/conversation");
const response = require("../utils/responseHandler");
const Message = require("../models/Message");
const { uploadFileToCloudinary } = require("../utils/cloudinaryUpload");

exports.sendMessage = async (req, res) => {
    // Implementation for sending a message
    try {
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;
        const participants = [senderId, receiverId].sort(); // Ensure consistent ordering
        //check if conversation exists
        let chatConversation = await conversation.findOne({ participants: participants });
        if (!chatConversation) {
            //create new conversation
            chatConversation = new conversation({ participants, messages: [] });
            await chatConversation.save();
        }
        //create message object
        let imageOrVideoUrl = null;
        let contentType = null;
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);

            if (!uploadFile?.secure_url) {
                return response(res, 500, false, "File upload failed");
            };
            imageOrVideoUrl = uploadFile?.secure_url;

            if (file.mimetype.startsWith("image/")) {
                contentType = "image";
            } else if (file.mimetype.startsWith("video/")) {
                contentType = "video";
            } else {
                return response(res, 400, false, "Unsupported file type");
            }
        } else if (content?.trim()) {
            contentType = "text";
        }
        else {
            return response(res, 400, false, "Message content or file is required");
        }
        const message = new Message({
            conversation: chatConversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus,
        });
        //add message to conversation
        await message.save();

        if (message?.content) {
            chatConversation.lastMessage = message._id;
        }
        chatConversation.unreadCount += 1;
        await chatConversation.save();

        const populatedMessage = await Message.findOne(message?._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

            //emit socket event
            if(req.io && req.socketUserMap){
                const receiverSocketId = req.socketUserMap.get(receiverId);
                if(receiverSocketId){
                    req.io.to(receiverSocketId).emit("receive_message",populatedMessage);
                    message.messageStatus = "delivered";
                    await message.save();
                }
            }

        return response(res, 200, true, "Message sent successfully", populatedMessage);

    } catch (error) {
        console.error("Error sending message:", error);
        return response(res, 500, false, "Internal server error");
    }

};

// get conversation between two users
exports.getConversation = async (req, res) => {
    const userId = req.user.userId;
    try {
        let conversations = await conversation.find({ participants: userId })
            .populate("participants","username profilePicture isOnline lastSeen")
            .populate({ path: "lastMessage", populate: { path: "sender receiver", select: "username profilePicture" } })
            .sort({ updatedAt: -1 });

        return response(res, 200, true, "Conversations fetched successfully", conversation);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return response(res, 500, false, "Internal server error");
    }
};

// get messages in a conversation
exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    try {
        const chatConversation = await conversation.findById(conversationId);
        if (!chatConversation || !chatConversation.participants.includes(userId)) {
            return response(res, 404, false, "Conversation not found");
        }
        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort({ createdAt: 1 });
        await Message.updateMany(
            { conversation: conversationId, receiver: userId, messageStatus:{$in: ("sent", "delivered")} },
            { $set: { messageStatus: "read" } }
        );

        conversation.unreadCount = 0;
        await conversation.save();
        
        return response(res, 200, true, "Messages fetched successfully", messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return response(res, 500, false, "Internal server error");
    }
};

exports.markAsRead = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.user.userId;
    try {
        //get relevant messages to determine senders      
        let messages = await Message.find({ _id: { $in: messageIds }, receiver: userId });
        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

        //notify to original sender
            if(req.io && req.socketUserMap){
                for (const message of messages){
                    const senderSocketId = req.socketUserMap.get(message.sender.toString());
                    if(senderSocketId){
                        const updateMessage = {
                            _id:message._id,
                            messageStatus:"read",
                        };
                        req.io.to(senderSocketId).emit("message_read",updateMessage);
                        await message.save()
                    }
                }
            }

        return response(res, 200, true, "Messages marked as read", messages );
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return response(res, 500, false, "Internal server error");
    }
};

exports.deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return response(res, 404, false, "Message not found");
        };
        if (message.sender.toString() !== userId) {
            return response(res, 403, false, "You can only delete your own messages");
        }
        await message.deleteOne();

        //emit socket event
            if(req.io && req.socketUserMap){
                const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
                if(receiverSocketId){
                    req.io.to(receiverSocketId).emit("message_deleted",messageId)
                }
                
            }

        return response(res, 200, true, "Message deleted successfully");
    } catch (error) {
        console.error("Error deleting message:", error);
        return response(res, 500, false, "Internal server error");
    }
};