
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ['Tenant', 'Landlord'],
    required: true,
  },
  profilePicture: {
    type: String,
    default: '', // URL to profile picture
  },
  idVerified: {
    type: Boolean,
    default: false,
  },
  employmentDetails: { // For tenants
    type: String,
    default: '',
  },
  favoriteProperties: [{ // Array of property IDs
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
  }],
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
