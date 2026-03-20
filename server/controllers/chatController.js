const conversation = require("../models/Conversation");
const response = require("../utils/responseHandler");
const Message = require("../models/Message");
const { uploadFileToCloudinary } = require("../utils/cloudinaryUpload");
const mongoose = require('mongoose');

exports.sendMessage = async (req, res) => {
    // Implementation for sending a message
    try {
        console.log("sendMessage: req.body =", req.body);
        console.log("sendMessage: req.file =", req.file);
        
        const { senderId, receiverId, conversationId, participants, content, messageStatus, groupName } = req.body;
        const file = req.file;

        if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
            console.error("sendMessage: Missing or invalid senderId", senderId);
            return response(res, 400, false, "Valid senderId is required");
        }

        const senderObjectId = new mongoose.Types.ObjectId(senderId);
        let chatConversation;
        let receiverObjectId = null;

        // Resolve conversation: explicit id > group participants > one-to-one receiverId
        if (conversationId) {
            if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                return response(res, 400, false, "Invalid conversationId");
            }

            chatConversation = await conversation.findById(conversationId);
            if (!chatConversation) {
                return response(res, 404, false, "Conversation not found");
            }
        } else if (Array.isArray(participants) && participants.length > 1) {
            const parsedParticipants = [...new Set(participants.concat(senderId))].filter(Boolean);
            const participantIds = parsedParticipants
                .map((id) => mongoose.Types.ObjectId(id));

            // look for exact match by size and members
            chatConversation = await conversation.findOne({
                isGroup: true,
                participants: { $size: participantIds.length, $all: participantIds }
            });

            if (!chatConversation) {
                chatConversation = new conversation({
                    isGroup: true,
                    name: groupName || "New Group",
                    admin: senderObjectId,
                    participants: participantIds,
                    unreadCount: 0
                });
                await chatConversation.save();
            }
        } else if (receiverId) {
            if (!mongoose.Types.ObjectId.isValid(receiverId)) {
                console.error("sendMessage: Invalid receiverId format:", receiverId);
                return response(res, 400, false, "Invalid receiverId format");
            }
            receiverObjectId = new mongoose.Types.ObjectId(receiverId);
            const sortedPair = [senderObjectId, receiverObjectId].sort();
            chatConversation = await conversation.findOne({ participants: sortedPair, isGroup: false });
            if (!chatConversation) {
                chatConversation = new conversation({
                    participants: sortedPair,
                    isGroup: false,
                    unreadCount: 0
                });
                await chatConversation.save();
            }
        } else {
            return response(res, 400, false, "Provide receiverId or participants/group or conversationId");
        }

        if (!chatConversation) {
            return response(res, 500, false, "Unable to resolve conversation");
        }

        let mediaUrl = null;
        let fileName = null;
        let contentType = "text";

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return response(res, 500, false, "File upload failed");
            }
            mediaUrl = uploadFile.secure_url;
            fileName = file.originalname;

            if (file.mimetype.startsWith("image/")) contentType = "image";
            else if (file.mimetype.startsWith("video/")) contentType = "video";
            else if (file.mimetype.startsWith("audio/")) contentType = "audio";
            else contentType = "file";
        } else if (content?.trim()) {
            contentType = "text";
        }

        if (req.body.contentType) {
            contentType = req.body.contentType;
        }

        if (!content?.trim() && !mediaUrl && contentType !== 'sticker') {
            return response(res, 400, false, "Message text or media is required");
        }

        const message = new Message({
            conversation: chatConversation._id,
            sender: senderObjectId,
            receiver: receiverObjectId,
            content: content || "",
            contentType,
            mediaUrl,
            fileName,
            messageStatus: messageStatus || "sent",
        });
        //add message to conversation
        await message.save();

        chatConversation.lastMessage = message._id;
        chatConversation.unreadCount += 1;
        await chatConversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        // Emit socket event to all recipients
        // Emit socket event to all recipients using rooms
        if (req.io) {
            const participantIds = chatConversation.participants.map((id) => id.toString());
            participantIds.forEach((participantId) => {
                if (participantId === senderId) return; // no need to emit to sender
                req.io.to(participantId).emit("receive_message", populatedMessage);
            });

            if (receiverObjectId) {
                // Only mark as delivered if the receiver is actually online / has active sockets.
                let isReceiverOnline = false;

                // Prefer an explicit user-to-socket map if provided on the request.
                if (req.socketUserMap && typeof req.socketUserMap.has === "function") {
                    isReceiverOnline = req.socketUserMap.has(receiverId);
                } else if (req.io.sockets && req.io.sockets.adapter && req.io.sockets.adapter.rooms) {
                    // Fallback: check whether the receiver's room currently has any sockets.
                    const room = req.io.sockets.adapter.rooms.get
                        ? req.io.sockets.adapter.rooms.get(receiverId)
                        : req.io.sockets.adapter.rooms[receiverId];
                    if (room && ((room.size && room.size > 0) || Object.keys(room.sockets || {}).length > 0)) {
                        isReceiverOnline = true;
                    }
                }

                if (isReceiverOnline) {
                    message.messageStatus = "delivered";
                    await message.save();
                }
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
    const userId = req.user.id;
    console.log("getConversation: userId from token:", userId);
    try {
        let conversations = await conversation.find({ participants: userId })
            .populate("participants","username profilePicture isOnline lastSeen")
            .populate({ path: "lastMessage", populate: { path: "sender receiver", select: "username profilePicture" } })
            .sort({ updatedAt: -1 });
        
        console.log("getConversation: Found conversations:", conversations.length);
        return response(res, 200, true, "Conversations fetched successfully", conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return response(res, 500, false, "Internal server error");
    }
};

// get messages in a conversation
exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    console.log("getMessages: userId=", userId, "conversationId=", conversationId);
    try {
        const chatConversation = await conversation.findById(conversationId);
        if (!chatConversation || !chatConversation.participants.includes(userId)) {
            console.log("getMessages: Conversation not found or user not participant");
            return response(res, 404, false, "Conversation not found");
        }
        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort({ createdAt: 1 });
        console.log("getMessages: Found messages:", messages.length);
        await Message.updateMany(
            { conversation: conversationId, receiver: userId, messageStatus: { $in: ["sent", "delivered"] } },
            { $set: { messageStatus: "read" } }
        );

        chatConversation.unreadCount = 0;
        await chatConversation.save();
        
        return response(res, 200, true, "Messages fetched successfully", messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return response(res, 500, false, "Internal server error");
    }
};

exports.markAsRead = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.user.id;
    try {
        //get relevant messages to determine senders      
        let messages = await Message.find({ _id: { $in: messageIds }, receiver: userId });
        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

        //notify to original sender
        //notify to original sender using rooms
        if (req.io) {
            for (const message of messages) {
                const updateMessage = {
                    _id: message._id,
                    messageStatus: "read",
                };
                req.io.to(message.sender.toString()).emit("message_read", updateMessage);
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
    const userId = req.user.id;
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
        //emit socket event using rooms
        if (req.io) {
            req.io.to(message.receiver.toString()).emit("message_deleted", messageId);
        }

        return response(res, 200, true, "Message deleted successfully");
    } catch (error) {
        console.error("Error deleting message:", error);
        return response(res, 500, false, "Internal server error");
    }
};