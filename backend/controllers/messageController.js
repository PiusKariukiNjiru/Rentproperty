
const Message = require('../models/Message');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Helper to transform message for frontend
const transformMessage = (msgObj) => {
  return {
    ...msgObj,
    id: msgObj._id.toString(),
    senderId: typeof msgObj.senderId === 'object' && msgObj.senderId 
      ? { ...msgObj.senderId, id: msgObj.senderId._id.toString() }
      : msgObj.senderId?.toString(),
    receiverId: typeof msgObj.receiverId === 'object' && msgObj.receiverId 
      ? { ...msgObj.receiverId, id: msgObj.receiverId._id.toString() }
      : msgObj.receiverId?.toString(),
    propertyId: msgObj.propertyId 
      ? (typeof msgObj.propertyId === 'object' 
        ? { ...msgObj.propertyId, id: msgObj.propertyId._id.toString() }
        : msgObj.propertyId.toString())
      : undefined,
    timestamp: msgObj.createdAt,
    attachments: msgObj.attachments?.map(att => ({
      ...att,
      id: att._id?.toString(),
    })) || [],
  };
};

// @desc    Create a new message
// @route   POST /api/messages
// @access  Private
exports.createMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { receiverId, propertyId, subject, content, attachments } = req.body;

  try {
    const newMessage = new Message({
      senderId: req.user.id,
      receiverId,
      propertyId: propertyId || undefined,
      subject: subject || undefined,
      content,
      attachments: attachments || [],
    });

    const message = await newMessage.save();
    await message.populate('senderId', 'name email profilePicture');
    await message.populate('receiverId', 'name email profilePicture');
    if (message.propertyId) {
      await message.populate('propertyId', 'title');
    }

    const msgObj = message.toObject();
    const transformedMessage = transformMessage(msgObj);
    
    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${receiverId}`).emit('newMessage', transformedMessage);
      io.to(`user-${req.user.id}`).emit('messageSent', transformedMessage);
    }

    res.status(201).json(transformedMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get messages for current user
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    })
    .populate('senderId', 'name email profilePicture')
    .populate('receiverId', 'name email profilePicture')
    .populate('propertyId', 'title')
    .sort({ createdAt: -1 });

    const transformedMessages = messages.map(msg => transformMessage(msg.toObject()));
    res.json(transformedMessages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get conversation threads (grouped by property/user)
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all unique conversations for this user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: require('mongoose').Types.ObjectId.createFromHexString(userId) },
            { receiverId: require('mongoose').Types.ObjectId.createFromHexString(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiverId', require('mongoose').Types.ObjectId.createFromHexString(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate the last messages
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await Message.findById(conv.lastMessage._id)
          .populate('senderId', 'name email profilePicture')
          .populate('receiverId', 'name email profilePicture')
          .populate('propertyId', 'title');
        
        return {
          conversationId: conv._id,
          lastMessage: lastMsg ? transformMessage(lastMsg.toObject()) : null,
          unreadCount: conv.unreadCount,
          messageCount: conv.messageCount,
        };
      })
    );

    res.json(populatedConversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Private
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email profilePicture')
      .populate('receiverId', 'name email profilePicture')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversationId });
    
    const transformedMessages = messages.map(msg => transformMessage(msg.toObject()));
    
    res.json({
      messages: transformedMessages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
exports.searchMessages = async (req, res) => {
  try {
    const { q, propertyId, userId: otherUserId } = req.query;
    const currentUserId = req.user.id;

    let query = {
      $or: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ]
    };

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Filter by property
    if (propertyId) {
      query.propertyId = propertyId;
    }

    // Filter by other user
    if (otherUserId) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { senderId: otherUserId },
            { receiverId: otherUserId }
          ]
        }
      ];
      delete query.$or;
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name email profilePicture')
      .populate('receiverId', 'name email profilePicture')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .limit(100);

    const transformedMessages = messages.map(msg => transformMessage(msg.toObject()));
    res.json(transformedMessages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to mark this message as read' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    await message.populate('senderId', 'name email profilePicture');
    await message.populate('receiverId', 'name email profilePicture');
    if (message.propertyId) {
      await message.populate('propertyId', 'title');
    }

    const msgObj = message.toObject();
    const transformedMessage = transformMessage(msgObj);

    // Emit read receipt via socket
    const io = req.app.get('io');
    if (io) {
      const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
      io.to(`user-${senderId}`).emit('messageRead', { 
        messageId: message._id.toString(),
        readAt: message.readAt 
      });
    }

    res.json(transformedMessage);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Message not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Mark all messages in conversation as read
// @route   PUT /api/messages/conversation/:conversationId/read
// @access  Private
exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: req.user.id,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    // Emit read receipts via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation-${conversationId}`).emit('conversationRead', {
        conversationId,
        readBy: req.user.id,
        readAt: new Date()
      });
    }

    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Upload attachment
// @route   POST /api/messages/upload
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/messages/${req.file.filename}`,
    };

    res.json(attachment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    // Only sender can delete
    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    
    // Emit delete event
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation-${message.conversationId}`).emit('messageDeleted', {
        messageId: req.params.id,
        conversationId: message.conversationId
      });
    }

    res.json({ msg: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
