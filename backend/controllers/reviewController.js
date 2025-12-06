const Review = require('../models/Review');
const User = require('../models/User');
const Property = require('../models/Property');
const { validationResult } = require('express-validator');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { revieweeId, propertyId, rating, title, content } = req.body;
  const reviewerId = req.user.id;

  try {
    // Check if reviewee exists
    const reviewee = await User.findById(revieweeId);
    if (!reviewee) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent self-review
    if (reviewerId === revieweeId) {
      return res.status(400).json({ msg: 'You cannot review yourself' });
    }

    // Check if property exists (if provided)
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ msg: 'Property not found' });
      }
      // Verify the property belongs to the reviewee (if reviewee is landlord)
      if (property.landlordId.toString() !== revieweeId) {
        return res.status(400).json({ msg: 'Property does not belong to this landlord' });
      }
    }

    // Check if user has already reviewed this person (for this property if specified)
    const existingReview = await Review.findOne({
      reviewerId,
      revieweeId,
      ...(propertyId && { propertyId }),
    });

    if (existingReview) {
      return res.status(400).json({ msg: 'You have already submitted a review for this user' + (propertyId ? ' and property' : '') });
    }

    // Create review (initially not moderated, not approved)
    const newReview = new Review({
      reviewerId,
      revieweeId,
      propertyId: propertyId || undefined,
      rating,
      title: title || undefined,
      content,
      isModerated: false,
      isApproved: false,
    });

    const review = await newReview.save();

    // Populate reviewer and reviewee info
    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'name email profilePicture userType')
      .populate('revieweeId', 'name email profilePicture userType')
      .populate('propertyId', 'title address photos');

    res.status(201).json({
      ...populatedReview.toObject(),
      id: populatedReview._id,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get reviews for a user or property
// @route   GET /api/reviews
// @access  Private
exports.getReviews = async (req, res) => {
  try {
    const { revieweeId, propertyId, reviewerId, approvedOnly = 'true' } = req.query;

    const query = {};

    if (revieweeId) {
      query.revieweeId = revieweeId;
    }

    if (propertyId) {
      query.propertyId = propertyId;
    }

    if (reviewerId) {
      query.reviewerId = reviewerId;
    }

    // Only show approved reviews by default (unless user is admin or reviewing their own)
    if (approvedOnly === 'true') {
      query.isApproved = true;
    }

    const reviews = await Review.find(query)
      .populate('reviewerId', 'name email profilePicture userType')
      .populate('revieweeId', 'name email profilePicture userType')
      .populate('propertyId', 'title address photos')
      .sort({ createdAt: -1 });

    // Transform _id to id
    const transformedReviews = reviews.map(review => ({
      ...review.toObject(),
      id: review._id,
    }));

    res.json(transformedReviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get a single review
// @route   GET /api/reviews/:id
// @access  Private
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewerId', 'name email profilePicture userType')
      .populate('revieweeId', 'name email profilePicture userType')
      .populate('propertyId', 'title address photos');

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    res.json({
      ...review.toObject(),
      id: review._id,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a review (only by reviewer)
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Check if user is the reviewer
    if (review.reviewerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this review' });
    }

    const { rating, title, content } = req.body;

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (content !== undefined) review.content = content;

    // Reset moderation status when review is updated
    review.isModerated = false;
    review.isApproved = false;

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'name email profilePicture userType')
      .populate('revieweeId', 'name email profilePicture userType')
      .populate('propertyId', 'title address photos');

    res.json({
      ...populatedReview.toObject(),
      id: populatedReview._id,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Check if user is the reviewer or admin
    if (review.reviewerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this review' });
    }

    await review.remove();

    res.json({ msg: 'Review removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Moderate a review (approve/reject)
// @route   PUT /api/reviews/:id/moderate
// @access  Private (Landlord or Admin)
exports.moderateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Check if user is the reviewee (landlord) or admin
    const reviewee = await User.findById(review.revieweeId);
    if (review.revieweeId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to moderate this review' });
    }

    const { isApproved, moderationNotes } = req.body;

    review.isModerated = true;
    review.isApproved = isApproved || false;
    review.moderatedBy = req.user.id;
    review.moderatedAt = new Date();
    if (moderationNotes) {
      review.moderationNotes = moderationNotes;
    }

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'name email profilePicture userType')
      .populate('revieweeId', 'name email profilePicture userType')
      .populate('propertyId', 'title address photos');

    res.json({
      ...populatedReview.toObject(),
      id: populatedReview._id,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Respond to a review
// @route   PUT /api/reviews/:id/respond
// @access  Private
exports.respondToReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Check if user is the reviewee
    if (review.revieweeId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to respond to this review' });
    }

    const { content } = req.body;

    review.response = {
      content,
      respondedAt: new Date(),
    };

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('reviewerId', 'name email profilePicture userType')
      .populate('revieweeId', 'name email profilePicture userType')
      .populate('propertyId', 'title address photos');

    res.json({
      ...populatedReview.toObject(),
      id: populatedReview._id,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Flag a review as inappropriate
// @route   PUT /api/reviews/:id/flag
// @access  Private
exports.flagReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Add user to flaggedBy array if not already there
    if (!review.flaggedBy.includes(req.user.id)) {
      review.flaggedBy.push(req.user.id);
      review.isFlagged = true;
      await review.save();
    }

    res.json({ msg: 'Review flagged' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get average rating for a user or property
// @route   GET /api/reviews/stats/:type/:id
// @access  Private
exports.getReviewStats = async (req, res) => {
  try {
    const { type, id } = req.params;

    let query = {};
    if (type === 'user') {
      query.revieweeId = id;
    } else if (type === 'property') {
      query.propertyId = id;
    } else {
      return res.status(400).json({ msg: 'Invalid type. Use "user" or "property"' });
    }

    query.isApproved = true;

    const reviews = await Review.find(query);

    if (reviews.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
    }

    const totalReviews = reviews.length;
    const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (sumRatings / totalReviews).toFixed(1);

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      averageRating: parseFloat(averageRating),
      totalReviews,
      ratingDistribution,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};



