
const express = require('express');
const router = express.Router();
const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  toggleFavoriteProperty,
} = require('../controllers/propertyController');
const { protect, authorizeLandlord, authorizeTenant } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// @route   POST api/properties
// @desc    Create a property
// @access  Private (Landlord only)
router.post(
  '/',
  [
    protect,
    authorizeLandlord,
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('price', 'Price is required and must be a number').isNumeric(),
    body('propertyType', 'Property type is required').isIn(['Apartment', 'House', 'Condo', 'Townhouse', 'Room']),
    body('address', 'Address is required').not().isEmpty(),
    body('city', 'City is required').not().isEmpty(),
    body('zipCode', 'Zip code is required').not().isEmpty(),
    body('availabilityDate', 'Availability date is required').isISO8601().toDate(),
    // Photos will be an array of base64 strings or URLs
    body('photos', 'Photos must be an array of strings').optional().isArray(),
    body('photos.*', 'Each photo must be a string').optional().isString(),
  ],
  createProperty
);

// @route   GET api/properties
// @desc    Get all properties (with filtering)
// @access  Public
router.get('/', getProperties);

// @route   GET api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', getPropertyById);

// @route   PUT api/properties/:id
// @desc    Update a property
// @access  Private (Landlord only, owner)
router.put(
  '/:id',
  [
    protect,
    authorizeLandlord,
    // Add similar validation as POST if needed, or make fields optional for update
  ],
  updateProperty
);

// @route   DELETE api/properties/:id
// @desc    Delete a property
// @access  Private (Landlord only, owner)
router.delete('/:id', protect, authorizeLandlord, deleteProperty);

// @route   PUT api/properties/:id/favorite
// @desc    Toggle favorite status for a property
// @access  Private (Tenant only)
router.put('/:id/favorite', protect, authorizeTenant, toggleFavoriteProperty);


module.exports = router;
