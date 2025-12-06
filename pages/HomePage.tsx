import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import { AppContextType, PropertyTypeEnum, UserType, Amenity } from '../types';
import { PROPERTY_TYPES_OPTIONS } from '../constants';
import { MagnifyingGlassIcon, BuildingOfficeIcon, PlusCircleIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AppContext) as AppContextType;
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState(''); // Keywords like "2 bedroom", "pet friendly"
  const [locationSearch, setLocationSearch] = useState(''); // For address, city, zip
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null]);
  const [propertyType, setPropertyType] = useState<PropertyTypeEnum | ''>('');
  
  // Advanced search (optional)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [bedrooms, setBedrooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [radiusSearch, setRadiusSearch] = useState<string>('');
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number } | null>(null);

  const toggleAmenity = (amenity: Amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSearch = () => {
    const query = new URLSearchParams();
    if (searchTerm.trim()) query.append('q', searchTerm.trim());
    if (locationSearch.trim()) query.append('loc', locationSearch.trim());
    if (priceRange[0] !== null) query.append('minPrice', priceRange[0].toString());
    if (priceRange[1] !== null) query.append('maxPrice', priceRange[1].toString());
    if (propertyType) query.append('type', propertyType);
    
    // Advanced filters
    if (bedrooms) query.append('bedrooms', bedrooms);
    if (bathrooms) query.append('bathrooms', bathrooms);
    if (selectedAmenities.length > 0) query.append('amenities', selectedAmenities.join(','));
    if (radiusSearch && radiusCenter) {
      query.append('radius', radiusSearch);
      query.append('lat', radiusCenter.lat.toString());
      query.append('lng', radiusCenter.lng.toString());
    }
    
    navigate(`/properties?${query.toString()}`);
  };

  return (
    <div className="min-h-[calc(100vh-120px)]"> {/* Adjust 120px based on header/footer height */}
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-16 sm:py-20 px-4 text-center">
        <div className="container mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 animate-fadeInDown">Find Your Next Home, Locally.</h1>
          <p className="text-lg sm:text-xl mb-8 animate-fadeInUp">Connecting neighbors for easier, friendlier rentals in your community.</p>
          
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-xl animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="search-term" className="block text-sm font-medium text-neutral-dark text-left mb-1">Keywords</label>
                <input
                  type="text"
                  id="search-term"
                  placeholder="e.g. '2 bedroom', 'near park'"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-white placeholder-gray-400 bg-neutral-darker"
                />
              </div>
              <div>
                <label htmlFor="location-search" className="block text-sm font-medium text-neutral-dark text-left mb-1">Location</label>
                <input
                  type="text"
                  id="location-search"
                  placeholder="Address, City, Neighborhood, Zip"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-white placeholder-gray-400 bg-neutral-darker"
                />
              </div>
              <div>
                <label htmlFor="property-type-search" className="block text-sm font-medium text-neutral-dark text-left mb-1">Property Type</label>
                <select
                  id="property-type-search"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyTypeEnum | '')}
                  className="mt-1 w-full px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md h-[46px] text-white bg-neutral-darker"
                >
                  <option value="" className="text-black">Any Type</option>
                  {PROPERTY_TYPES_OPTIONS.map(option => (
                    <option key={option.value} value={option.value} className="text-black">{option.label}</option>
                  ))}
                </select>
              </div>
               <div>
                <label htmlFor="min-price" className="block text-sm font-medium text-neutral-dark text-left mb-1">Min Price ($)</label>
                <input
                  type="number"
                  id="min-price"
                  placeholder="e.g. 500"
                  value={priceRange[0] ?? ''}
                  onChange={(e) => setPriceRange([e.target.value ? parseInt(e.target.value) : null, priceRange[1]])}
                  className="mt-1 w-full px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-white placeholder-gray-400 bg-neutral-darker"
                />
              </div>
              <div>
                <label htmlFor="max-price" className="block text-sm font-medium text-neutral-dark text-left mb-1">Max Price ($)</label>
                <input
                  type="number"
                  id="max-price"
                  placeholder="e.g. 2000"
                  value={priceRange[1] ?? ''}
                  onChange={(e) => setPriceRange([priceRange[0], e.target.value ? parseInt(e.target.value) : null])}
                  className="mt-1 w-full px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary transition-shadow focus:shadow-md text-white placeholder-gray-400 bg-neutral-darker"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-secondary hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors h-[46px] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span>Search</span>
              </button>
            </div>
            
            {/* Advanced Search Toggle */}
            <div className="col-span-full mt-4 flex justify-center">
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="text-primary hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>{showAdvancedSearch ? 'Hide' : 'Show'} Advanced Search</span>
                <svg className={`w-4 h-4 transition-transform ${showAdvancedSearch ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Advanced Search Options */}
            {showAdvancedSearch && (
              <div className="col-span-full mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Bedrooms */}
                  <div>
                    <label htmlFor="bedrooms-home" className="block text-sm font-medium text-neutral-dark mb-1">Bedrooms</label>
                    <select
                      id="bedrooms-home"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-white bg-neutral-darker"
                    >
                      <option value="" className="text-black">Any</option>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num} className="text-black">{num}+</option>
                      ))}
                    </select>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label htmlFor="bathrooms-home" className="block text-sm font-medium text-neutral-dark mb-1">Bathrooms</label>
                    <select
                      id="bathrooms-home"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-white bg-neutral-darker"
                    >
                      <option value="" className="text-black">Any</option>
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num} className="text-black">{num}+</option>
                      ))}
                    </select>
                  </div>

                  {/* Radius Search */}
                  <div>
                    <label htmlFor="radius-home" className="block text-sm font-medium text-neutral-dark mb-1">Radius (miles)</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        id="radius-home"
                        placeholder="e.g. 5"
                        value={radiusSearch}
                        onChange={(e) => setRadiusSearch(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-neutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"
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
                        className="px-3 py-2.5 bg-primary text-white rounded-md hover:bg-blue-700 text-sm"
                        title="Use current location"
                      >
                        📍
                      </button>
                    </div>
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
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-light">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col items-center">
              <BuildingOfficeIcon className="w-16 h-16 text-primary mb-6" />
              <h2 className="text-3xl font-semibold text-primary mb-4">Looking for a Rental?</h2>
              <p className="text-neutral-dark mb-8 text-lg max-w-md">Browse listings in your community and find the perfect place to call home.</p>
              <button
                onClick={() => navigate('/properties')}
                className="bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg mt-auto"
              >
                View Rentals
              </button>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col items-center">
              <PlusCircleIcon className="w-16 h-16 text-secondary mb-6" />
              <h2 className="text-3xl font-semibold text-secondary mb-4">Have a Property to List?</h2>
              <p className="text-neutral-dark mb-8 text-lg max-w-md">Easily list your property and connect with potential tenants in your neighborhood.</p>
              <button
                onClick={() => {
                  if (currentUser && currentUser.userType === UserType.Landlord) {
                    navigate('/dashboard?tab=listings&action=create');
                  } else if (currentUser && currentUser.userType === UserType.Tenant) {
                    addToast("Please switch to a Landlord account or create one to list properties.", 'warning');
                    navigate('/dashboard?tab=profile');
                  }
                  else {
                    addToast("Please log in or sign up as a Landlord to list properties.", 'info');
                    navigate('/auth');
                  }
                }}
                className="bg-secondary hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg mt-auto"
              >
                List Your Property
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">How LocalRent Works</h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10 text-center">
            <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-bold shadow-sm">1</div>
              <h3 className="text-2xl font-semibold text-neutral-dark mb-3">Sign Up or Log In</h3>
              <p className="text-gray-600">Quickly create an account as a Tenant or Landlord to get started.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-secondary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-bold shadow-sm">2</div>
              <h3 className="text-2xl font-semibold text-neutral-dark mb-3">Browse or List</h3>
              <p className="text-gray-600">Tenants search for properties, Landlords post their listings with ease and detail.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-accent text-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-bold shadow-sm">3</div>
              <h3 className="text-2xl font-semibold text-neutral-dark mb-3">Connect & Meet</h3>
              <p className="text-gray-600">Communicate directly, arrange viewings, and manage rentals simply and locally.</p>
            </div>
          </div>
        </div>
      </section>
       {/* Added some keyframes for animations if not available */}
      <style>
        {`
        @keyframes fadeInDown { 0% { opacity:0; transform:translateY(-20px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes fadeInUp { 0% { opacity:0; transform:translateY(20px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { 0% { opacity:0; } 100% { opacity:1; } }
        .animate-fadeInDown { animation:fadeInDown 0.5s ease-out forwards; }
        .animate-fadeInUp { animation:fadeInUp 0.5s ease-out 0.2s forwards; } /* Delay for fadeInUp */
        .animate-fadeIn { animation:fadeIn 0.7s ease-out 0.4s forwards; } /* Delay for fadeIn */
        `}
      </style>
    </div>
  );
};

export default HomePage;