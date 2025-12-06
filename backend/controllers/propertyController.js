
const Property = require('../models/Property');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// @desc    Create a property
// @route   POST /api/properties
// @access  Private (Landlord)
exports.createProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, description, photos, price, propertyType, address, city, zipCode,
    latitude, longitude, availabilityDate, tenantRequirements, bedrooms, bathrooms, amenities,
    squareFootage, petPolicy, leaseTerms
  } = req.body;

  try {
    const newProperty = new Property({
      landlordId: req.user.id, // from protect middleware
      title,
      description,
      photos, // Expecting array of base64 strings or URLs
      price,
      propertyType,
      address,
      city,
      zipCode,
      latitude,
      longitude,
      availabilityDate,
      tenantRequirements,
      bedrooms,
      bathrooms,
      amenities,
      squareFootage,
      petPolicy,
      leaseTerms,
    });

    const property = await newProperty.save();
    await property.populate('landlordId', 'name email phone profilePicture');
    
    // Transform _id to id for frontend consistency
    const propObj = property.toObject();
    res.status(201).json({
      ...propObj,
      id: propObj._id.toString(),
      landlordId: typeof propObj.landlordId === 'object' && propObj.landlordId 
        ? { ...propObj.landlordId, id: propObj.landlordId._id.toString() }
        : propObj.landlordId.toString()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all properties (with advanced filtering from query params)
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res) => {
  try {
    const { q, loc, minPrice, maxPrice, type, bedrooms, bathrooms, amenities, radius, lat, lng } = req.query;
    const queryFilter = {};
    const orConditions = [];

    // Build $or conditions for keyword search
    if (q) {
      orConditions.push(
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      );
    }
    
    // Build $or conditions for location search
    if (loc) {
      orConditions.push(
        { address: { $regex: loc, $options: 'i' } },
        { city: { $regex: loc, $options: 'i' } },
        { zipCode: { $regex: loc, $options: 'i' } }
      );
    }

    // If we have any $or conditions, add them to the filter
    if (orConditions.length > 0) {
      queryFilter.$or = orConditions;
    }

    // Price range filtering
    if (minPrice || maxPrice) {
      queryFilter.price = {};
      if (minPrice) queryFilter.price.$gte = parseInt(minPrice);
      if (maxPrice) queryFilter.price.$lte = parseInt(maxPrice);
    }
    
    if (type) queryFilter.propertyType = type;

    // Bedrooms filter
    if (bedrooms) {
      queryFilter.bedrooms = parseInt(bedrooms);
    }

    // Bathrooms filter
    if (bathrooms) {
      queryFilter.bathrooms = parseInt(bathrooms);
    }

    // Amenities filter (all specified amenities must be present)
    if (amenities) {
      // Handle both comma-separated string and array
      const amenitiesArray = Array.isArray(amenities) 
        ? amenities 
        : typeof amenities === 'string' 
          ? amenities.split(',').map(a => a.trim()).filter(a => a)
          : [amenities];
      if (amenitiesArray.length > 0) {
        queryFilter.amenities = { $all: amenitiesArray };
      }
    }

    // Radius search (within X miles of a point)
    let properties;
    if (radius && lat && lng) {
      const radiusInMiles = parseFloat(radius);
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      
      // Convert miles to radians (Earth's radius is approximately 3959 miles)
      const radiusInRadians = radiusInMiles / 3959;
      
      // MongoDB geospatial query - find properties within radius
      // We need to ensure properties have latitude and longitude
      queryFilter.latitude = { $exists: true, $ne: null };
      queryFilter.longitude = { $exists: true, $ne: null };
      
      // Optimize query with select() and lean() for better performance
      properties = await Property.find(queryFilter)
        .select('title price address city photos propertyType bedrooms bathrooms amenities squareFootage petPolicy leaseTerms latitude longitude availabilityDate description tenantRequirements landlordId createdAt updatedAt')
        .populate('landlordId', 'name email phone profilePicture')
        .lean()
        .limit(100); // Limit results for performance
      
      // Filter by distance (MongoDB $geoNear would be better but requires geospatial index)
      // For now, we'll filter in JavaScript
      properties = properties.filter(prop => {
        if (!prop.latitude || !prop.longitude) return false;
        const distance = calculateDistance(centerLat, centerLng, prop.latitude, prop.longitude);
        return distance <= radiusInMiles;
      });
    } else {
      // Optimize query with select() and lean() for better performance
      properties = await Property.find(queryFilter)
        .select('title price address city photos propertyType bedrooms bathrooms amenities squareFootage petPolicy leaseTerms latitude longitude availabilityDate description tenantRequirements landlordId createdAt updatedAt')
        .populate('landlordId', 'name email phone profilePicture')
        .lean()
        .limit(100); // Limit results for performance
    }
    
    // Transform _id to id for frontend consistency
    const transformedProperties = properties.map(prop => {
      const propObj = prop.toObject();
      return {
        ...propObj,
        id: propObj._id.toString(),
        landlordId: typeof propObj.landlordId === 'object' && propObj.landlordId 
          ? { ...propObj.landlordId, id: propObj.landlordId._id.toString() }
          : propObj.landlordId.toString()
      };
    });
    
    res.json(transformedProperties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('landlordId', 'name email phone profilePicture');
    if (!property) {
      return res.status(404).json({ msg: 'Property not found' });
    }
    
    // Transform _id to id for frontend consistency
    const propObj = property.toObject();
    res.json({
      ...propObj,
      id: propObj._id.toString(),
      landlordId: typeof propObj.landlordId === 'object' && propObj.landlordId 
        ? { ...propObj.landlordId, id: propObj.landlordId._id.toString() }
        : propObj.landlordId.toString()
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Property not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private (Landlord, owner)
exports.updateProperty = async (req, res) => {
  // Add validation if needed
  try {
    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    // Check if user owns the property
    if (property.landlordId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Only allow updating fields that are passed in the body
    const { photos, ...updateData } = req.body; // Separate photos to handle its array nature correctly
    
    // If photos are provided in the request, update them. Otherwise, keep existing.
    if (Array.isArray(photos)) {
        updateData.photos = photos;
    } else if (photos === undefined && req.body.hasOwnProperty('photos') && photos === null) {
        // If photos is explicitly set to null (e.g. to remove all photos)
        updateData.photos = [];
    }
    // If photos key is not in req.body at all, property.photos remains unchanged implicitly by $set

    property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true } // Return the updated document
    ).populate('landlordId', 'name email phone profilePicture');

    // Transform _id to id for frontend consistency
    const propObj = property.toObject();
    res.json({
      ...propObj,
      id: propObj._id.toString(),
      landlordId: typeof propObj.landlordId === 'object' && propObj.landlordId 
        ? { ...propObj.landlordId, id: propObj.landlordId._id.toString() }
        : propObj.landlordId.toString()
    });
  } catch (err) {
    console.error(err.message);
     if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Property not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private (Landlord, owner)
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    if (property.landlordId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Property.findByIdAndDelete(req.params.id); // Mongoose 8+
    // For older Mongoose: await property.remove();

    // Optionally, remove this property from all users' favoriteProperties arrays
    // await User.updateMany({}, { $pull: { favoriteProperties: property._id } });

    res.json({ msg: 'Property removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Property not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};


// @desc    Toggle favorite status for a property
// @route   PUT /api/properties/:id/favorite
// @access  Private (Tenant only)
exports.toggleFavoriteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ msg: 'Property not found' });
        }

        const user = await User.findById(req.user.id);
        if (!user) { // Should not happen if protect middleware is working
            return res.status(404).json({ msg: 'User not found' });
        }

        const propertyId = property._id;
        const index = user.favoriteProperties.indexOf(propertyId);

        if (index > -1) {
            // Property is already a favorite, remove it
            user.favoriteProperties.splice(index, 1);
        } else {
            // Property is not a favorite, add it
            user.favoriteProperties.push(propertyId);
        }

        await user.save();
        // Convert ObjectIds to strings for frontend
        const favoritePropertiesStrings = user.favoriteProperties.map(id => id.toString());
        res.json({ favoriteProperties: favoritePropertiesStrings });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Placeholder for Message and Application controllers/routes - to be implemented similarly
// e.g., createMessage, getMessagesForUser, createApplication, getApplicationsByTenant, updateApplicationStatusByLandlord
