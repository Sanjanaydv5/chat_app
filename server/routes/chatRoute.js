const express = require('express');
const rateLimit = require('express-rate-limit');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const {multerMiddleware} = require('../config/cloudinaryConfig');

const router = express.Router();

// Rate limit: max 120 messages per minute per IP (prevents spam)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { status: 'error', message: 'Too many messages, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit: max 300 read requests per minute per IP
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { status: 'error', message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route to send a message

router.post('/send-message', authMiddleware, multerMiddleware, chatController.sendMessage);
router.post('/conversations', authMiddleware, chatController.createGroupConversation);
router.get('/conversations', authMiddleware, chatController.getConversation);
router.get('/conversations/:conversationId/messages', authMiddleware, chatController.getMessages);
router.put('/messages/read', authMiddleware, chatController.markAsRead);
router.delete('/messages/:messageId', authMiddleware, chatController.deleteMessage);

router.post('/send-message', messageLimiter, authMiddleware, multerMiddleware, chatController.sendMessage);
router.get('/conversations', readLimiter, authMiddleware, chatController.getConversation);
router.get('/conversations/:conversationId/messages', readLimiter, authMiddleware, chatController.getMessages);
router.put('/messages/read', readLimiter, authMiddleware, chatController.markAsRead);
router.delete('/messages/:messageId', readLimiter, authMiddleware, chatController.deleteMessage);


module.exports = router;
