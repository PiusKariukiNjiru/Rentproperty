
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, userType, profilePicture, employmentDetails } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    user = new User({
      name,
      email,
      password, // Password will be hashed by pre-save hook in model
      phone,
      userType,
      profilePicture: profilePicture || `https://picsum.photos/seed/${email.split('@')[0]}/200`, // Default if not provided
      employmentDetails: userType === 'Tenant' ? employmentDetails : undefined,
    });

    await user.save();

    // Transform _id to id for frontend consistency
    res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      profilePicture: user.profilePicture,
      idVerified: user.idVerified,
      employmentDetails: user.employmentDetails,
      favoriteProperties: user.favoriteProperties.map(id => id.toString()),
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, userType } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials or user type' }] });
    }
    
    // Check if userType matches (optional, but good for this app)
    if (user.userType !== userType) {
        return res.status(400).json({ errors: [{msg: 'User type mismatch for this email.'}]});
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }
    
    // Return all necessary user fields, similar to frontend structure
    const userPayload = {
        id: user._id, // frontend uses 'id'
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        profilePicture: user.profilePicture,
        idVerified: user.idVerified,
        employmentDetails: user.employmentDetails,
        favoriteProperties: user.favoriteProperties,
        token: generateToken(user._id), // Token should be separate, not part of user object if stored in context
    };

    // Send back user data and token separately or structure as frontend expects
    // Transform _id to id and convert favoriteProperties ObjectIds to strings
    res.json({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        profilePicture: user.profilePicture,
        idVerified: user.idVerified,
        employmentDetails: user.employmentDetails,
        favoriteProperties: user.favoriteProperties.map(id => id.toString()),
        token: generateToken(user._id),
    });


  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by the 'protect' middleware
        const user = await User.findById(req.user.id).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        // Transform _id to id for frontend compatibility
        const userObj = user.toObject();
        res.json({ 
            id: userObj._id.toString(),
            name: userObj.name,
            email: userObj.email,
            phone: userObj.phone,
            userType: userObj.userType,
            profilePicture: userObj.profilePicture,
            idVerified: userObj.idVerified,
            employmentDetails: userObj.employmentDetails,
            favoriteProperties: userObj.favoriteProperties.map(id => id.toString())
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
