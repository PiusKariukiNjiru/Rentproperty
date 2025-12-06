
const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  photos: [{ // Array of URLs or base64 Data URLs
    type: String,
  }],
  price: {
    type: Number,
    required: true,
  },
  propertyType: {
    type: String,
    enum: ['Apartment', 'House', 'Condo', 'Townhouse', 'Room'],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  availabilityDate: {
    type: Date,
    required: true,
  },
  tenantRequirements: {
    type: String,
    default: '',
  },
  bedrooms: {
    type: Number,
    min: 0,
  },
  bathrooms: {
    type: Number,
    min: 0,
  },
  amenities: [{
    type: String,
    enum: ['parking', 'laundry', 'pet-friendly', 'furnished', 'air-conditioning', 'heating', 'wifi', 'dishwasher', 'gym', 'pool', 'balcony', 'garden', 'elevator', 'security', 'storage'],
  }],
  squareFootage: {
    type: Number,
    min: 0,
  },
  petPolicy: {
    type: String,
    enum: ['no-pets', 'cats-only', 'dogs-only', 'small-pets-only', 'all-pets-allowed', 'case-by-case'],
    default: 'no-pets',
  },
  leaseTerms: [{
    type: String,
    enum: ['month-to-month', '3-months', '6-months', '12-months', '18-months', '24-months', 'flexible'],
  }],
}, { timestamps: true });

module.exports = mongoose.model('Property', PropertySchema);
