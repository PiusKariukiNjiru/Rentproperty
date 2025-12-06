const SavedSearch = require('../models/SavedSearch');
const Property = require('../models/Property');
const { validationResult } = require('express-validator');

// @desc    Create a saved search
// @route   POST /api/saved-searches
// @access  Private
exports.createSavedSearch = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, searchCriteria, emailAlerts } = req.body;

  try {
    const savedSearch = new SavedSearch({
      userId: req.user.id,
      name,
      searchCriteria,
      emailAlerts: emailAlerts !== undefined ? emailAlerts : true,
    });

    const saved = await savedSearch.save();
    const savedObj = saved.toObject();
    
    res.status(201).json({
      ...savedObj,
      id: savedObj._id.toString(),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all saved searches for a user
// @route   GET /api/saved-searches
// @access  Private
exports.getSavedSearches = async (req, res) => {
  try {
    const savedSearches = await SavedSearch.find({ userId: req.user.id, isActive: true })
      .sort({ createdAt: -1 });
    
    const transformed = savedSearches.map(search => {
      const searchObj = search.toObject();
      return {
        ...searchObj,
        id: searchObj._id.toString(),
      };
    });
    
    res.json(transformed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get a single saved search
// @route   GET /api/saved-searches/:id
// @access  Private
exports.getSavedSearchById = async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!savedSearch) {
      return res.status(404).json({ msg: 'Saved search not found' });
    }

    const searchObj = savedSearch.toObject();
    res.json({
      ...searchObj,
      id: searchObj._id.toString(),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a saved search
// @route   PUT /api/saved-searches/:id
// @access  Private
exports.updateSavedSearch = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const savedSearch = await SavedSearch.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!savedSearch) {
      return res.status(404).json({ msg: 'Saved search not found' });
    }

    const { name, searchCriteria, emailAlerts, isActive } = req.body;
    
    if (name) savedSearch.name = name;
    if (searchCriteria) savedSearch.searchCriteria = searchCriteria;
    if (emailAlerts !== undefined) savedSearch.emailAlerts = emailAlerts;
    if (isActive !== undefined) savedSearch.isActive = isActive;

    const updated = await savedSearch.save();
    const updatedObj = updated.toObject();
    
    res.json({
      ...updatedObj,
      id: updatedObj._id.toString(),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a saved search
// @route   DELETE /api/saved-searches/:id
// @access  Private
exports.deleteSavedSearch = async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!savedSearch) {
      return res.status(404).json({ msg: 'Saved search not found' });
    }

    await savedSearch.deleteOne();
    res.json({ msg: 'Saved search removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Check saved searches for new matches (for email alerts)
// @route   POST /api/saved-searches/check
// @access  Private (or could be a cron job endpoint)
exports.checkSavedSearches = async (req, res) => {
  try {
    // This would typically be called by a cron job or scheduled task
    // For now, we'll make it accessible to users to manually trigger
    const userId = req.user?.id || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ msg: 'User ID required' });
    }

    const savedSearches = await SavedSearch.find({
      userId,
      isActive: true,
      emailAlerts: true,
    });

    const results = [];

    for (const search of savedSearches) {
      // Build query from search criteria
      const queryFilter = {};
      const orConditions = [];
      const { searchCriteria } = search;

      if (searchCriteria.q) {
        orConditions.push(
          { title: { $regex: searchCriteria.q, $options: 'i' } },
          { description: { $regex: searchCriteria.q, $options: 'i' } }
        );
      }

      if (searchCriteria.loc) {
        orConditions.push(
          { address: { $regex: searchCriteria.loc, $options: 'i' } },
          { city: { $regex: searchCriteria.loc, $options: 'i' } },
          { zipCode: { $regex: searchCriteria.loc, $options: 'i' } }
        );
      }

      if (orConditions.length > 0) {
        queryFilter.$or = orConditions;
      }

      if (searchCriteria.minPrice || searchCriteria.maxPrice) {
        queryFilter.price = {};
        if (searchCriteria.minPrice) queryFilter.price.$gte = parseInt(searchCriteria.minPrice);
        if (searchCriteria.maxPrice) queryFilter.price.$lte = parseInt(searchCriteria.maxPrice);
      }

      if (searchCriteria.type) queryFilter.propertyType = searchCriteria.type;
      if (searchCriteria.bedrooms) queryFilter.bedrooms = parseInt(searchCriteria.bedrooms);
      if (searchCriteria.bathrooms) queryFilter.bathrooms = parseInt(searchCriteria.bathrooms);
      if (searchCriteria.amenities && searchCriteria.amenities.length > 0) {
        queryFilter.amenities = { $all: searchCriteria.amenities };
      }

      // Execute search
      const properties = await Property.find(queryFilter);
      const matchCount = properties.length;

      // Check if there are new matches
      const hasNewMatches = matchCount > search.lastMatchCount;

      // Update last checked time and match count
      search.lastChecked = new Date();
      search.lastMatchCount = matchCount;
      await search.save();

      results.push({
        searchId: search._id.toString(),
        searchName: search.name,
        matchCount,
        hasNewMatches,
        newMatches: hasNewMatches ? matchCount - search.lastMatchCount : 0,
      });
    }

    res.json({ results });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

