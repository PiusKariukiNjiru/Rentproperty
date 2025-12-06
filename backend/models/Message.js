
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
}, { _id: true });

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
  },
  conversationId: {
    type: String,
    index: true,
  },
  subject: {
    type: String,
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [AttachmentSchema],
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
}, { timestamps: true });

// Generate conversation ID from participants and property
MessageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    const participants = [this.senderId.toString(), this.receiverId.toString()].sort();
    const propertyPart = this.propertyId ? `-${this.propertyId.toString()}` : '';
    this.conversationId = `${participants[0]}-${participants[1]}${propertyPart}`;
  }
  next();
});

// Index for efficient conversation queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ content: 'text', subject: 'text' });

module.exports = mongoose.model('Message', MessageSchema);
