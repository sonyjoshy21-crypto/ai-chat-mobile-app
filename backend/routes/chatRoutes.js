const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Apply JWT authorization to all chat transactions
router.use(auth);

// @route   GET api/chat/history
router.get('/history', chatController.getChatHistory);

// @route   POST api/chat/message
router.post('/message', chatController.sendMessage);

module.exports = router;
