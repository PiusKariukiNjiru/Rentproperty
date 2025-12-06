
import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import { AppContextType, User, UserType, Property, PropertyTypeEnum, Message, PropertyApplication, ApplicationStatus, DashboardTab, Review, ReviewStats, Amenity, PetPolicy, LeaseTerm } from '../types';
import Modal from '../components/Modal';
import LoadingSpinner, { FullPageLoader } from '../components/LoadingSpinner';
import { PROPERTY_TYPES_OPTIONS, APPLICATION_STATUS_OPTIONS } from '../constants';
import PropertyCard from '../components/PropertyCard';
import Badge from '../components/Badge';
import ImageUpload from '../components/ImageUpload'; // Import ImageUpload
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import ReviewCard from '../components/ReviewCard';
import { UserCircleIcon, ChatBubbleLeftRightIcon, BuildingOfficeIcon, PencilIcon, TrashIcon, PlusCircleIcon, HeartIcon, EyeIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon, DocumentTextIcon, MapPinIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';


const PropertyForm: React.FC<{
  initialData?: Property | null;
  onSubmit: (data: Omit<Property, 'id' | 'landlordId'> | Property) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    propertyType: initialData?.propertyType || PropertyTypeEnum.Apartment,
    address: initialData?.address || '',
    city: initialData?.city || '',
    zipCode: initialData?.zipCode || '',
    latitude: initialData?.latitude || undefined,
    longitude: initialData?.longitude || undefined,
    availabilityDate: initialData?.availabilityDate ? initialData.availabilityDate.split('T')[0] : new Date().toISOString().split('T')[0],
    tenantRequirements: initialData?.tenantRequirements || '',
    photos: initialData?.photos || [], // Array for ImageUpload
    bedrooms: initialData?.bedrooms || undefined,
    bathrooms: initialData?.bathrooms || undefined,
    amenities: initialData?.amenities || [] as Amenity[],
    squareFootage: initialData?.squareFootage || undefined,
    petPolicy: initialData?.petPolicy || 'no-pets' as PetPolicy,
    leaseTerms: initialData?.leaseTerms || [] as LeaseTerm[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number | undefined = value;
    if (name === 'price' || name === 'latitude' || name === 'longitude' || name === 'bedrooms' || name === 'bathrooms' || name === 'squareFootage') {
        parsedValue = value === '' ? undefined : parseFloat(value);
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const toggleAmenity = (amenity: Amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const toggleLeaseTerm = (term: LeaseTerm) => {
    setFormData(prev => ({
      ...prev,
      leaseTerms: prev.leaseTerms.includes(term)
        ? prev.leaseTerms.filter(t => t !== term)
        : [...prev.leaseTerms, term]
    }));
  };

  const handleImagesChange = (base64Images: string[]) => {
    setFormData(prev => ({ ...prev, photos: base64Images }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };
    // Ensure photos has at least one empty string if no photos were uploaded, or keep uploaded ones
    finalData.photos = finalData.photos.length > 0 ? finalData.photos : [];
    
    // The handleChange function already converts empty strings for lat/lng to undefined.
    // The lines below were causing type errors and are redundant.
    // if (finalData.latitude === '') finalData.latitude = undefined;
    // if (finalData.longitude === '') finalData.longitude = undefined;

    if (initialData && initialData.id) {
        onSubmit({ ...initialData, ...finalData });
    } else {
        onSubmit(finalData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-dark">Title <span className="text-danger">*</span></label>
        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-dark">Description <span className="text-danger">*</span></label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        <div>
            <label htmlFor="price" className="block text-sm font-medium text-neutral-dark">Price (per month) <span className="text-danger">*</span></label>
            <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-neutral-dark">Property Type <span className="text-danger">*</span></label>
            <select name="propertyType" id="propertyType" value={formData.propertyType} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-[42px] text-neutral-darker bg-white">
            {PROPERTY_TYPES_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
            </select>
        </div>
      
        <div>
            <label htmlFor="address" className="block text-sm font-medium text-neutral-dark">Street Address <span className="text-danger">*</span></label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="city" className="block text-sm font-medium text-neutral-dark">City <span className="text-danger">*</span></label>
            <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-neutral-dark">Zip Code <span className="text-danger">*</span></label>
            <input type="text" name="zipCode" id="zipCode" value={formData.zipCode} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="availabilityDate" className="block text-sm font-medium text-neutral-dark">Availability Date <span className="text-danger">*</span></label>
            <input type="date" name="availabilityDate" id="availabilityDate" value={formData.availabilityDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-neutral-dark">Latitude (Optional)</label>
            <input type="number" step="any" name="latitude" id="latitude" value={formData.latitude ?? ''} onChange={handleChange} placeholder="e.g. 34.0522" className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-neutral-dark">Longitude (Optional)</label>
            <input type="number" step="any" name="longitude" id="longitude" value={formData.longitude ?? ''} onChange={handleChange} placeholder="e.g. -118.2437" className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-neutral-dark">Bedrooms</label>
            <input type="number" name="bedrooms" id="bedrooms" value={formData.bedrooms ?? ''} onChange={handleChange} min="0" placeholder="e.g. 2" className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-neutral-dark">Bathrooms</label>
            <input type="number" name="bathrooms" id="bathrooms" value={formData.bathrooms ?? ''} onChange={handleChange} min="0" step="0.5" placeholder="e.g. 1.5" className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="squareFootage" className="block text-sm font-medium text-neutral-dark">Square Footage</label>
            <input type="number" name="squareFootage" id="squareFootage" value={formData.squareFootage ?? ''} onChange={handleChange} min="0" placeholder="e.g. 1200" className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
        </div>
        <div>
            <label htmlFor="petPolicy" className="block text-sm font-medium text-neutral-dark">Pet Policy</label>
            <select name="petPolicy" id="petPolicy" value={formData.petPolicy} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-[42px] text-neutral-darker bg-white">
              <option value="no-pets" className="text-black">No Pets</option>
              <option value="cats-only" className="text-black">Cats Only</option>
              <option value="dogs-only" className="text-black">Dogs Only</option>
              <option value="small-pets-only" className="text-black">Small Pets Only</option>
              <option value="all-pets-allowed" className="text-black">All Pets Allowed</option>
              <option value="case-by-case" className="text-black">Case by Case</option>
            </select>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-neutral-dark mb-2">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {(['parking', 'laundry', 'pet-friendly', 'furnished', 'air-conditioning', 'heating', 'wifi', 'dishwasher', 'gym', 'pool', 'balcony', 'garden', 'elevator', 'security', 'storage'] as Amenity[]).map(amenity => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.amenities.includes(amenity)
                  ? 'bg-primary text-white'
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral'
              }`}
            >
              {amenity.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Lease Terms */}
      <div>
        <label className="block text-sm font-medium text-neutral-dark mb-2">Lease Terms</label>
        <div className="flex flex-wrap gap-2">
          {(['month-to-month', '3-months', '6-months', '12-months', '18-months', '24-months', 'flexible'] as LeaseTerm[]).map(term => (
            <button
              key={term}
              type="button"
              onClick={() => toggleLeaseTerm(term)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.leaseTerms.includes(term)
                  ? 'bg-primary text-white'
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral'
              }`}
            >
              {term.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div className="md:col-span-2">
        <label htmlFor="tenantRequirements" className="block text-sm font-medium text-neutral-dark">Tenant Requirements</label>
        <textarea name="tenantRequirements" id="tenantRequirements" value={formData.tenantRequirements} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-neutral-dark">Property Photos</label>
        <ImageUpload initialImages={formData.photos} onImagesChange={handleImagesChange} maxFiles={5} />
        <p className="text-xs text-gray-500 mt-1">First image will be the primary display image.</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-neutral-dark text-neutral-dark rounded-md hover:bg-neutral transition-colors font-medium">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-5 py-2.5 bg-primary text-white rounded-md hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium flex items-center justify-center min-w-[120px]">
            {isLoading ? <LoadingSpinner size="sm"/> : (initialData?.id ? 'Save Changes' : 'Create Listing')}
        </button>
      </div>
    </form>
  );
};


const DashboardPage: React.FC = () => {
  const { 
    currentUser, properties, messages, applications,
    addProperty, updateProperty, deleteProperty, 
    isLoading, setLoading, getPropertyById, markMessageAsRead,
    getUserById, updateApplicationStatus,
    fetchReviews, getReviewsByReviewee, getReviewsByProperty, getReviewStats,
    submitReview, updateReview, deleteReview, moderateReview, respondToReview,
    reviews: allReviews
  } = useContext(AppContext) as AppContextType;
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultTab: DashboardTab = currentUser?.userType === UserType.Landlord ? 'listings' : 'profile';
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMessageDetailModalOpen, setIsMessageDetailModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PropertyApplication | null>(null);
  const [isApplicationDetailModalOpen, setIsApplicationDetailModalOpen] = useState(false);


  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Review states
  const [userReviewStats, setUserReviewStats] = useState<ReviewStats | null>(null);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]); // For moderation
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [respondingToReview, setRespondingToReview] = useState<Review | null>(null);
  const [isFetchingUserReviews, setIsFetchingUserReviews] = useState(false);

  // Filter reviews for current user using useMemo to avoid infinite loops
  // Show all reviews (approved and pending) so user can see what's pending moderation
  const userReviews = useMemo(() => {
    if (!currentUser) return [];
    return allReviews.filter(review => 
      String(review.revieweeId) === currentUser.id
    );
  }, [allReviews, currentUser?.id]);

  // Update pending reviews when allReviews changes (for landlords)
  useEffect(() => {
    if (currentUser?.userType === UserType.Landlord) {
      const pending = allReviews.filter(r => 
        String(r.revieweeId) === currentUser.id && !r.isApproved && !r.isModerated
      );
      setPendingReviews(pending);
    }
  }, [allReviews, currentUser?.id, currentUser?.userType]);


  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setProfileData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        profilePicture: currentUser.profilePicture,
        employmentDetails: currentUser.employmentDetails,
        idVerified: currentUser.idVerified
    });
    
    // Fetch reviews for current user (all reviews - approved and pending)
    if (!isFetchingUserReviews) {
      setIsFetchingUserReviews(true);
      const fetchUserReviews = async () => {
        try {
          // Fetch all reviews so user can see both approved and pending ones
          await fetchReviews({ revieweeId: currentUser.id, approvedOnly: false });
          // Stats should only include approved reviews for accuracy
          const stats = await getReviewStats('user', currentUser.id);
          setUserReviewStats(stats);
          
          // pendingReviews will be updated automatically by useEffect when allReviews changes
        } catch (error) {
          console.error('Error fetching user reviews:', error);
        } finally {
          setIsFetchingUserReviews(false);
        }
      };
      fetchUserReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.userType]); // Only depend on user ID and type

  // Separate useEffect for handling URL parameters
  useEffect(() => {
    if (!currentUser) return;
    
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as DashboardTab;
    const actionParam = params.get('action');
    const propertyIdParam = params.get('propertyId');

    const validTabs = navItems.map(item => item.id);
    if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
    } else {
        setActiveTab(currentUser.userType === UserType.Landlord ? 'listings' : 'profile');
    }
    
    if (currentUser.userType === UserType.Landlord && actionParam === 'create' && tabParam === 'listings') {
      setEditingProperty(null); 
      setIsPropertyModalOpen(true);
    }
    if (currentUser.userType === UserType.Landlord && actionParam === 'edit' && propertyIdParam && tabParam === 'listings') {
        const propToEdit = properties.find(p => {
          const landlordId = typeof p.landlordId === 'string' ? p.landlordId : (p.landlordId as User)?.id;
          return p.id === propertyIdParam && landlordId === currentUser.id;
        });
        if (propToEdit) {
            setEditingProperty(propToEdit);
            setIsPropertyModalOpen(true);
        } else {
            addToast("Property not found or you don't have permission to edit it.", 'error');
            navigate('/dashboard?tab=listings', { replace: true });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate, location.search]); // properties and addToast removed, navItems not needed for this effect


  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    // Simulate API call for profile update
    setTimeout(() => {
        // This is a mock update. In a real app, send to backend and update context.
        const updatedUser = { ...currentUser, ...profileData };
        // Visually update current user for demo. This won't persist if not saved to AppContext users list.
        Object.assign(currentUser, profileData); 
        addToast("Profile updated successfully (mock update).", 'success');
        setIsEditingProfile(false);
        setLoading(false);
    }, 500);
  };


  const handleAddProperty = () => {
    setEditingProperty(null);
    setIsPropertyModalOpen(true);
    navigate('/dashboard?tab=listings&action=create', { replace: true });
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsPropertyModalOpen(true);
    navigate(`/dashboard?tab=listings&action=edit&propertyId=${property.id}`, { replace: true });
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      setLoading(true);
      try {
        await deleteProperty(propertyId);
      } catch (error) {
        // Error toast is handled by AppContext or deleteProperty itself
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePropertyFormSubmit = async (data: Omit<Property, 'id' | 'landlordId'> | Property) => {
    setLoading(true);
    try {
        if (editingProperty && 'id' in data) { 
            await updateProperty(data as Property);
        } else { 
            await addProperty(data as Omit<Property, 'id' | 'landlordId'>);
        }
        handlePropertyModalClose(); // Close modal and clear params on success
    } catch (error) {
      // Error toast is handled by AppContext or the specific function
    } finally {
        setLoading(false);
    }
  };
  
  const handlePropertyModalClose = () => {
    setIsPropertyModalOpen(false);
    setEditingProperty(null);
    navigate('/dashboard?tab=listings', { replace: true }); // Clear action/propertyId params
  };

  const openMessageDetail = (message: Message) => {
    setSelectedMessage(message);
    setIsMessageDetailModalOpen(true);
    if (!message.isRead && currentUser) {
      const receiverId = typeof message.receiverId === 'string' ? message.receiverId : message.receiverId.id;
      if (receiverId === currentUser.id) {
          markMessageAsRead(message.id);
      }
    }
  };
  
  const openApplicationDetail = (application: PropertyApplication) => {
    setSelectedApplication(application);
    setIsApplicationDetailModalOpen(true);
  };

  const handleApplicationStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setLoading(true);
    try {
        await updateApplicationStatus(appId, newStatus);
        if(selectedApplication && selectedApplication.id === appId) {
            setSelectedApplication(prev => prev ? {...prev, status: newStatus} : null);
        }
    } catch (error) {
        // Error toast handled in context
    } finally {
        setLoading(false);
    }
  };


  const userProperties = useMemo(() => {
    if (currentUser?.userType === UserType.Landlord) {
      return properties.filter(p => {
        // Handle landlordId being either a string or a User object
        const landlordId = typeof p.landlordId === 'string' ? p.landlordId : (p.landlordId as User)?.id;
        return landlordId === currentUser.id;
      }).sort((a,b) => a.title.localeCompare(b.title));
    }
    return [];
  }, [properties, currentUser]);

  const favoritePropertiesDetails = useMemo(() => {
    if (currentUser?.userType === UserType.Tenant) {
      return currentUser.favoriteProperties.map(favId => getPropertyById(favId)).filter(Boolean) as Property[];
    }
    return [];
  }, [currentUser, getPropertyById]);

  const userMessages = useMemo(() => {
    if (!currentUser) return [];
    return messages
        .filter(m => {
            const receiverId = typeof m.receiverId === 'string' ? m.receiverId : m.receiverId.id;
            const senderId = typeof m.senderId === 'string' ? m.senderId : m.senderId.id;
            return receiverId === currentUser.id || senderId === currentUser.id;
        })
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, currentUser]);
  
  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    return userMessages.filter(m => {
        const receiverId = typeof m.receiverId === 'string' ? m.receiverId : m.receiverId.id;
        return receiverId === currentUser.id && !m.isRead;
    }).length;
  }, [userMessages, currentUser]);

  const tenantApplications = useMemo(() => {
    if (currentUser?.userType === UserType.Tenant) {
        return applications
            .filter(app => {
                const tenantId = typeof app.tenantId === 'string' ? app.tenantId : app.tenantId.id;
                return tenantId === currentUser.id;
            })
            .sort((a,b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
    }
    return [];
  }, [applications, currentUser]);

  const landlordReceivedApplications = useMemo(() => {
    if (currentUser?.userType === UserType.Landlord) {
        return applications
            .filter(app => {
                const landlordId = typeof app.landlordId === 'string' ? app.landlordId : app.landlordId.id;
                return landlordId === currentUser.id;
            })
            .sort((a,b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
    }
    return [];
  }, [applications, currentUser]);


  if (!currentUser) {
    return <FullPageLoader message="Authenticating..." />;
  }
  
  const getApplicationStatusColor = (status: ApplicationStatus): React.ComponentProps<typeof Badge>['color']=> {
    switch (status) {
        case ApplicationStatus.Pending: return 'neutral';
        case ApplicationStatus.ViewScheduled: return 'info';
        case ApplicationStatus.UnderReview: return 'warning';
        case ApplicationStatus.Accepted: return 'success';
        case ApplicationStatus.Rejected: return 'danger';
        default: return 'neutral';
    }
  };
  
  const navItems = useMemo(() => {
    const items = [
      { id: 'profile' as DashboardTab, label: 'Profile', icon: UserCircleIcon, count: 0 },
      { id: 'messages' as DashboardTab, label: 'Messages', icon: ChatBubbleLeftRightIcon, count: unreadMessagesCount },
    ];
    if (currentUser.userType === UserType.Landlord) {
      items.push({ id: 'listings' as DashboardTab, label: 'My Listings', icon: BuildingOfficeIcon, count: 0 });
      items.push({ id: 'applications_received' as DashboardTab, label: 'Property Applications', icon: DocumentTextIcon, count: landlordReceivedApplications.filter(a => a.status === ApplicationStatus.Pending).length });
    }
    if (currentUser.userType === UserType.Tenant) {
      items.push({ id: 'favorites' as DashboardTab, label: 'Favorites', icon: HeartIcon, count: 0 });
      items.push({ id: 'my_applications' as DashboardTab, label: 'My Applications', icon: DocumentTextIcon, count: 0 });
    }
    return items;
  }, [currentUser.userType, unreadMessagesCount, landlordReceivedApplications]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold text-primary mb-6">My Profile</h3>
            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-dark">Full Name</label>
                  <input type="text" name="name" id="name" value={profileData.name || ''} onChange={handleProfileChange} className="mt-1 block w-full border-neutral rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-dark">Email Address</label>
                  <input type="email" name="email" id="email" value={profileData.email || ''} onChange={handleProfileChange} className="mt-1 block w-full border-neutral rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-dark">Phone Number</label>
                  <input type="tel" name="phone" id="phone" value={profileData.phone || ''} onChange={handleProfileChange} className="mt-1 block w-full border-neutral rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
                </div>
                {currentUser.userType === UserType.Tenant && (
                    <div>
                        <label htmlFor="employmentDetails" className="block text-sm font-medium text-neutral-dark">Employment Details</label>
                        <textarea name="employmentDetails" id="employmentDetails" value={profileData.employmentDetails || ''} onChange={handleProfileChange} rows={3} className="mt-1 block w-full border-neutral rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
                    </div>
                )}
                <div>
                  <label htmlFor="profilePicture" className="block text-sm font-medium text-neutral-dark">Profile Picture URL</label>
                  <input type="url" name="profilePicture" id="profilePicture" value={profileData.profilePicture || ''} onChange={handleProfileChange} placeholder="https://example.com/image.jpg" className="mt-1 block w-full border-neutral rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"/>
                </div>
                <div className="flex space-x-3 pt-2">
                    <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px] font-medium" disabled={isLoading}>
                        {isLoading ? <LoadingSpinner size="sm"/> : "Save Changes"}
                    </button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="bg-neutral-light text-neutral-dark px-6 py-2.5 rounded-md hover:bg-neutral transition-colors border border-neutral font-medium">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <img src={currentUser.profilePicture || 'https://via.placeholder.com/150/F0F0F0/808080?text=No+Image'} alt={currentUser.name} className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white"/>
                    <div>
                        <h4 className="text-2xl font-semibold text-neutral-dark">{currentUser.name}</h4>
                        <p className="text-gray-500 text-md">{currentUser.userType}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-3">
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>Phone:</strong> {currentUser.phone}</p>
                    {currentUser.userType === UserType.Tenant && <p className="md:col-span-2"><strong>Employment:</strong> {currentUser.employmentDetails || <span className="text-gray-400 italic">Not specified</span>}</p>}
                    <p className="flex items-center gap-2"><strong>ID Verified:</strong>
                        {currentUser.idVerified ?
                            <Badge text="Verified" color="success" icon={<CheckCircleIcon className="w-4 h-4"/>} /> :
                            <Badge text="Not Verified" color="warning" icon={<ExclamationCircleIcon className="w-4 h-4"/>} />
                        } <span className="text-xs text-gray-400 ml-1">(Mock verification)</span>
                    </p>
                </div>
                <button onClick={() => setIsEditingProfile(true)} className="mt-6 bg-secondary text-white px-6 py-2.5 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2 font-medium shadow-sm hover:shadow-md">
                    <PencilIcon className="w-5 h-5"/>
                    <span>Edit Profile</span>
                </button>
                
                {/* Reviews Section */}
                <div className="mt-8 pt-8 border-t">
                  <h4 className="text-xl font-semibold text-primary mb-4">Reviews About Me</h4>
                  <ReviewList
                    reviews={userReviews}
                    stats={userReviewStats || undefined}
                    currentUserId={currentUser.id}
                    onRespond={(review) => {
                      setRespondingToReview(review);
                    }}
                    showProperty={true}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        );
      case 'messages':
        return (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold text-primary mb-6">My Messages</h3>
            {userMessages.length === 0 ? (
                <div className="text-center py-12">
                    <ChatBubbleLeftRightIcon className="w-20 h-20 text-neutral-DEFAULT mx-auto mb-4" />
                    <p className="text-xl text-neutral-dark font-medium">No messages yet.</p>
                    <p className="text-gray-500 mt-1">Your conversations will appear here.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                {userMessages.map(msg => {
                    const senderIdValue = msg.senderId;
                    const receiverIdValue = msg.receiverId;
                    const otherUserValue = (typeof senderIdValue === 'string' ? senderIdValue : senderIdValue.id) === currentUser.id ? receiverIdValue : senderIdValue;
                    const otherUserId = typeof otherUserValue === 'string' ? otherUserValue : otherUserValue.id;
                    const otherUser = getUserById(otherUserId);

                    const propertyIdValue = msg.propertyId;
                    const propertyIdString = typeof propertyIdValue === 'string' ? propertyIdValue : propertyIdValue?.id;
                    const relatedProperty = propertyIdString ? getPropertyById(propertyIdString) : null;
                    
                    const msgReceiverId = typeof msg.receiverId === 'string' ? msg.receiverId : msg.receiverId.id;
                    const isUnread = !msg.isRead && msgReceiverId === currentUser.id;

                    return (
                    <li key={msg.id} onClick={() => openMessageDetail(msg)}
                        className={`p-4 border rounded-lg hover:shadow-lg cursor-pointer transition-all duration-200 ease-in-out ${isUnread ? 'bg-blue-50 border-primary shadow-md transform hover:scale-[1.01]' : 'bg-white border-neutral hover:border-gray-300 hover:bg-neutral-light/30'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-grow min-w-0"> {/* For text truncation */}
                                <p className={`font-semibold text-lg ${isUnread ? 'text-primary' : 'text-neutral-dark'} truncate`}>
                                    {msg.subject || `Message regarding ${relatedProperty?.title || 'general inquiry'}`}
                                </p>
                                <p className="text-sm text-gray-600 truncate max-w-md md:max-w-lg">{msg.content}</p>
                                <p className="text-xs text-gray-500 mt-1.5">
                                    {(typeof msg.senderId === 'string' ? msg.senderId : msg.senderId.id) === currentUser.id ? `To: ${otherUser?.name || 'User'}` : `From: ${otherUser?.name || 'User'}`}
                                    {relatedProperty && ` | For: ${relatedProperty.title.substring(0,25)}...`}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3 space-y-1">
                                <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</p>
                                {isUnread && <Badge text="New" color="primary" size="sm"/>}
                            </div>
                        </div>
                    </li>
                    );
                })}
                </ul>
            )}
            </div>
        );
      case 'listings':
        if (currentUser.userType !== UserType.Landlord) return <p className="text-center text-lg text-neutral-dark p-10">This section is for landlords.</p>;
        return (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
              <h3 className="text-2xl font-semibold text-primary">My Property Listings</h3>
              <button onClick={handleAddProperty} className="bg-secondary text-white px-5 py-2.5 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 self-start sm:self-center font-medium shadow-sm hover:shadow-md">
                <PlusCircleIcon className="w-5 h-5"/>
                <span>Add New Listing</span>
              </button>
            </div>
            {userProperties.length === 0 ? (
                <div className="text-center py-12">
                    <BuildingOfficeIcon className="w-20 h-20 text-neutral-DEFAULT mx-auto mb-4" />
                    <p className="text-xl text-neutral-dark font-medium">No properties listed yet.</p>
                    <p className="text-gray-500 mt-1">Click "Add New Listing" to get started.</p>
                </div>
            ) : (
              <div className="space-y-5">
                {userProperties.map(prop => (
                  <div key={prop.id} className="border border-neutral p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-lg transition-shadow duration-200 bg-white">
                    <div className="flex items-center flex-grow min-w-0"> {/* For text truncation */}
                        <img src={prop.photos[0] || 'https://via.placeholder.com/120x90/F0F0F0/808080?text=No+Image'} alt={prop.title} className="w-32 h-24 object-cover rounded-md mr-4 shadow-sm flex-shrink-0"/>
                        <div className="flex-grow min-w-0">
                            <h4 className="font-semibold text-lg text-primary hover:underline cursor-pointer truncate" onClick={() => navigate(`/properties?propId=${prop.id}`)} title={prop.title}>{prop.title}</h4>
                            <p className="text-sm text-gray-600 truncate" title={`${prop.address}, ${prop.city}`}>{prop.address}, {prop.city}</p>
                            <p className="text-sm text-secondary font-medium">${prop.price.toLocaleString()}/month &bull; {prop.propertyType}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2 items-center self-end sm:self-center flex-shrink-0">
                      <button onClick={() => navigate(`/properties?propId=${prop.id}`)} className="text-primary hover:text-blue-700 p-2.5 rounded-full hover:bg-blue-50 transition-colors" title="View Property Details">
                          <EyeIcon className="w-5 h-5"/>
                      </button>
                      <button onClick={() => handleEditProperty(prop)} className="text-yellow-600 hover:text-yellow-700 p-2.5 rounded-full hover:bg-yellow-50 transition-colors" title="Edit Listing">
                        <PencilIcon className="w-5 h-5"/>
                      </button>
                      <button onClick={() => handleDeleteProperty(prop.id)} className="text-danger hover:text-red-700 p-2.5 rounded-full hover:bg-red-50 transition-colors" title="Delete Listing" disabled={isLoading && editingProperty?.id !== prop.id}>
                        {(isLoading && editingProperty?.id !== prop.id) ? <LoadingSpinner size="sm" /> : <TrashIcon className="w-5 h-5"/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'favorites':
        if (currentUser.userType !== UserType.Tenant) return <p className="text-center text-lg text-neutral-dark p-10">This section is for tenants.</p>;
        return (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold text-primary mb-6">My Favorite Properties</h3>
            {favoritePropertiesDetails.length === 0 ? (
                <div className="text-center py-12">
                    <HeartIcon className="w-20 h-20 text-neutral-DEFAULT mx-auto mb-4" />
                    <p className="text-xl text-neutral-dark font-medium">No favorite properties yet.</p>
                    <p className="text-gray-500 mt-1">Browse properties and click the heart icon to save them.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favoritePropertiesDetails.map(prop => (
                  <PropertyCard key={prop.id} property={prop} onViewDetails={(p) => navigate(`/properties?propId=${p.id}`)} />
                ))}
              </div>
            )}
          </div>
        );
      case 'my_applications': // Tenant's view of their applications
        if (currentUser.userType !== UserType.Tenant) return null;
        return (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fadeIn">
                <h3 className="text-2xl font-semibold text-primary mb-6">My Submitted Applications</h3>
                {tenantApplications.length === 0 ? (
                     <div className="text-center py-12">
                        <DocumentTextIcon className="w-20 h-20 text-neutral-DEFAULT mx-auto mb-4" />
                        <p className="text-xl text-neutral-dark font-medium">No applications submitted yet.</p>
                        <p className="text-gray-500 mt-1">Find a property you like and click "Apply Now".</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {tenantApplications.map(app => {
                            const propertyIdValue = app.propertyId;
                            const propertyIdString = typeof propertyIdValue === 'string' ? propertyIdValue : propertyIdValue?.id;
                            const property = propertyIdString ? getPropertyById(propertyIdString) : undefined;
                            return (
                                <li key={app.id} className="border border-neutral p-4 rounded-lg hover:shadow-md transition-shadow bg-white">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-semibold text-lg text-primary hover:underline cursor-pointer truncate" onClick={() => property && navigate(`/properties?propId=${property.id}`)} title={property?.title}>
                                                {property?.title || 'Property Not Found'}
                                            </h4>
                                            <p className="text-sm text-gray-500">Applied on: {new Date(app.applicationDate).toLocaleDateString()}</p>
                                        </div>
                                        <Badge text={app.status} color={getApplicationStatusColor(app.status)} size="md" />
                                    </div>
                                    {app.messageToLandlord && <p className="text-sm text-gray-600 mt-2 italic bg-neutral-light p-2 rounded">Your message: "{app.messageToLandlord}"</p>}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
    case 'applications_received': // Landlord's view of received applications
        if (currentUser.userType !== UserType.Landlord) return null;
        return (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fadeIn">
                <h3 className="text-2xl font-semibold text-primary mb-6">Received Property Applications</h3>
                {landlordReceivedApplications.length === 0 ? (
                     <div className="text-center py-12">
                        <DocumentTextIcon className="w-20 h-20 text-neutral-DEFAULT mx-auto mb-4" />
                        <p className="text-xl text-neutral-dark font-medium">No applications received yet.</p>
                        <p className="text-gray-500 mt-1">When tenants apply to your properties, they will appear here.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {landlordReceivedApplications.map(app => {
                            const propertyIdValue = app.propertyId;
                            const propertyIdString = typeof propertyIdValue === 'string' ? propertyIdValue : propertyIdValue?.id;
                            const property = propertyIdString ? getPropertyById(propertyIdString) : undefined;

                            const tenantIdValue = app.tenantId;
                            const tenantIdString = typeof tenantIdValue === 'string' ? tenantIdValue : tenantIdValue.id;
                            const tenant = tenantIdString ? getUserById(tenantIdString) : undefined;
                            return (
                                <li key={app.id} className="border border-neutral p-4 rounded-lg hover:shadow-md transition-shadow bg-white">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-semibold text-lg text-primary hover:underline cursor-pointer truncate" onClick={() => property && navigate(`/properties?propId=${property.id}`)} title={property?.title}>
                                                For: {property?.title || 'Property Not Found'}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                From: <span className="font-medium">{tenant?.name || 'Unknown Tenant'}</span> ({tenant?.email})
                                            </p>
                                            <p className="text-xs text-gray-500">Applied: {new Date(app.applicationDate).toLocaleDateString()}</p>
                                            {app.messageToLandlord && <p className="text-sm text-gray-700 mt-1.5 italic bg-neutral-light p-2 rounded">Tenant's message: "{app.messageToLandlord}"</p>}
                                             {tenant && (
                                                <button
                                                    onClick={() => openApplicationDetail(app)}
                                                    className="text-xs text-secondary hover:underline mt-2 font-medium">
                                                    View Tenant Details
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0 mt-2 sm:mt-0">
                                            <Badge text={app.status} color={getApplicationStatusColor(app.status)} size="md" />
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleApplicationStatusChange(app.id, e.target.value as ApplicationStatus)}
                                                className="mt-1 text-sm p-2 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary min-w-[160px] h-[40px] text-neutral-darker bg-white"
                                                disabled={isLoading}
                                                aria-label={`Update status for application from ${tenant?.name}`}
                                            >
                                                {APPLICATION_STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
      case 'reviews_moderation':
        return (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fadeIn">
            <h3 className="text-2xl font-semibold text-primary mb-6">Review Moderation</h3>
            {pendingReviews.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-20 h-20 text-success mx-auto mb-4" />
                <p className="text-xl text-neutral-dark font-medium">No pending reviews</p>
                <p className="text-gray-500 mt-1">All reviews have been moderated.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <div key={review.id} className="border border-neutral rounded-lg p-6 bg-white">
                    <ReviewCard
                      review={review}
                      currentUserId={currentUser.id}
                      showProperty={true}
                    />
                    <div className="mt-4 pt-4 border-t border-neutral flex items-center space-x-3">
                      <button
                        onClick={async () => {
                          try {
                            await moderateReview(review.id, true);
                            addToast('Review approved successfully', 'success');
                            // Refresh all reviews to show updated status
                            await fetchReviews({ revieweeId: currentUser.id, approvedOnly: false });
                            // Refresh stats (only includes approved reviews)
                            const stats = await getReviewStats('user', currentUser.id);
                            setUserReviewStats(stats);
                            // pendingReviews will be updated automatically by useEffect
                          } catch (error) {
                            // Error handled in context
                          }
                        }}
                        className="px-4 py-2 bg-success text-white rounded-md hover:bg-green-600 font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          const notes = window.prompt('Enter moderation notes (optional):');
                          try {
                            await moderateReview(review.id, false, notes || undefined);
                            addToast('Review rejected', 'success');
                            // Refresh all reviews to show updated status
                            await fetchReviews({ revieweeId: currentUser.id, approvedOnly: false });
                            // pendingReviews will be updated automatically by useEffect
                          } catch (error) {
                            // Error handled in context
                          }
                        }}
                        className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-600 font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <div className="p-6 bg-white rounded-xl shadow-lg"><p>Select an option from the dashboard menu.</p></div>;
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 min-h-[calc(100vh-120px)]">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-8">My Dashboard</h1>
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
        <aside className="md:w-1/4 lg:w-1/5">
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg sticky top-24"> {/* Make nav sticky */}
            <ul className="space-y-1.5">
              {navItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => { setActiveTab(item.id); navigate(`/dashboard?tab=${item.id}`, { replace: true });}}
                    className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg flex items-center justify-between space-x-2 transition-all duration-200 ease-in-out group ${activeTab === item.id ? 'bg-primary text-white shadow-md' : 'hover:bg-neutral-light hover:text-primary text-neutral-dark'}`}
                    aria-current={activeTab === item.id ? "page" : undefined}
                  >
                    <div className="flex items-center space-x-2.5">
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-neutral-dark group-hover:text-primary'}`}/>
                        <span className="font-medium text-sm sm:text-base">{item.label}</span>
                    </div>
                    {item.count > 0 && <Badge text={item.count.toString()} color={activeTab === item.id ? 'accent' : 'secondary'} size="sm"/>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="md:w-3/4 lg:w-4/5">
          {isLoading && (!isPropertyModalOpen && activeTab !== 'profile') ? <FullPageLoader message="Loading data..." /> : renderTabContent()}
        </main>
      </div>

      <Modal isOpen={isPropertyModalOpen} onClose={handlePropertyModalClose} title={editingProperty ? 'Edit Property Listing' : 'Add New Property Listing'} size="xl">
        <PropertyForm
            initialData={editingProperty}
            onSubmit={handlePropertyFormSubmit}
            onCancel={handlePropertyModalClose}
            isLoading={isLoading}
        />
      </Modal>

      {selectedMessage && (
        <Modal isOpen={isMessageDetailModalOpen} onClose={() => setIsMessageDetailModalOpen(false)} title={selectedMessage.subject || "Message Details"} size="lg">
            <div className="space-y-4 p-2">
                <p><strong>From:</strong> {(() => {
                    const senderIdVal = selectedMessage.senderId;
                    const senderIdStr = typeof senderIdVal === 'string' ? senderIdVal : senderIdVal.id;
                    const sender = getUserById(senderIdStr);
                    return `${sender?.name || "N/A"} (${sender?.email || "N/A"})`;
                })()}</p>
                <p><strong>To:</strong> {(() => {
                    const receiverIdVal = selectedMessage.receiverId;
                    const receiverIdStr = typeof receiverIdVal === 'string' ? receiverIdVal : receiverIdVal.id;
                    const receiver = getUserById(receiverIdStr);
                    return `${receiver?.name || "N/A"} (${receiver?.email || "N/A"})`;
                })()}</p>
                <p><strong>Date:</strong> {new Date(selectedMessage.timestamp).toLocaleString()}</p>
                {selectedMessage.propertyId && (() => {
                    const propIdVal = selectedMessage.propertyId;
                    const propIdStr = typeof propIdVal === 'string' ? propIdVal : propIdVal?.id;
                    const prop = propIdStr ? getPropertyById(propIdStr) : null;
                    if (prop) {
                        return <p><strong>Regarding Property:</strong> <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/properties?propId=${prop.id}`)}>{prop.title}</span></p>;
                    }
                    return null;
                })()}
                <div className="mt-3 pt-3 border-t border-neutral">
                    <p className="font-semibold text-neutral-dark mb-1">Message Content:</p>
                    <div className="whitespace-pre-wrap bg-neutral-light p-3.5 rounded-md text-gray-700 leading-relaxed max-h-80 overflow-y-auto">{selectedMessage.content}</div>
                </div>
                <div className="text-right mt-5">
                    <button onClick={() => { setIsMessageDetailModalOpen(false); setSelectedMessage(null); }} className="bg-primary text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">Close</button>
                </div>
            </div>
        </Modal>
      )}

      {selectedApplication && (() => {
          const tenantIdValue = selectedApplication.tenantId;
          const tenantIdString = typeof tenantIdValue === 'string' ? tenantIdValue : tenantIdValue.id;
          const tenant = tenantIdString ? getUserById(tenantIdString) : null;
          
          return (
            <Modal isOpen={isApplicationDetailModalOpen} onClose={() => setIsApplicationDetailModalOpen(false)} title={`Tenant Details for Application`} size="md">
                {!tenant ? <p>Tenant details not found.</p> : (
                    <div className="space-y-4 p-2">
                        <img src={tenant.profilePicture || 'https://via.placeholder.com/150/F0F0F0/808080?text=No+Image'} alt={tenant.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3 shadow-md border-2 border-white"/>
                        <p><strong>Name:</strong> {tenant.name}</p>
                        <p><strong>Email:</strong> {tenant.email}</p>
                        <p><strong>Phone:</strong> {tenant.phone}</p>
                        <p><strong>Employment:</strong> {tenant.employmentDetails || <span className="italic text-gray-500">Not specified</span>}</p>
                        <p className="flex items-center gap-2"><strong>ID Verified:</strong>
                            {tenant.idVerified ?
                                <Badge text="Verified" color="success" icon={<CheckCircleIcon className="w-4 h-4"/>} /> :
                                <Badge text="Not Verified" color="warning" icon={<ExclamationCircleIcon className="w-4 h-4"/>} />
                            }
                             <span className="text-xs text-gray-400 ml-1">(Mock verification)</span>
                        </p>
                         <div className="text-right mt-5 pt-3 border-t">
                            <button onClick={() => setIsApplicationDetailModalOpen(false)} className="bg-primary text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">Close</button>
                        </div>
                    </div>
                )}
            </Modal>
          );
      })()}
      <style>{`
        .animate-fadeIn {
          animation: fadeInAnimation 0.5s ease-out forwards;
        }
        @keyframes fadeInAnimation {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Review Response Modal */}
      {respondingToReview && (
        <Modal
          isOpen={!!respondingToReview}
          onClose={() => setRespondingToReview(null)}
          title="Respond to Review"
          size="md"
        >
          <div>
            <p className="text-sm text-neutral-dark mb-4">
              Respond to this review from {typeof respondingToReview.reviewerId === 'object' ? respondingToReview.reviewerId.name : 'the reviewer'}:
            </p>
            <div className="bg-neutral-light p-4 rounded-lg mb-4">
              <p className="text-sm text-neutral-dark">{respondingToReview.content}</p>
            </div>
            <textarea
              placeholder="Type your response here..."
              rows={4}
              id="review-response-dashboard"
              className="w-full p-3 border border-neutral rounded-md focus:ring-primary focus:border-primary shadow-sm transition-shadow focus:shadow-md text-neutral-darker placeholder-gray-400 bg-white"
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRespondingToReview(null)}
                className="px-4 py-2 border border-neutral-dark text-neutral-dark rounded-md hover:bg-neutral font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const responseText = (document.getElementById('review-response-dashboard') as HTMLTextAreaElement)?.value;
                  if (!responseText?.trim()) {
                    addToast('Please enter a response', 'error');
                    return;
                  }
                  try {
                    await respondToReview(respondingToReview.id, responseText);
                    setRespondingToReview(null);
                    // Refresh reviews - userReviews will update automatically via useMemo
                    await fetchReviews({ revieweeId: currentUser.id });
                    const stats = await getReviewStats('user', currentUser.id);
                    setUserReviewStats(stats);
                  } catch (error) {
                    // Error handled in context
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Submit Response
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
