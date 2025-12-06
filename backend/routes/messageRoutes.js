
const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  markMessageAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// @route   POST api/messages
// @desc    Create a new message
// @access  Private
router.post(
  '/',
  [
    protect,
    body('receiverId', 'Receiver ID is required').not().isEmpty(),
    body('content', 'Message content is required').not().isEmpty(),
  ],
  createMessage
);

// @route   GET api/messages
// @desc    Get messages for current user
// @access  Private
router.get('/', protect, getMessages);

// @route   PUT api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', protect, markMessageAsRead);

module.exports = router;

