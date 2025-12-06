import React, { useContext, memo } from 'react';
import { Property, UserType, AppContextType } from '../types';
import { MapPinIcon, CurrencyDollarIcon, CalendarDaysIcon, HeartIcon, BuildingOfficeIcon } from './icons';
import { AppContext } from '../contexts/AppContext';
import { LazyImage } from './LazyImage';

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = memo(({ property, onViewDetails }) => {
  const { currentUser, toggleFavorite, isLoading } = useContext(AppContext) as AppContextType;

  const isFavorite = currentUser?.userType === UserType.Tenant && currentUser.favoriteProperties.includes(property.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (currentUser?.userType === UserType.Tenant) {
      toggleFavorite(property.id);
    } 
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Use the first photo, or a placeholder if photos array is empty or first item is empty string
  const displayImage = property.photos && property.photos.length > 0 && property.photos[0]
    ? property.photos[0]
    : `https://picsum.photos/seed/${property.id}/600/400?grayscale&blur=2`;


  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full group"
      onClick={() => onViewDetails(property)}
      role="article"
      aria-labelledby={`property-title-${property.id}`}
    >
      <div className="relative">
        <LazyImage 
          src={displayImage}
          alt={`View of ${property.title}`} 
          className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300 bg-neutral"
        />
        {currentUser?.userType === UserType.Tenant && (
          <button 
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className={`absolute top-3 right-3 p-2.5 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${isFavorite ? 'bg-red-500 text-white shadow-md focus:ring-red-400' : 'bg-white text-red-500 hover:bg-red-100 shadow focus:ring-primary'}`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
          >
            <HeartIcon className="w-6 h-6" filled={isFavorite} />
          </button>
        )}
         <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white px-4 py-1.5 text-sm rounded-tr-lg">
            <div className="flex items-center space-x-1.5">
                <BuildingOfficeIcon className="w-4 h-4" />
                <span>{property.propertyType}</span>
            </div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 id={`property-title-${property.id}`} className="text-2xl font-semibold text-primary mb-2 truncate group-hover:text-blue-700" title={property.title}>{property.title}</h3>
        
        <div className="flex items-center text-neutral-dark mb-1.5 text-sm">
          <MapPinIcon className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
          <span className="truncate" title={`${property.address}, ${property.city}`}>{property.address}, {property.city}</span>
        </div>
        <div className="flex items-center text-neutral-dark mb-1.5">
          <CurrencyDollarIcon className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
          <span className="text-xl font-bold text-secondary">${property.price.toLocaleString()}</span><span className="text-gray-500 ml-1">/month</span>
        </div>
        <div className="flex items-center text-neutral-dark text-sm mb-1.5">
          <CalendarDaysIcon className="w-5 h-5 mr-2 text-primary flex-shrink-0" />
          <span>Available: {formatDate(property.availabilityDate)}</span>
        </div>
        {(property.bedrooms || property.bathrooms || property.squareFootage) && (
          <div className="flex items-center gap-3 text-neutral-dark text-sm mb-3">
            {property.bedrooms && <span>🛏️ {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>}
            {property.bathrooms && <span>🚿 {property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>}
            {property.squareFootage && <span>📐 {property.squareFootage.toLocaleString()} sq ft</span>}
          </div>
        )}
        {property.petPolicy && property.petPolicy !== 'no-pets' && (
          <div className="text-sm text-secondary mb-2">
            🐾 {property.petPolicy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        )}
        <p className="text-gray-600 text-sm mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2" title={property.description}>
          {property.description}
        </p>
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails(property); }}
          className="mt-auto w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        >
          View Details
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.property.photos?.[0] === nextProps.property.photos?.[0] &&
    prevProps.property.price === nextProps.property.price &&
    prevProps.property.title === nextProps.property.title
  );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
