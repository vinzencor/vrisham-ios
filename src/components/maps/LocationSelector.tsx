import React, { useState, useRef } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { GoogleMapPicker } from './GoogleMapPicker';
import { getCurrentLocation, LocationResult, LocationCoordinates, reverseGeocode } from '../../utils/location';

interface LocationSelectorProps {
  onLocationSelect: (location: LocationResult) => void;
  initialLocation?: LocationCoordinates;
  className?: string;
  variant?: 'button' | 'card';
  showCurrentLocationOption?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  initialLocation,
  className = '',
  variant = 'button',
  showCurrentLocationOption = true,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<LocationCoordinates | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coordinates = await getCurrentLocation();
      setDetectedLocation(coordinates);

      // Initialize geocoder if not already done
      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder();
      }

      // Perform reverse geocoding to get formatted address
      const locationResult = await reverseGeocode(coordinates, geocoderRef.current);
      onLocationSelect(locationResult);
    } catch (error: any) {
      console.error('Error getting current location:', error);
      // Fallback to map picker if current location fails
      setDetectedLocation(null);
      setIsMapOpen(true);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleMapLocationSelect = (location: LocationResult) => {
    onLocationSelect(location);
    setIsMapOpen(false);
  };

  if (variant === 'card') {
    return (
      <>
        <div className={`bg-white border border-gray-200 rounded-lg p-3 sm:p-4 w-full ${className}`}>
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#73338A] flex-shrink-0" />
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">Select Location</h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {showCurrentLocationOption && (
              <button
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#73338A] text-white rounded-lg hover:bg-[#5a2a6b] transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[44px]"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>Use Current Location</span>
              </button>
            )}

            <button
              onClick={() => setIsMapOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-[#73338A] text-[#73338A] rounded-lg hover:bg-[#73338A] hover:text-white transition-colors text-sm sm:text-base min-h-[44px]"
            >
              <MapPin className="w-4 h-4" />
              <span>Select on Map</span>
            </button>
          </div>
        </div>

        <GoogleMapPicker
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onLocationSelect={handleMapLocationSelect}
          initialLocation={detectedLocation || initialLocation}
        />
      </>
    );
  }

  return (
    <>
      <div className={`flex space-x-2 ${className}`}>
        {showCurrentLocationOption && (
          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center space-x-2 px-3 py-2 bg-[#73338A] text-white rounded-lg hover:bg-[#5a2a6b] transition-colors disabled:opacity-50 text-sm"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>Current Location</span>
          </button>
        )}

        <button
          onClick={() => setIsMapOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 border border-[#73338A] text-[#73338A] rounded-lg hover:bg-[#73338A] hover:text-white transition-colors text-sm"
        >
          <MapPin className="w-4 h-4" />
          <span>Select on Map</span>
        </button>
      </div>

      <GoogleMapPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLocation={detectedLocation || initialLocation}
      />
    </>
  );
};
