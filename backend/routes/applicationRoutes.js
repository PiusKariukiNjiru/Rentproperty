
const express = require('express');
const router = express.Router();
const {
  createApplication,
  getApplications,
  updateApplicationStatus,
  getApplicationByPropertyAndTenant,
} = require('../controllers/applicationController');
const { protect, authorizeTenant, authorizeLandlord } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

// @route   POST api/applications
// @desc    Create a new application
// @access  Private (Tenant only)
router.post(
  '/',
  [
    protect,
    authorizeTenant,
    body('propertyId', 'Property ID is required').not().isEmpty(),
  ],
  createApplication
);

// @route   GET api/applications
// @desc    Get applications for current user
// @access  Private
router.get('/', protect, getApplications);

// @route   PUT api/applications/:id/status
// @desc    Update application status
// @access  Private (Landlord only)
router.put(
  '/:id/status',
  [
    protect,
    authorizeLandlord,
    body('status', 'Status is required').isIn(['Pending', 'View Scheduled', 'Under Review', 'Accepted', 'Rejected']),
  ],
  updateApplicationStatus
);

// @route   GET api/applications/property/:propertyId/tenant/:tenantId
// @desc    Get application by property and tenant
// @access  Private
router.get('/property/:propertyId/tenant/:tenantId', protect, getApplicationByPropertyAndTenant);

module.exports = router;

