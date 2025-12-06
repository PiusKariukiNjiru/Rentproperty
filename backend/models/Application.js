
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  applicationDate: { // Handled by timestamps: true, or set manually
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'View Scheduled', 'Under Review', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  messageToLandlord: { // Optional initial message from tenant
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
