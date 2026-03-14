const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  isGroup: { type: Boolean, default: false },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  participants: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type:mongoose.Schema.Types.ObjectId, ref: 'Message' },
  unreadCount: { type:Number, default: 0 },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
//