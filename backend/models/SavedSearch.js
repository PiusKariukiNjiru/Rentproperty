const mongoose = require('mongoose');

const SavedSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  searchCriteria: {
    // Store all search parameters
    q: String, // Keywords
    loc: String, // Location
    minPrice: String,
    maxPrice: String,
    type: String, // Property type
    bedrooms: String,
    bathrooms: String,
    amenities: [String],
    radius: String,
    lat: String,
    lng: String,
  },
  emailAlerts: {
    type: Boolean,
    default: true,
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
  lastMatchCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('SavedSearch', SavedSearchSchema);



