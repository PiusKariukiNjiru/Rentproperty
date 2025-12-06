
const Message = require('../models/Message');
const { validationResult } = require('express-validator');

// @desc    Create a new message
// @route   POST /api/messages
// @access  Private
exports.createMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { receiverId, propertyId, subject, content } = req.body;

  try {
    const newMessage = new Message({
      senderId: req.user.id, // from protect middleware
      receiverId,
      propertyId: propertyId || undefined,
      subject: subject || undefined,
      content,
    });

    const message = await newMessage.save();
    await message.populate('senderId', 'name email profilePicture');
    await message.populate('receiverId', 'name email profilePicture');
    if (message.propertyId) {
      await message.populate('propertyId', 'title');
    }

    // Transform _id to id for frontend consistency
    const msgObj = message.toObject();
    res.status(201).json({
      ...msgObj,
      id: msgObj._id.toString(),
      senderId: typeof msgObj.senderId === 'object' && msgObj.senderId 
        ? { ...msgObj.senderId, id: msgObj.senderId._id.toString() }
        : msgObj.senderId.toString(),
      receiverId: typeof msgObj.receiverId === 'object' && msgObj.receiverId 
        ? { ...msgObj.receiverId, id: msgObj.receiverId._id.toString() }
        : msgObj.receiverId.toString(),
      propertyId: msgObj.propertyId 
        ? (typeof msgObj.propertyId === 'object' 
          ? { ...msgObj.propertyId, id: msgObj.propertyId._id.toString() }
          : msgObj.propertyId.toString())
        : undefined,
      timestamp: msgObj.createdAt,
    });
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

    // Transform _id to id for frontend consistency
    const transformedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      return {
        ...msgObj,
        id: msgObj._id.toString(),
        senderId: typeof msgObj.senderId === 'object' && msgObj.senderId 
          ? { ...msgObj.senderId, id: msgObj.senderId._id.toString() }
          : msgObj.senderId.toString(),
        receiverId: typeof msgObj.receiverId === 'object' && msgObj.receiverId 
          ? { ...msgObj.receiverId, id: msgObj.receiverId._id.toString() }
          : msgObj.receiverId.toString(),
        propertyId: msgObj.propertyId 
          ? (typeof msgObj.propertyId === 'object' 
            ? { ...msgObj.propertyId, id: msgObj.propertyId._id.toString() }
            : msgObj.propertyId.toString())
          : undefined,
        timestamp: msgObj.createdAt,
      };
    });

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

    // Only the receiver can mark as read
    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to mark this message as read' });
    }

    message.isRead = true;
    await message.save();
    await message.populate('senderId', 'name email profilePicture');
    await message.populate('receiverId', 'name email profilePicture');
    if (message.propertyId) {
      await message.populate('propertyId', 'title');
    }

    // Transform _id to id for frontend consistency
    const msgObj = message.toObject();
    res.json({
      ...msgObj,
      id: msgObj._id.toString(),
      senderId: typeof msgObj.senderId === 'object' && msgObj.senderId 
        ? { ...msgObj.senderId, id: msgObj.senderId._id.toString() }
        : msgObj.senderId.toString(),
      receiverId: typeof msgObj.receiverId === 'object' && msgObj.receiverId 
        ? { ...msgObj.receiverId, id: msgObj.receiverId._id.toString() }
        : msgObj.receiverId.toString(),
      propertyId: msgObj.propertyId 
        ? (typeof msgObj.propertyId === 'object' 
          ? { ...msgObj.propertyId, id: msgObj.propertyId._id.toString() }
          : msgObj.propertyId.toString())
        : undefined,
      timestamp: msgObj.createdAt,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Message not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};

