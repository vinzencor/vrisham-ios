import React, { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';
import { MARKER_CONFIG } from '../../config/maps';

interface AddressMapPreviewProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
  size?: 'small' | 'medium';
  onClick?: () => void;
  isClickable?: boolean;
}

const MAP_CONTAINER_STYLES = {
  small: { width: '150px', height: '100px' },
  medium: { width: '200px', height: '150px' },
};

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  gestureHandling: 'none',
  clickableIcons: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export const AddressMapPreview: React.FC<AddressMapPreviewProps> = ({
  latitude,
  longitude,
  address,
  className = '',
  size = 'small',
  onClick,
  isClickable = false,
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Don't render if no coordinates
  if (!latitude || !longitude) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={MAP_CONTAINER_STYLES[size]}
      >
        <div className="text-center">
          <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Location not available</p>
          {address && (
            <p className="text-xs text-gray-400 mt-1 px-2 leading-tight">
              {address.length > 30 ? `${address.substring(0, 30)}...` : address}
            </p>
          )}
        </div>
      </div>
    );
  }

  const coordinates = { lat: latitude, lng: longitude };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  // Handle loading states
  if (loadError) {
    return (
      <div
        className={`bg-red-50 rounded-lg flex items-center justify-center ${className}`}
        style={MAP_CONTAINER_STYLES[size]}
      >
        <div className="text-center">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-red-600">Map error</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={MAP_CONTAINER_STYLES[size]}
      >
        <div className="text-center">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-1" />
          <p className="text-xs text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const containerClasses = `rounded-lg overflow-hidden border border-gray-200 relative ${className} ${
    isClickable ? 'cursor-pointer hover:border-[#73338A] hover:shadow-md transition-all duration-200' : ''
  }`;

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <div className={containerClasses} onClick={handleClick}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLES[size]}
        center={coordinates}
        zoom={15}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
      >
        <Marker
          position={coordinates}
          icon={{
            ...MARKER_CONFIG.icon,
            scaledSize: { width: 24, height: 24 }, // Smaller marker for preview
            anchor: { x: 12, y: 24 },
          }}
        />
      </GoogleMap>

      {/* Clickable overlay */}
      {isClickable && (
        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-10 transition-colors duration-200 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
            <MapPin className="w-4 h-4 text-[#73338A]" />
          </div>
        </div>
      )}

      {/* Optional address overlay */}
      {address && size === 'medium' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
          <p className="text-xs truncate">{address}</p>
        </div>
      )}
    </div>
  );
};
