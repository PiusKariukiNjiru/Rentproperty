
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import { AppContextType, Property, PropertyTypeEnum, UserType } from '../types';
import { PROPERTY_TYPES_OPTIONS } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon } from '../components/icons';

// This page can be used if a dedicated route is preferred over a modal for creating/editing.
// For the current setup, DashboardPage uses a modal with PropertyForm.
// This file can serve as an example of a dedicated page form.

const CreateListingPage: React.FC = () => {
  const { currentUser, addProperty, updateProperty, getPropertyById, isLoading, setLoading } = useContext(AppContext) as AppContextType;
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId?: string }>(); // For editing existing property

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<Property, 'id' | 'landlordId'> & { id?: string }>({
    title: '',
    description: '',
    photos: [''], // Store as array, handle one for simplicity in form
    price: 0,
    propertyType: PropertyTypeEnum.Apartment,
    address: '',
    city: '',
    zipCode: '',
    availabilityDate: new Date().toISOString().split('T')[0], // Default to today
    tenantRequirements: '',
  });

  useEffect(() => {
    if (!currentUser || currentUser.userType !== UserType.Landlord) {
      alert('You must be a landlord to access this page.');
      navigate('/');
      return;
    }

    if (propertyId) {
      setLoading(true);
      const existingProperty = getPropertyById(propertyId);
      if (existingProperty && existingProperty.landlordId === currentUser.id) {
        setIsEditing(true);
        setFormData({
            ...existingProperty,
            availabilityDate: new Date(existingProperty.availabilityDate).toISOString().split('T')[0], // Format for date input
        });
      } else {
        alert('Property not found or you do not have permission to edit it.');
        navigate('/dashboard?tab=listings');
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate, propertyId, getPropertyById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "photos") {
        setFormData(prev => ({ ...prev, photos: [value] })); // Simple handling for one photo URL
    } else {
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const propertyDataForSubmit = {
        ...formData,
        photos: formData.photos.filter(p => p.trim() !== '') // Ensure empty photo strings are not saved
    };

    if (isEditing && propertyId) {
      await updateProperty({ ...propertyDataForSubmit, id: propertyId, landlordId: currentUser.id } as Property);
      alert('Property updated successfully!');
    } else {
      await addProperty(propertyDataForSubmit);
      alert('Property created successfully!');
    }
    navigate('/dashboard?tab=listings');
  };

  if (isLoading && !formData.title) { // Show loader on initial load for editing
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading property data..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-[calc(100vh-120px)]">
      <button onClick={() => navigate('/dashboard?tab=listings')} className="mb-4 text-primary hover:text-blue-700 flex items-center space-x-1">
          <ArrowLeftIcon className="w-5 h-5"/>
          <span>Back to My Listings</span>
      </button>
      <h1 className="text-3xl font-bold text-primary mb-6">{isEditing ? 'Edit Property Listing' : 'Create New Property Listing'}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl space-y-6 max-w-2xl mx-auto">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-dark">Title</label>
          <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-dark">Description</label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-neutral-dark">Price (per month)</label>
                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
            </div>
            <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-neutral-dark">Property Type</label>
                <select name="propertyType" id="propertyType" value={formData.propertyType} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white bg-neutral-darker">
                {PROPERTY_TYPES_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
                </select>
            </div>
        </div>

        <div>
            <label htmlFor="address" className="block text-sm font-medium text-neutral-dark">Full Address</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-neutral-dark">City</label>
                <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
            </div>
            <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-neutral-dark">Zip Code</label>
                <input type="text" name="zipCode" id="zipCode" value={formData.zipCode} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
            </div>
        </div>

        <div>
          <label htmlFor="availabilityDate" className="block text-sm font-medium text-neutral-dark">Availability Date</label>
          <input type="date" name="availabilityDate" id="availabilityDate" value={formData.availabilityDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
        </div>
        <div>
          <label htmlFor="tenantRequirements" className="block text-sm font-medium text-neutral-dark">Tenant Requirements (optional)</label>
          <textarea name="tenantRequirements" id="tenantRequirements" value={formData.tenantRequirements} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
        </div>
        <div>
          <label htmlFor="photos" className="block text-sm font-medium text-neutral-dark">Main Photo URL</label>
          <input type="url" name="photos" id="photos" value={formData.photos[0] || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"/>
           <p className="text-xs text-gray-500 mt-1">Provide one primary image URL. More images can be managed via property details page (feature simplified for this form).</p>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard?tab=listings')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : (isEditing ? 'Save Changes' : 'Create Listing')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateListingPage;