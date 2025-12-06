
const express = require('express');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    body('phone', 'Phone number is required').not().isEmpty(),
    body('userType', 'User type is required and must be Tenant or Landlord').isIn(['Tenant', 'Landlord']),
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
    body('userType', 'User type is required').isIn(['Tenant', 'Landlord']),
  ],
  loginUser
);

router.get('/me', protect, getCurrentUser); // Example of a protected route to get current user

module.exports = router;
