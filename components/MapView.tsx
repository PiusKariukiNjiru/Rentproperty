import React, { useEffect, useRef } from 'react';
import { Property } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onPropertyClick?: (property: Property) => void;
  selectedPropertyId?: string;
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({
  properties,
  center,
  zoom = 10,
  onPropertyClick,
  selectedPropertyId,
  className = '',
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Calculate center from properties if not provided
  const mapCenter = center || (() => {
    const propsWithCoords = properties.filter(p => p.latitude && p.longitude);
    if (propsWithCoords.length === 0) return { lat: 40.7128, lng: -74.0060 }; // Default to NYC
    
    const avgLat = propsWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / propsWithCoords.length;
    const avgLng = propsWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / propsWithCoords.length;
    return { lat: avgLat, lng: avgLng };
  })();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView([mapCenter.lat, mapCenter.lng], zoom);
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Only run once on mount

  // Update map center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([mapCenter.lat, mapCenter.lng], zoom);
    }
  }, [mapCenter.lat, mapCenter.lng, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each property
    properties.forEach(property => {
      if (!property.latitude || !property.longitude) return;

      const marker = L.marker([property.latitude, property.longitude], {
        icon: DefaultIcon,
      }).addTo(mapRef.current!);

      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-lg mb-1">${property.title}</h3>
          <p class="text-sm text-gray-600 mb-2">${property.address}</p>
          <p class="text-primary font-bold">$${property.price.toLocaleString()}/month</p>
          ${onPropertyClick ? `<button class="mt-2 px-3 py-1 bg-primary text-white rounded hover:bg-blue-700 text-sm" onclick="window.mapViewClick('${property.id}')">View Details</button>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      if (onPropertyClick) {
        marker.on('click', () => {
          onPropertyClick(property);
        });
      }

      // Highlight selected property
      if (selectedPropertyId === property.id) {
        marker.setIcon(
          L.icon({
            iconUrl: icon,
            shadowUrl: iconShadow,
            iconSize: [35, 51],
            iconAnchor: [17, 51],
            popupAnchor: [1, -34],
            shadowSize: [51, 51],
            className: 'selected-marker'
          })
        );
        marker.openPopup();
      }

      markersRef.current.push(marker);
    });

    // Store click handler globally for popup buttons
    if (onPropertyClick) {
      (window as any).mapViewClick = (propertyId: string) => {
        const property = properties.find(p => p.id === propertyId);
        if (property) onPropertyClick(property);
      };
    }
  }, [properties, selectedPropertyId, onPropertyClick]);

  return (
    <div className={`w-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] rounded-lg border border-neutral shadow-lg"></div>
    </div>
  );
};

export default MapView;
