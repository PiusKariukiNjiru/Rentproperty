
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import { AppContextType, Property, PropertyTypeEnum, UserType, User, Review, ReviewStats } from '../types';
import { API_BASE_URL } from '../constants';
import PropertyCard from '../components/PropertyCard';
import Modal from '../components/Modal';
import LoadingSpinner, { FullPageLoader } from '../components/LoadingSpinner';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import { PROPERTY_TYPES_OPTIONS } from '../constants';
import { MapPinIcon, CurrencyDollarIcon, CalendarDaysIcon, UserCircleIcon, ChatBubbleLeftRightIcon, XMarkIcon, HeartIcon, PhotoIcon, BuildingOfficeIcon, ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, MagnifyingGlassIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';
import MapView from '../components/MapView';
import { Amenity } from '../types';

const PropertiesPage: React.FC = () => {
  const { 
    properties, currentUser, toggleFavorite, getLandlordById, 
    sendMessage, isLoading, setLoading, getPropertyById, 
    submitApplication, getApplicationByPropertyAndTenant, fetchProperties,
    fetchReviews, getReviewsByProperty, submitReview, getReviewStats,
    updateReview, deleteReview, respondToReview, reviews: allReviews
  } = useContext(AppContext) as AppContextType;
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeEnum | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>(''); // General keywords
  const [locationSearch, setLocationSearch] = useState<string>(''); // Specific location search
  
  // Advanced filters
  const [bedrooms, setBedrooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [radiusSearch, setRadiusSearch] = useState<string>(''); // Radius in miles
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Saved searches
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchEmailAlerts, setSaveSearchEmailAlerts] = useState(true);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const [contactMessage, setContactMessage] = useState('');
  const [applicationMessage, setApplicationMessage] = useState('');

  // Review states
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [respondingToReview, setRespondingToReview] = useState<Review | null>(null);
  const [isFetchingReviews, setIsFetchingReviews] = useState(false);
  const [hasFetchedReviews, setHasFetchedReviews] = useState<string | null>(null);

  // Filter reviews for selected property using useMemo to avoid infinite loops
  // Show all reviews (approved and pending) to everyone
  const propertyReviews = useMemo(() => {
    if (!selectedProperty) return [];
    return allReviews.filter(review => 
      review.propertyId && String(review.propertyId) === selectedProperty.id
    );
  }, [allReviews, selectedProperty?.id]);

  const existingApplication = useMemo(() => {
    if (selectedProperty && currentUser && currentUser.userType === UserType.Tenant) {
      return getApplicationByPropertyAndTenant(selectedProperty.id, currentUser.id);
    }
    return undefined;
  }, [selectedProperty, currentUser, getApplicationByPropertyAndTenant]);


  // Fetch saved searches on mount
  useEffect(() => {
    if (currentUser) {
      fetch(`${API_BASE_URL}/saved-searches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('localRentAuthToken')}` }
      })
        .then(res => res.json())
        .then(data => setSavedSearches(data))
        .catch(err => console.error('Error fetching saved searches:', err));
    }
  }, [currentUser]);

  // Fetch saved searches on mount
  useEffect(() => {
    if (currentUser) {
      fetch(`${API_BASE_URL}/saved-searches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('localRentAuthToken')}` }
      })
        .then(res => res.json())
        .then(data => setSavedSearches(data))
        .catch(err => console.error('Error fetching saved searches:', err));
    }
  }, [currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const propIdFromQuery = params.get('propId');
    
    // Set filters from URL params
    setMinPrice(params.get('minPrice') || '');
    setMaxPrice(params.get('maxPrice') || '');
    setPropertyTypeFilter(params.get('type') as PropertyTypeEnum || '');
    setSearchTerm(params.get('q') || '');
    setLocationSearch(params.get('loc') || '');
    setBedrooms(params.get('bedrooms') || '');
    setBathrooms(params.get('bathrooms') || '');
    if (params.get('amenities')) {
      setSelectedAmenities(params.get('amenities')!.split(',') as Amenity[]);
    }
    if (params.get('radius') && params.get('lat') && params.get('lng')) {
      setRadiusSearch(params.get('radius')!);
      setRadiusCenter({
        lat: parseFloat(params.get('lat')!),
        lng: parseFloat(params.get('lng')!)
      });
    }

    // Open detail modal if propId is in URL
    if (propIdFromQuery) {
        const prop = properties.find(p => p.id === propIdFromQuery); // Use current properties state
        if (prop && !isDetailModalOpen) { // Avoid re-opening if already open
            openDetailModal(prop, false); // Don't update URL again
        }
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, properties]); // properties added to re-check propId if properties load later

  // Only fetch on initial load or when URL params change (not on every filter input change)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParams: Record<string, string> = {};
    
    // Only fetch if there are actual URL params (initial load or after Apply Filters)
    if (params.toString()) {
      if (params.get('q')) queryParams.q = params.get('q')!;
      if (params.get('loc')) queryParams.loc = params.get('loc')!;
      if (params.get('minPrice')) queryParams.minPrice = params.get('minPrice')!;
      if (params.get('maxPrice')) queryParams.maxPrice = params.get('maxPrice')!;
      if (params.get('type')) queryParams.type = params.get('type')!;
      if (params.get('bedrooms')) queryParams.bedrooms = params.get('bedrooms')!;
      if (params.get('bathrooms')) queryParams.bathrooms = params.get('bathrooms')!;
      if (params.get('amenities')) queryParams.amenities = params.get('amenities')!;
      if (params.get('radius') && params.get('lat') && params.get('lng')) {
        queryParams.radius = params.get('radius')!;
        queryParams.lat = params.get('lat')!;
        queryParams.lng = params.get('lng')!;
      }

      setLoading(true);
      fetchProperties(queryParams).finally(() => {
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]); // Only depend on URL search params

  useEffect(() => {
    // Update filtered properties when properties change (backend already filtered)
    setFilteredProperties(properties);
  }, [properties]);


  const openDetailModal = (property: Property, updateNav = true) => {
    setSelectedProperty(property);
    setCurrentPhotoIndex(0);
    setIsDetailModalOpen(true);
    if (updateNav) {
      // Update URL only if not opened from URL param directly or if different property
      const params = new URLSearchParams(location.search);
      if (params.get('propId') !== property.id) {
        params.set('propId', property.id);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      }
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProperty(null);
    // Clear propId from URL
    const params = new URLSearchParams(location.search);
    params.delete('propId');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true }); 
  };

  const openContactModal = () => {
    if (!currentUser) {
        addToast("Please log in to contact the landlord.", 'warning');
        navigate('/auth', { state: { from: location } });
        return;
    }
    setIsContactModalOpen(true);
  }
  const closeContactModal = () => setIsContactModalOpen(false);

  const openApplyModal = () => {
    if (!currentUser) {
        addToast("Please log in to apply for a property.", 'warning');
        navigate('/auth', { state: { from: location } });
        return;
    }
    if (currentUser.userType !== UserType.Tenant) {
        addToast("Only tenants can apply for properties.", 'warning');
        return;
    }
    if (existingApplication) {
        addToast(`You have already applied for this property. Status: ${existingApplication.status}`, 'info');
        return;
    }
    setIsApplyModalOpen(true);
  }
  const closeApplyModal = () => setIsApplyModalOpen(false);

  const handleSendMessage = async () => {
    if (!selectedProperty || !currentUser || !contactMessage.trim()) return;
    
    // Ensure landlordId is a string
    const landlordIdValue = selectedProperty.landlordId;
    const landlordIdString = typeof landlordIdValue === 'string' ? landlordIdValue : (landlordIdValue as User).id;

    if (!landlordIdString) {
        addToast("Landlord information is missing for this property.", "error");
        return;
    }

    setLoading(true);
    try {
      await sendMessage({ 
          senderId: currentUser.id,
          receiverId: landlordIdString,
          propertyId: selectedProperty.id,
          subject: `Inquiry about: ${selectedProperty.title}`,
          content: contactMessage,
      });
      setContactMessage('');
      closeContactModal();
    } catch (error) {
        // Error toast handled by AppContext or sendMessage
    } finally {
        setLoading(false);
    }
  }

  const handleApply = async () => {
    if (!selectedProperty || !currentUser || currentUser.userType !== UserType.Tenant) return;
    setLoading(true);
    try {
        await submitApplication({
            propertyId: selectedProperty.id,
            tenantId: currentUser.id,
            messageToLandlord: applicationMessage.trim(),
        });
        setApplicationMessage('');
        closeApplyModal();
    } catch (error) {
        // Error toast handled by AppContext
    } finally {
        setLoading(false);
    }
  }

  const landlord = useMemo(() => {
    if (selectedProperty) {
        const landlordIdValue = selectedProperty.landlordId;
        const landlordIdString = typeof landlordIdValue === 'string' ? landlordIdValue : (landlordIdValue as User).id;
        return landlordIdString ? getLandlordById(landlordIdString) : undefined;
    }
    return undefined;
  }, [selectedProperty, getLandlordById]);

  // Fetch reviews when property is selected (only once per property)
  useEffect(() => {
    if (selectedProperty && currentUser && hasFetchedReviews !== selectedProperty.id) {
      setIsFetchingReviews(true);
      setHasFetchedReviews(selectedProperty.id);
      const fetchData = async () => {
        try {
          // Fetch all reviews (approved and pending) so everyone can see them
          await fetchReviews({ propertyId: selectedProperty.id, approvedOnly: false });
          // Stats should only include approved reviews for accuracy
          const stats = await getReviewStats('property', selectedProperty.id);
          setReviewStats(stats);
        } catch (error) {
          console.error('Error fetching reviews:', error);
        } finally {
          setIsFetchingReviews(false);
        }
      };
      fetchData();
    } else if (!selectedProperty) {
      setReviewStats(null);
      setHasFetchedReviews(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty?.id, currentUser?.id]); // Only depend on IDs, not functions

  const nextPhoto = () => {
    if (selectedProperty && selectedProperty.photos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % selectedProperty.photos.length);
    }
  };

  const prevPhoto = () => {
    if (selectedProperty && selectedProperty.photos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + selectedProperty.photos.length) % selectedProperty.photos.length);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handleFilterUpdate = async () => {
    // Build query params
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (locationSearch.trim()) params.set('loc', locationSearch.trim());
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (propertyTypeFilter) params.set('type', propertyTypeFilter);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (bathrooms) params.set('bathrooms', bathrooms);
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    if (radiusSearch && radiusCenter) {
      params.set('radius', radiusSearch);
      params.set('lat', radiusCenter.lat.toString());
      params.set('lng', radiusCenter.lng.toString());
    }
    if (selectedProperty) params.set('propId', selectedProperty.id); // Keep propId if modal is open

    // Update URL
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    
    // Fetch properties with new filters
    const queryParams: Record<string, string> = {};
    if (searchTerm.trim()) queryParams.q = searchTerm.trim();
    if (locationSearch.trim()) queryParams.loc = locationSearch.trim();
    if (minPrice) queryParams.minPrice = minPrice;
    if (maxPrice) queryParams.maxPrice = maxPrice;
    if (propertyTypeFilter) queryParams.type = propertyTypeFilter;
    if (bedrooms) queryParams.bedrooms = bedrooms;
    if (bathrooms) queryParams.bathrooms = bathrooms;
    if (selectedAmenities.length > 0) {
      queryParams.amenities = selectedAmenities.join(',');
    }
    if (radiusSearch && radiusCenter) {
      queryParams.radius = radiusSearch;
      queryParams.lat = radiusCenter.lat.toString();
      queryParams.lng = radiusCenter.lng.toString();
    }

    setLoading(true);
    try {
      await fetchProperties(queryParams);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: Amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setRadiusCenter({ lat, lng });
    // You can integrate with a geocoding service here to get address from lat/lng
  };


  if (isLoading && properties.length === 0 && !location.search.includes('propId')) {
    return <FullPageLoader message="Fetching properties..." />;
  }

  return (
    <div className="container mx-auto p-4 min-h-[calc(100vh-120px)]">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-8 text-center">Available Rentals</h1>
      
      <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5 items-end">
          <div className="lg:col-span-1">
            <label htmlFor="search-term-page" className="block text-sm font-medium text-neutral-dark mb-1">Keywords</label>
            <input 
                type="text" 
                id="search-term-page"
                placeholder="e.g. 'cozy', 'renovated'" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-neutral-darker placeholder-gray-400 bg-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="location-search-page" className="block text-sm font-medium text-neutral-dark mb-1">Location</label>
            <input 
                type="text" 
                id="location-search-page"
                placeholder="Address, City, Neighborhood, or Zip Code" 
                value={locationSearch} 
                onChange={(e) => setLocationSearch(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-neutral-darker placeholder-gray-400 bg-white"
            />
          </div>
          <div>
            <label htmlFor="min-price-page" className="block text-sm font-medium text-neutral-dark mb-1">Min Price</label>
            <input 
                type="number" 
                id="min-price-page"
                placeholder="$500" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-neutral-darker placeholder-gray-400 bg-white"
            />
          </div>
          <div>
            <label htmlFor="max-price-page" className="block text-sm font-medium text-neutral-dark mb-1">Max Price</label>
            <input 
                type="number" 
                id="max-price-page"
                placeholder="$2000" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-neutral-darker placeholder-gray-400 bg-white"
            />
          </div>
          <div>
            <label htmlFor="property-type-page" className="block text-sm font-medium text-neutral-dark mb-1">Property Type</label>
            <select 
                id="property-type-page"
                value={propertyTypeFilter} 
                onChange={(e) => setPropertyTypeFilter(e.target.value as PropertyTypeEnum | '')}
                className="mt-1 w-full px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md h-[46px] text-neutral-darker bg-white"
            >
              <option value="" className="text-black">All Types</option>
              {PROPERTY_TYPES_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="text-black">{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Advanced Filters Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-primary hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
            <svg className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-dark">View:</span>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary text-white' 
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map' 
                  ? 'bg-primary text-white' 
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral'
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-neutral">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bedrooms */}
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-neutral-dark mb-1">Bedrooms</label>
                <select
                  id="bedrooms"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-neutral-darker bg-white"
                >
                  <option value="" className="text-black">Any</option>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num} className="text-black">{num}+</option>
                  ))}
                </select>
              </div>

              {/* Bathrooms */}
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-neutral-dark mb-1">Bathrooms</label>
                <select
                  id="bathrooms"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-neutral-darker bg-white"
                >
                  <option value="" className="text-black">Any</option>
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num} className="text-black">{num}+</option>
                  ))}
                </select>
              </div>

              {/* Radius Search */}
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-neutral-dark mb-1">Radius (miles)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    id="radius"
                    placeholder="e.g. 5"
                    value={radiusSearch}
                    onChange={(e) => setRadiusSearch(e.target.value)}
                    className="mt-1 flex-1 px-3 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"
                  />
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setRadiusCenter({
                              lat: position.coords.latitude,
                              lng: position.coords.longitude
                            });
                            addToast('Location set to your current position', 'success');
                          },
                          () => addToast('Could not get your location', 'error')
                        );
                      } else {
                        addToast('Geolocation not supported', 'error');
                      }
                    }}
                    className="mt-1 px-3 py-2.5 bg-primary text-white rounded-md hover:bg-blue-700 text-sm"
                    title="Use current location"
                  >
                    📍
                  </button>
                </div>
                {radiusCenter && (
                  <p className="text-xs text-gray-500 mt-1">
                    Center: {radiusCenter.lat.toFixed(4)}, {radiusCenter.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-dark mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {(['parking', 'laundry', 'pet-friendly', 'furnished', 'air-conditioning', 'heating', 'wifi', 'dishwasher', 'gym', 'pool', 'balcony', 'garden', 'elevator', 'security', 'storage'] as Amenity[]).map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedAmenities.includes(amenity)
                        ? 'bg-primary text-white'
                        : 'bg-neutral-light text-neutral-dark hover:bg-neutral'
                    }`}
                  >
                    {amenity.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setShowSaveSearchModal(true)}
            className="text-primary hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            disabled={!currentUser}
            title={!currentUser ? 'Please log in to save searches' : 'Save this search'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Save Search</span>
          </button>
          <button 
            onClick={handleFilterUpdate}
            className="bg-secondary hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-md flex items-center justify-center space-x-2 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Saved Searches */}
      {currentUser && savedSearches.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-neutral-dark mb-3">Saved Searches</h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map(search => (
              <button
                key={search.id}
                onClick={() => {
                  // Apply saved search criteria
                  if (search.searchCriteria.q) setSearchTerm(search.searchCriteria.q);
                  if (search.searchCriteria.loc) setLocationSearch(search.searchCriteria.loc);
                  if (search.searchCriteria.minPrice) setMinPrice(search.searchCriteria.minPrice);
                  if (search.searchCriteria.maxPrice) setMaxPrice(search.searchCriteria.maxPrice);
                  if (search.searchCriteria.type) setPropertyTypeFilter(search.searchCriteria.type as PropertyTypeEnum);
                  if (search.searchCriteria.bedrooms) setBedrooms(search.searchCriteria.bedrooms);
                  if (search.searchCriteria.bathrooms) setBathrooms(search.searchCriteria.bathrooms);
                  if (search.searchCriteria.amenities) setSelectedAmenities(search.searchCriteria.amenities as Amenity[]);
                  if (search.searchCriteria.radius && search.searchCriteria.lat && search.searchCriteria.lng) {
                    setRadiusSearch(search.searchCriteria.radius);
                    setRadiusCenter({
                      lat: parseFloat(search.searchCriteria.lat),
                      lng: parseFloat(search.searchCriteria.lng)
                    });
                  }
                  handleFilterUpdate();
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm font-medium"
              >
                {search.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <Modal isOpen={showSaveSearchModal} onClose={() => setShowSaveSearchModal(false)} title="Save Search">
          <div className="space-y-4">
            <div>
              <label htmlFor="search-name" className="block text-sm font-medium text-neutral-dark mb-1">
                Search Name
              </label>
              <input
                type="text"
                id="search-name"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="e.g., Downtown 2BR Apartments"
                className="w-full px-3 py-2 border border-neutral rounded-md focus:ring-primary focus:border-primary text-neutral-darker placeholder-gray-400 bg-white"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-alerts"
                checked={saveSearchEmailAlerts}
                onChange={(e) => setSaveSearchEmailAlerts(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="email-alerts" className="text-sm text-neutral-dark">
                Receive email alerts when new properties match this search
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowSaveSearchModal(false)}
                className="px-4 py-2 border border-neutral-dark text-neutral-dark rounded-md hover:bg-neutral"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!saveSearchName.trim()) {
                    addToast('Please enter a search name', 'error');
                    return;
                  }
                  try {
                    const searchCriteria = {
                      q: searchTerm || undefined,
                      loc: locationSearch || undefined,
                      minPrice: minPrice || undefined,
                      maxPrice: maxPrice || undefined,
                      type: propertyTypeFilter || undefined,
                      bedrooms: bedrooms || undefined,
                      bathrooms: bathrooms || undefined,
                      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
                      radius: radiusSearch || undefined,
                      lat: radiusCenter?.lat.toString() || undefined,
                      lng: radiusCenter?.lng.toString() || undefined,
                    };
                    
                    const response = await fetch(`${API_BASE_URL}/saved-searches`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('localRentAuthToken')}`
                      },
                      body: JSON.stringify({
                        name: saveSearchName,
                        searchCriteria,
                        emailAlerts: saveSearchEmailAlerts,
                      }),
                    });
                    
                    if (response.ok) {
                      addToast('Search saved successfully!', 'success');
                      setShowSaveSearchModal(false);
                      setSaveSearchName('');
                      // Refresh saved searches
                      const searchesResponse = await fetch(`${API_BASE_URL}/saved-searches`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('localRentAuthToken')}` }
                      });
                      if (searchesResponse.ok) {
                        const searches = await searchesResponse.json();
                        setSavedSearches(searches);
                      }
                    } else {
                      addToast('Failed to save search', 'error');
                    }
                  } catch (error) {
                    addToast('Error saving search', 'error');
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isLoading && <div className="flex justify-center my-10"><LoadingSpinner size="lg" message="Filtering properties..." /></div>}
      
      {!isLoading && filteredProperties.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-md mt-8">
          <BuildingOfficeIcon className="w-24 h-24 text-neutral-DEFAULT mx-auto mb-4" />
          <p className="text-2xl text-neutral-dark font-semibold">No Properties Found</p>
          <p className="text-gray-500 mt-2">Try adjusting your search filters or check back later for new listings.</p>
        </div>
      )}

      {!isLoading && filteredProperties.length > 0 && (
        <>
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {filteredProperties.map(property => (
                <PropertyCard key={property.id} property={property} onViewDetails={openDetailModal} />
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <MapView
                properties={filteredProperties}
                onPropertyClick={openDetailModal}
                selectedPropertyId={selectedProperty?.id}
                center={radiusCenter || undefined}
              />
            </div>
          )}
        </>
      )}

      {selectedProperty && (
        <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} title="" size="xl">
          <div className="space-y-6">
            {selectedProperty.photos && selectedProperty.photos.length > 0 && (
              <div className="relative group -mx-6 -mt-6"> {/* Extend to modal edges */}
                <img 
                    src={selectedProperty.photos[currentPhotoIndex] || `https://picsum.photos/seed/${selectedProperty.id}_${currentPhotoIndex}/800/500`} 
                    alt={`${selectedProperty.title} - Photo ${currentPhotoIndex + 1}`} 
                    className="w-full h-[28rem] sm:h-[32rem] object-cover rounded-t-lg shadow-lg" // Only top rounded
                />
                {selectedProperty.photos.length > 1 && (
                  <>
                    <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-md" aria-label="Previous Photo">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-md" aria-label="Next Photo">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                        {selectedProperty.photos.map((_,idx) => (
                            <button key={idx} onClick={() => setCurrentPhotoIndex(idx)} className={`w-2.5 h-2.5 rounded-full ${currentPhotoIndex === idx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'} transition-all`}></button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-start pt-2">
                <div className="md:col-span-2 space-y-3">
                    <h3 className="text-3xl font-bold text-primary">{selectedProperty.title}</h3>
                    <div className="flex items-center text-neutral-dark text-md">
                        <MapPinIcon className="w-5 h-5 mr-2 text-secondary flex-shrink-0" />
                        <span>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.zipCode}</span>
                    </div>
                     {selectedProperty.latitude && selectedProperty.longitude && (
                        <a 
                            href={`https://maps.google.com/?q=${selectedProperty.latitude},${selectedProperty.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-secondary hover:text-blue-700 font-medium group"
                        >
                           <MapPinIcon className="w-4 h-4 mr-1.5 group-hover:text-blue-600"/> View on Google Maps
                        </a>
                    )}
                    <div className="flex items-center text-neutral-dark text-md">
                        <BuildingOfficeIcon className="w-5 h-5 mr-2 text-secondary flex-shrink-0" />
                        <span>Type: {selectedProperty.propertyType}</span>
                    </div>
                    <div className="flex items-center text-neutral-dark text-md">
                        <CurrencyDollarIcon className="w-5 h-5 mr-2 text-secondary flex-shrink-0" />
                        <span className="text-3xl font-bold text-secondary">${selectedProperty.price.toLocaleString()}</span><span className="ml-1 text-gray-500">/month</span>
                    </div>
                    <div className="flex items-center text-neutral-dark text-md">
                        <CalendarDaysIcon className="w-5 h-5 mr-2 text-secondary flex-shrink-0" />
                        <span>Available: {formatDate(selectedProperty.availabilityDate)}</span>
                    </div>
                    {(selectedProperty.bedrooms || selectedProperty.bathrooms || selectedProperty.squareFootage) && (
                      <div className="flex items-center gap-4 text-neutral-dark text-md">
                        {selectedProperty.bedrooms && (
                          <span className="flex items-center">
                            <span className="mr-1">🛏️</span>
                            <span>{selectedProperty.bedrooms} Bedroom{selectedProperty.bedrooms > 1 ? 's' : ''}</span>
                          </span>
                        )}
                        {selectedProperty.bathrooms && (
                          <span className="flex items-center">
                            <span className="mr-1">🚿</span>
                            <span>{selectedProperty.bathrooms} Bathroom{selectedProperty.bathrooms > 1 ? 's' : ''}</span>
                          </span>
                        )}
                        {selectedProperty.squareFootage && (
                          <span className="flex items-center">
                            <span className="mr-1">📐</span>
                            <span>{selectedProperty.squareFootage.toLocaleString()} sq ft</span>
                          </span>
                        )}
                      </div>
                    )}
                    {selectedProperty.petPolicy && (
                      <div className="flex items-center text-neutral-dark text-md">
                        <span className="mr-2">🐾</span>
                        <span>
                          <strong>Pet Policy:</strong> {
                            selectedProperty.petPolicy === 'no-pets' ? 'No Pets' :
                            selectedProperty.petPolicy === 'cats-only' ? 'Cats Only' :
                            selectedProperty.petPolicy === 'dogs-only' ? 'Dogs Only' :
                            selectedProperty.petPolicy === 'small-pets-only' ? 'Small Pets Only' :
                            selectedProperty.petPolicy === 'all-pets-allowed' ? 'All Pets Allowed' :
                            'Case by Case'
                          }
                        </span>
                      </div>
                    )}
                    {selectedProperty.leaseTerms && selectedProperty.leaseTerms.length > 0 && (
                      <div className="flex items-center flex-wrap gap-2 text-neutral-dark text-md">
                        <span className="mr-2"><strong>Lease Terms:</strong></span>
                        {selectedProperty.leaseTerms.map(term => (
                          <span key={term} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                            {term.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-lg font-semibold text-primary mb-2">Amenities</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedProperty.amenities.map(amenity => (
                            <span key={amenity} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {amenity.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
             </div>
            
            <div className="pt-2">
                <h4 className="text-xl font-semibold text-primary mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedProperty.description}</p>
            </div>
            <div className="pt-2">
                <h4 className="text-xl font-semibold text-primary mb-2">Tenant Requirements</h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedProperty.tenantRequirements || <span className="italic text-gray-400">Not specified.</span>}</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 pt-4 border-t">
              {currentUser?.userType === UserType.Tenant && (
                <button 
                  onClick={openApplyModal}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  disabled={!currentUser || !!existingApplication || isLoading}
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>{existingApplication ? `Applied (${existingApplication.status})` : 'Apply Now'}</span>
                </button>
              )}
              <button 
                onClick={openContactModal}
                className="flex-1 bg-secondary hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                disabled={!currentUser || isLoading}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>Contact Landlord</span>
              </button>
              {currentUser?.userType === UserType.Tenant && (
                <button 
                  onClick={() => toggleFavorite(selectedProperty.id)}
                  className={`flex-1 border-2 font-semibold py-3 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors shadow-sm hover:shadow-md ${
                    currentUser.favoriteProperties.includes(selectedProperty.id) 
                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                    : 'text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600'
                  }`}
                  disabled={isLoading}
                >
                  <HeartIcon className="w-5 h-5" filled={currentUser.favoriteProperties.includes(selectedProperty.id)} />
                  <span>{currentUser.favoriteProperties.includes(selectedProperty.id) ? 'Favorited' : 'Add to Favorites'}</span>
                </button>
              )}
            </div>
             {!currentUser && <p className="text-sm text-center text-red-600 mt-2">Please log in to apply, contact landlord, or add to favorites.</p>}
            
            {/* Reviews Section */}
            <div className="pt-6 mt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-primary">Reviews</h4>
                {currentUser && currentUser.userType === UserType.Tenant && landlord && (
                  <button
                    onClick={() => {
                      setEditingReview(null);
                      setIsReviewFormOpen(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Write a Review
                  </button>
                )}
              </div>
              
              <ReviewList
                reviews={propertyReviews}
                stats={reviewStats || undefined}
                currentUserId={currentUser?.id}
                onEdit={(review) => {
                  setEditingReview(review);
                  setIsReviewFormOpen(true);
                }}
                onDelete={async (reviewId) => {
                  try {
                    await deleteReview(reviewId);
                    // Reviews will automatically update via useMemo when context changes
                  } catch (error) {
                    // Error handled in context
                  }
                }}
                onRespond={(review) => {
                  setRespondingToReview(review);
                }}
                showProperty={false}
                isLoading={false}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Review Form Modal */}
      {selectedProperty && landlord && (
        <Modal
          isOpen={isReviewFormOpen}
          onClose={() => {
            setIsReviewFormOpen(false);
            setEditingReview(null);
          }}
          title={editingReview ? 'Edit Review' : 'Write a Review'}
          size="md"
        >
          <ReviewForm
            revieweeId={typeof selectedProperty.landlordId === 'string' ? selectedProperty.landlordId : selectedProperty.landlordId.id}
            propertyId={selectedProperty.id}
            onSubmit={async (reviewData) => {
              try {
                if (editingReview) {
                  await updateReview(editingReview.id, reviewData);
                } else {
                  await submitReview(reviewData);
                }
                setIsReviewFormOpen(false);
                setEditingReview(null);
                // Refresh reviews after a short delay to allow backend to process
                setTimeout(async () => {
                  try {
                    await fetchReviews({ propertyId: selectedProperty.id });
                    const stats = await getReviewStats('property', selectedProperty.id);
                    setReviewStats(stats);
                  } catch (error) {
                    console.error('Error refreshing reviews:', error);
                  }
                }, 500);
              } catch (error) {
                // Error handled in context
              }
            }}
            onCancel={() => {
              setIsReviewFormOpen(false);
              setEditingReview(null);
            }}
            initialData={editingReview}
            isLoading={isLoading}
            revieweeName={landlord.name}
            propertyTitle={selectedProperty.title}
          />
        </Modal>
      )}

      {/* Respond to Review Modal */}
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
              id="review-response"
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
                  const responseText = (document.getElementById('review-response') as HTMLTextAreaElement)?.value;
                  if (!responseText?.trim()) {
                    addToast('Please enter a response', 'error');
                    return;
                  }
                  try {
                    await respondToReview(respondingToReview.id, responseText);
                    setRespondingToReview(null);
                    // Refresh reviews after a short delay
                    if (selectedProperty) {
                      setTimeout(async () => {
                        try {
                          await fetchReviews({ propertyId: selectedProperty.id });
                          const stats = await getReviewStats('property', selectedProperty.id);
                          setReviewStats(stats);
                        } catch (error) {
                          console.error('Error refreshing reviews:', error);
                        }
                      }, 500);
                    }
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

        <Modal isOpen={isContactModalOpen} onClose={closeContactModal} title={`Contact Landlord for ${selectedProperty?.title}`} size="md">
            <textarea 
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="w-full p-3 border border-neutral rounded-md focus:ring-primary focus:border-primary shadow-sm transition-shadow focus:shadow-md text-neutral-darker placeholder-gray-400 bg-white"
                aria-label="Message to Landlord"
            />
            <button 
                onClick={handleSendMessage}
                className="mt-4 w-full bg-primary hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors disabled:opacity-60"
                disabled={!contactMessage.trim() || isLoading}
            >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Send Message'}
            </button>
        </Modal>

        <Modal isOpen={isApplyModalOpen} onClose={closeApplyModal} title={`Apply for ${selectedProperty?.title}`} size="md">
            <p className="text-neutral-dark mb-4">You are about to submit an application for this property. You can add an optional message to the landlord.</p>
            <textarea 
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Optional message to landlord (e.g., brief introduction, availability)..."
                rows={4}
                className="w-full p-3 border border-neutral rounded-md focus:ring-primary focus:border-primary shadow-sm transition-shadow focus:shadow-md text-neutral-darker placeholder-gray-400 bg-white"
                aria-label="Optional message for application"
            />
            <div className="mt-4 flex justify-end space-x-3">
                 <button 
                    type="button"
                    onClick={closeApplyModal}
                    className="px-4 py-2 border border-neutral-dark text-neutral-dark rounded-md hover:bg-neutral font-medium"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleApply}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-md transition-colors disabled:opacity-60"
                    disabled={isLoading}
                >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Confirm Application'}
                </button>
            </div>
        </Modal>

    </div>
  );
};

export default PropertiesPage;
