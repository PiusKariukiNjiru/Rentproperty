
const Application = require('../models/Application');
const Property = require('../models/Property');
const { validationResult } = require('express-validator');

// @desc    Create a new application
// @route   POST /api/applications
// @access  Private (Tenant)
exports.createApplication = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { propertyId, messageToLandlord } = req.body;

  try {
    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ msg: 'Property not found' });
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      propertyId,
      tenantId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ msg: 'You have already applied for this property' });
    }

    const newApplication = new Application({
      propertyId,
      tenantId: req.user.id,
      landlordId: property.landlordId,
      messageToLandlord: messageToLandlord || undefined,
      status: 'Pending',
    });

    const application = await newApplication.save();
    await application.populate('propertyId', 'title');
    await application.populate('tenantId', 'name email phone profilePicture employmentDetails idVerified');
    await application.populate('landlordId', 'name email');

    // Transform _id to id for frontend consistency
    const appObj = application.toObject();
    res.status(201).json({
      ...appObj,
      id: appObj._id.toString(),
      propertyId: typeof appObj.propertyId === 'object' && appObj.propertyId 
        ? { ...appObj.propertyId, id: appObj.propertyId._id.toString() }
        : appObj.propertyId.toString(),
      tenantId: typeof appObj.tenantId === 'object' && appObj.tenantId 
        ? { ...appObj.tenantId, id: appObj.tenantId._id.toString() }
        : appObj.tenantId.toString(),
      landlordId: typeof appObj.landlordId === 'object' && appObj.landlordId 
        ? { ...appObj.landlordId, id: appObj.landlordId._id.toString() }
        : appObj.landlordId.toString(),
      applicationDate: appObj.createdAt,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Property not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get applications for current user
// @route   GET /api/applications
// @access  Private
exports.getApplications = async (req, res) => {
  try {
    let query = {};
    
    // If tenant, get their applications
    // If landlord, get applications for their properties
    if (req.user.userType === 'Tenant') {
      query = { tenantId: req.user.id };
    } else if (req.user.userType === 'Landlord') {
      query = { landlordId: req.user.id };
    }

    const applications = await Application.find(query)
      .populate('propertyId', 'title address city price')
      .populate('tenantId', 'name email phone profilePicture employmentDetails idVerified')
      .populate('landlordId', 'name email')
      .sort({ createdAt: -1 });

    // Transform _id to id for frontend consistency
    const transformedApplications = applications.map(app => {
      const appObj = app.toObject();
      return {
        ...appObj,
        id: appObj._id.toString(),
        propertyId: typeof appObj.propertyId === 'object' && appObj.propertyId 
          ? { ...appObj.propertyId, id: appObj.propertyId._id.toString() }
          : appObj.propertyId.toString(),
        tenantId: typeof appObj.tenantId === 'object' && appObj.tenantId 
          ? { ...appObj.tenantId, id: appObj.tenantId._id.toString() }
          : appObj.tenantId.toString(),
        landlordId: typeof appObj.landlordId === 'object' && appObj.landlordId 
          ? { ...appObj.landlordId, id: appObj.landlordId._id.toString() }
          : appObj.landlordId.toString(),
        applicationDate: appObj.createdAt,
      };
    });

    res.json(transformedApplications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Landlord only)
exports.updateApplicationStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status } = req.body;

  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    // Only landlord who owns the property can update status
    if (application.landlordId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();
    await application.populate('propertyId', 'title address city price');
    await application.populate('tenantId', 'name email phone profilePicture employmentDetails idVerified');
    await application.populate('landlordId', 'name email');

    // Transform _id to id for frontend consistency
    const appObj = application.toObject();
    res.json({
      ...appObj,
      id: appObj._id.toString(),
      propertyId: typeof appObj.propertyId === 'object' && appObj.propertyId 
        ? { ...appObj.propertyId, id: appObj.propertyId._id.toString() }
        : appObj.propertyId.toString(),
      tenantId: typeof appObj.tenantId === 'object' && appObj.tenantId 
        ? { ...appObj.tenantId, id: appObj.tenantId._id.toString() }
        : appObj.tenantId.toString(),
      landlordId: typeof appObj.landlordId === 'object' && appObj.landlordId 
        ? { ...appObj.landlordId, id: appObj.landlordId._id.toString() }
        : appObj.landlordId.toString(),
      applicationDate: appObj.createdAt,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Application not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get application by property and tenant
// @route   GET /api/applications/property/:propertyId/tenant/:tenantId
// @access  Private
exports.getApplicationByPropertyAndTenant = async (req, res) => {
  try {
    const { propertyId, tenantId } = req.params;

    // Only allow if requesting user is the tenant or the landlord of the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ msg: 'Property not found' });
    }

    if (req.user.id !== tenantId && req.user.id !== property.landlordId.toString()) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const application = await Application.findOne({ propertyId, tenantId })
      .populate('propertyId', 'title')
      .populate('tenantId', 'name email')
      .populate('landlordId', 'name email');

    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    // Transform _id to id for frontend consistency
    const appObj = application.toObject();
    res.json({
      ...appObj,
      id: appObj._id.toString(),
      propertyId: typeof appObj.propertyId === 'object' && appObj.propertyId 
        ? { ...appObj.propertyId, id: appObj.propertyId._id.toString() }
        : appObj.propertyId.toString(),
      tenantId: typeof appObj.tenantId === 'object' && appObj.tenantId 
        ? { ...appObj.tenantId, id: appObj.tenantId._id.toString() }
        : appObj.tenantId.toString(),
      landlordId: typeof appObj.landlordId === 'object' && appObj.landlordId 
        ? { ...appObj.landlordId, id: appObj.landlordId._id.toString() }
        : appObj.landlordId.toString(),
      applicationDate: appObj.createdAt,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invalid ID format' });
    }
    res.status(500).send('Server Error');
  }
};

