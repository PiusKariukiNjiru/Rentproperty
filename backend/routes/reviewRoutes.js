const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  moderateReview,
  respondToReview,
  flagReview,
  getReviewStats,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// @route   POST api/reviews
// @desc    Create a new review
// @access  Private
router.post(
  '/',
  [
    protect,
    body('revieweeId', 'Reviewee ID is required').not().isEmpty(),
    body('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
    body('content', 'Review content is required').not().isEmpty().isLength({ min: 10, max: 1000 }),
    body('title', 'Title must be less than 100 characters').optional().isLength({ max: 100 }),
  ],
  createReview
);

// @route   GET api/reviews
// @desc    Get reviews (with optional filters)
// @access  Private
router.get('/', protect, getReviews);

// @route   GET api/reviews/stats/:type/:id
// @desc    Get review statistics for a user or property
// @access  Private
router.get('/stats/:type/:id', protect, getReviewStats);

// @route   GET api/reviews/:id
// @desc    Get a single review
// @access  Private
router.get('/:id', protect, getReviewById);

// @route   PUT api/reviews/:id
// @desc    Update a review
// @access  Private
router.put(
  '/:id',
  [
    protect,
    body('rating', 'Rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
    body('content', 'Review content must be between 10 and 1000 characters').optional().isLength({ min: 10, max: 1000 }),
    body('title', 'Title must be less than 100 characters').optional().isLength({ max: 100 }),
  ],
  updateReview
);

// @route   DELETE api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete('/:id', protect, deleteReview);

// @route   PUT api/reviews/:id/moderate
// @desc    Moderate a review (approve/reject)
// @access  Private
router.put(
  '/:id/moderate',
  [
    protect,
    body('isApproved', 'isApproved must be a boolean').optional().isBoolean(),
    body('moderationNotes', 'Moderation notes must be less than 500 characters').optional().isLength({ max: 500 }),
  ],
  moderateReview
);

// @route   PUT api/reviews/:id/respond
// @desc    Respond to a review
// @access  Private
router.put(
  '/:id/respond',
  [
    protect,
    body('content', 'Response content is required and must be less than 500 characters').not().isEmpty().isLength({ max: 500 }),
  ],
  respondToReview
);

// @route   PUT api/reviews/:id/flag
// @desc    Flag a review as inappropriate
// @access  Private
router.put('/:id/flag', protect, flagReview);

module.exports = router;

