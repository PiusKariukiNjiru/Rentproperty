
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming User model path

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (ID)
      // Exclude password field by default
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
          return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ msg: 'Not authorized, no token' });
  }
};

// Middleware to authorize based on user type (e.g., Landlord only)
const authorizeLandlord = (req, res, next) => {
    if (req.user && req.user.userType === 'Landlord') {
        next();
    } else {
        res.status(403).json({ msg: 'User not authorized as Landlord' });
    }
};

const authorizeTenant = (req, res, next) => {
    if (req.user && req.user.userType === 'Tenant') {
        next();
    } else {
        res.status(403).json({ msg: 'User not authorized as Tenant' });
    }
};


module.exports = { protect, authorizeLandlord, authorizeTenant };
