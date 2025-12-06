const express = require('express');
const router = express.Router();
const {
  createSavedSearch,
  getSavedSearches,
  getSavedSearchById,
  updateSavedSearch,
  deleteSavedSearch,
  checkSavedSearches,
} = require('../controllers/savedSearchController');
const { protect } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// @route   POST api/saved-searches
// @desc    Create a saved search
// @access  Private
router.post(
  '/',
  [
    protect,
    body('name', 'Search name is required').not().isEmpty().isLength({ max: 100 }),
    body('searchCriteria', 'Search criteria is required').isObject(),
  ],
  createSavedSearch
);

// @route   GET api/saved-searches
// @desc    Get all saved searches for current user
// @access  Private
router.get('/', protect, getSavedSearches);

// @route   GET api/saved-searches/:id
// @desc    Get a single saved search
// @access  Private
router.get('/:id', protect, getSavedSearchById);

// @route   PUT api/saved-searches/:id
// @desc    Update a saved search
// @access  Private
router.put(
  '/:id',
  [
    protect,
    body('name', 'Search name must be a string').optional().isString().isLength({ max: 100 }),
  ],
  updateSavedSearch
);

// @route   DELETE api/saved-searches/:id
// @desc    Delete a saved search
// @access  Private
router.delete('/:id', protect, deleteSavedSearch);

// @route   POST api/saved-searches/check
// @desc    Check saved searches for new matches
// @access  Private
router.post('/check', protect, checkSavedSearches);

module.exports = router;

