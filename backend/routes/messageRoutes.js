
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createMessage,
  getMessages,
  getConversations,
  getConversationMessages,
  searchMessages,
  markMessageAsRead,
  markConversationAsRead,
  uploadAttachment,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads/messages');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
// @desc    Get all messages for current user
// @access  Private
router.get('/', protect, getMessages);

// @route   GET api/messages/conversations
// @desc    Get conversation threads
// @access  Private
router.get('/conversations', protect, getConversations);

// @route   GET api/messages/conversation/:conversationId
// @desc    Get messages for a specific conversation
// @access  Private
router.get('/conversation/:conversationId', protect, getConversationMessages);

// @route   GET api/messages/search
// @desc    Search messages
// @access  Private
router.get('/search', protect, searchMessages);

// @route   PUT api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', protect, markMessageAsRead);

// @route   PUT api/messages/conversation/:conversationId/read
// @desc    Mark all messages in conversation as read
// @access  Private
router.put('/conversation/:conversationId/read', protect, markConversationAsRead);

// @route   POST api/messages/upload
// @desc    Upload attachment
// @access  Private
router.post('/upload', protect, upload.single('file'), uploadAttachment);

// @route   DELETE api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', protect, deleteMessage);

module.exports = router;
