const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    content: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    mediaUrl: { type: String },
    fileName: { type: String },
    contentType: { type: String, enum: ['text', 'image', 'video', 'audio', 'file', 'sticker'], default: 'text' },
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String }
    }],
    messageStatus: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' }
},{ timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
//