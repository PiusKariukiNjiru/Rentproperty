const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: false, // Optional - only for property-specific reviews
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    required: false,
    maxlength: 100,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  isModerated: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  moderatedAt: {
    type: Date,
    required: false,
  },
  moderationNotes: {
    type: String,
    required: false,
  },
  // For flagging inappropriate reviews
  isFlagged: {
    type: Boolean,
    default: false,
  },
  flaggedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Response from the reviewee
  response: {
    content: {
      type: String,
      maxlength: 500,
    },
    respondedAt: {
      type: Date,
    },
  },
}, { timestamps: true });

// Index for efficient queries
ReviewSchema.index({ revieweeId: 1, isApproved: 1 });
ReviewSchema.index({ propertyId: 1, isApproved: 1 });
ReviewSchema.index({ reviewerId: 1, revieweeId: 1 }); // Prevent duplicate reviews

module.exports = mongoose.model('Review', ReviewSchema);

