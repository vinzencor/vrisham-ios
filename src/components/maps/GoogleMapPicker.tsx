import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Crosshair,
  Loader2,
  AlertCircle,
  Check,
  X,
  Navigation,
  Search
} from 'lucide-react';
import { DEFAULT_MAP_CONFIG, MAP_STYLES, MARKER_CONFIG } from '../../config/maps';
import {
  getCurrentLocation,
  reverseGeocode,
  LocationCoordinates,
  LocationResult,
  extractPincode,
  formatAddressForDisplay,
  searchPlaces,
  getPlaceDetails
} from '../../utils/location';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';

interface GoogleMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationResult) => void;
  initialLocation?: LocationCoordinates;
  title?: string;
}

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
  title = 'Select Location'
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [mapCenter, setMapCenter] = useState<LocationCoordinates | null>(
    initialLocation || null
  );
  const [markerPosition, setMarkerPosition] = useState<LocationCoordinates | null>(
    initialLocation || null
  );
  const [hasTriedCurrentLocation, setHasTriedCurrentLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(!initialLocation);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(initialLocation ? 16 : 2);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Search functionality state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
const MARKER_ICON_SVG = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'; // Example URL

  // Handle reverse geocoding - no restrictions
  const handleReverseGeocode = useCallback(async (coordinates: LocationCoordinates) => {
    if (!geocoderRef.current) {
      console.log('Geocoder not available for reverse geocoding');
      return;
    }

    console.log('Starting reverse geocoding for:', coordinates);
    setIsLoadingAddress(true);
    setError(null);

    try {
      const result = await reverseGeocode(coordinates, geocoderRef.current);
      console.log('Reverse geocoding result:', result);
      setSelectedAddress(result.formattedAddress);
      console.log('Address set successfully:', result.formattedAddress);
    } catch (err: any) {
      console.error('Reverse geocoding error:', err);
      setError(err.message || 'Unable to get address for this location');
      setSelectedAddress('');
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // Try to get current location immediately when component opens
  useEffect(() => {
    if (isOpen && !initialLocation && !hasTriedCurrentLocation) {
      console.log('Component opened, attempting to get current location immediately...');
      setHasTriedCurrentLocation(true);
      setIsGettingLocation(true);

      getCurrentLocation()
        .then((coordinates) => {
          console.log('Current location detected on open:', coordinates);
          setMapCenter(coordinates);
          setMarkerPosition(coordinates);
          setCurrentZoom(16);
          setIsGettingLocation(false);
        })
        .catch((error) => {
          console.log('Could not get current location on open:', error);
          setError('Unable to get your current location. Please search for a location or click on the map.');
          setIsGettingLocation(false);
        });
    }
  }, [isOpen, initialLocation, hasTriedCurrentLocation]);

  // Update map center and marker when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setMapCenter(initialLocation);
      setMarkerPosition(initialLocation);

      // If map is already loaded, pan to new location
      if (mapRef.current) {
        mapRef.current.panTo(initialLocation);
        mapRef.current.setZoom(16);
      }
    }
  }, [initialLocation]);

  // Auto-detect current location when map loads if we haven't tried yet
  useEffect(() => {
    if (!initialLocation && isLoaded && isMapLoaded && !hasTriedCurrentLocation) {
      console.log('Map loaded, attempting to get current location...');
      setHasTriedCurrentLocation(true);
      setIsGettingLocation(true);

      getCurrentLocation()
        .then((coordinates) => {
          console.log('Current location detected after map load:', coordinates);
          setMapCenter(coordinates);
          setMarkerPosition(coordinates);
          setCurrentZoom(16);

          // Update map position if available
          if (mapRef.current) {
            mapRef.current.panTo(coordinates);
            mapRef.current.setZoom(16);
          }

          // Get address for detected location
          if (geocoderRef.current) {
            handleReverseGeocode(coordinates);
          }
          setIsGettingLocation(false);
        })
        .catch((error) => {
          console.log('Could not get current location after map load:', error);
          setError('Unable to get your current location. Please search for a location or click on the map.');
          setIsGettingLocation(false);
        });
    } else if (initialLocation && isLoaded && isMapLoaded && geocoderRef.current) {
      // If initial location is provided, get its address
      console.log('Using provided initial location:', initialLocation);
      handleReverseGeocode(initialLocation);
    }
  }, [initialLocation, isLoaded, isMapLoaded, hasTriedCurrentLocation, handleReverseGeocode]);

  // Initialize geocoder and places service when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    placesServiceRef.current = new google.maps.places.PlacesService(map);
    setIsMapLoaded(true);

    // Add zoom change listener to track current zoom level
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      if (zoom !== undefined) {
        setCurrentZoom(zoom);
        console.log('Zoom changed to:', zoom);
      }
    });

    console.log('Map loaded successfully');
  }, []);



  // Handle marker drag with improved synchronization
  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      console.log('Marker dragged to coordinates:', newPosition);

      // Clear any existing errors
      setError(null);

      // Update both marker and map center for consistency
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);

      // Clear search query when manually dragging marker
      setSearchQuery('');
      setShowSearchResults(false);

      // Get address for the new position
      handleReverseGeocode(newPosition);
    }
  }, [handleReverseGeocode]);

  // Handle map click with improved synchronization
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      console.log('Map clicked at coordinates:', newPosition);

      // Clear any existing errors
      setError(null);

      // Update both marker and map center immediately for consistency
      setMarkerPosition(newPosition);
      setMapCenter(newPosition);

      // Clear search query when manually selecting a location
      setSearchQuery('');
      setShowSearchResults(false);

      // Get address for the clicked location
      handleReverseGeocode(newPosition);
    }
  }, [handleReverseGeocode]);

  // Get current location
  const handleGetCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setError(null);

    try {
      const coordinates = await getCurrentLocation();
      setMapCenter(coordinates);
      setMarkerPosition(coordinates);

      if (mapRef.current) {
        mapRef.current.panTo(coordinates);
        mapRef.current.setZoom(16);
        setCurrentZoom(16); // Update zoom state
      }

      handleReverseGeocode(coordinates);
    } catch (err: any) {
      setError(err.message || 'Unable to get your current location');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [handleReverseGeocode]);

  // Search for places with improved reliability
  const handleSearch = useCallback(async (query: string) => {
    if (!placesServiceRef.current || !mapRef.current) {
      console.log('Search failed: missing placesService or mapRef');
      return;
    }

    console.log('Searching for:', query);
    setIsSearching(true);
    setError(null);

    try {
      // Use current map bounds only if we're zoomed in enough, otherwise use null for global search
      const currentZoom = mapRef.current.getZoom() || 5;
      const bounds = currentZoom > 10 ? mapRef.current.getBounds() : undefined;
      console.log('Search bounds:', bounds ? 'Using current map bounds' : 'Using global search', 'Zoom:', currentZoom);

      const results = await searchPlaces(query, placesServiceRef.current, bounds);
      console.log('Search results received:', results.length);

      if (results.length > 0) {
        setSearchResults(results);
        setShowSearchResults(true);
        console.log('Search successful, showing results');
      } else {
        console.log('No results found for query:', query);
        setSearchResults([]);
        setShowSearchResults(false);
        setError(`No places found for "${query}"`);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed. Please try again.');
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input with debouncing for better performance
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous results immediately when typing
    if (query.length <= 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setError(null);
      return;
    }

    // Clear any existing errors when starting new search
    setError(null);
  }, []);

  // Separate effect for debounced search to fix the timeout issue
  useEffect(() => {
    if (searchQuery.length <= 2) {
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log('Triggering search for:', searchQuery);
      handleSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  // Handle place selection from search results - SIMPLIFIED AND FIXED
  const handlePlaceSelect = useCallback(async (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) {
      console.error('Place has no geometry or location:', place);
      setError('Selected place has no valid location');
      return;
    }

    const coordinates = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    console.log('Place selected:', {
      name: place.name,
      formatted_address: place.formatted_address,
      coordinates
    });

    // Clear any existing errors
    setError(null);

    // Update search query and close dropdown immediately
    setSearchQuery(place.formatted_address || place.name || '');
    setShowSearchResults(false);

    // Set address immediately if available
    if (place.formatted_address) {
      setSelectedAddress(place.formatted_address);
    }

    // Update state immediately
    setMapCenter(coordinates);
    setMarkerPosition(coordinates);
    setCurrentZoom(16);

    // Navigate map to the selected location
    if (mapRef.current) {
      console.log('Navigating map to coordinates:', coordinates);

      // Use panTo for smooth animation to the new location
      mapRef.current.panTo(coordinates);
      mapRef.current.setZoom(16);

      // Update our zoom state to match
      setCurrentZoom(16);
    }

    // Perform reverse geocoding if we don't have a formatted address
    if (!place.formatted_address && geocoderRef.current) {
      console.log('No formatted address, performing reverse geocoding');
      handleReverseGeocode(coordinates);
    }
  }, [handleReverseGeocode]);

  // Confirm location selection
  const handleConfirmLocation = useCallback(async () => {
    if (!selectedAddress || !markerPosition) {
      setError('Please select a location first');
      return;
    }

    console.log('Confirming location:', {
      markerPosition,
      selectedAddress,
      mapCenter
    });

    try {
      // Create the location result object directly from current state
      const result = {
        coordinates: markerPosition,
        formattedAddress: selectedAddress,
        placeId: '', // We don't always have a place ID
        addressComponents: [] // We don't need address components for basic functionality
      };

      console.log('Sending location result to parent:', result);
      onLocationSelect(result);
      onClose();
    } catch (err: any) {
      console.error('Error confirming location:', err);
      setError(err.message || 'Unable to confirm this location');
    }
  }, [selectedAddress, markerPosition, mapCenter, onLocationSelect, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#73338A]" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search for places..."
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#73338A] focus:border-transparent text-sm sm:text-base"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#73338A] animate-spin" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map((place, index) => (
                    <button
                      key={`${place.place_id || index}`}
                      onClick={() => handlePlaceSelect(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{place.name}</div>
                      <div className="text-sm text-gray-600">{place.formatted_address}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results Message */}
              {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.length > 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500">
                  No places found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            {loadError ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600">Failed to load Google Maps</p>
                  <p className="text-sm text-gray-500 mt-1">Please check your internet connection</p>
                </div>
              </div>
            ) : !isLoaded ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-[#73338A] animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading Google Maps...</p>
                </div>
              </div>
            ) : isGettingLocation || !mapCenter ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-[#73338A] animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Getting your location...</p>
                  <p className="text-sm text-gray-500 mt-1">Please allow location access when prompted</p>
                </div>
              </div>
            ) : (
              <GoogleMap
                key={mapCenter ? `${mapCenter.lat}-${mapCenter.lng}` : 'no-center'}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={currentZoom} // Use tracked zoom level
                options={{
                  ...DEFAULT_MAP_CONFIG,
                  styles: MAP_STYLES,
                  clickableIcons: true,
                  gestureHandling: 'greedy', // Allow all gestures
                  keyboardShortcuts: true,
                  scrollwheel: true,
                  disableDoubleClickZoom: false,
                }}
                onLoad={onMapLoad}
                onClick={onMapClick}
              >
                {markerPosition && (
                  <Marker
                    position={markerPosition}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                    icon={{
                      url: MARKER_ICON_SVG,
                      scaledSize: new google.maps.Size(32, 32),
                      anchor: new google.maps.Point(16, 32),
                    }}
                    animation={google.maps.Animation.BOUNCE}
                    clickable={true}
                  />
                )}
              </GoogleMap>
            )}

            {/* Current Location Button */}
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLoadingLocation}
              className="absolute top-4 right-4 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isLoadingLocation ? (
                <Loader2 className="w-5 h-5 text-[#73338A] animate-spin" />
              ) : (
                <Navigation className="w-5 h-5 text-[#73338A]" />
              )}
            </button>

            {/* Center Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Crosshair className="w-8 h-8 text-[#73338A] opacity-50" />
            </div>
          </div>

          {/* Address Display & Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Address
              </label>
              <div className="bg-white border border-gray-300 rounded-lg p-3 min-h-[60px] flex items-center">
                {isLoadingAddress ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-[#73338A] animate-spin" />
                    <span className="text-gray-500">Getting address...</span>
                  </div>
                ) : selectedAddress ? (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-[#73338A] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-900 text-sm leading-relaxed">
                      {formatAddressForDisplay(selectedAddress, 200)}
                    </span>
                  </div>
                ) : error ? (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Click on the map or drag the marker to select a location
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocation}
                disabled={!selectedAddress || isLoadingAddress}
                className="flex-1 px-4 py-2 bg-[#73338A] text-white rounded-lg hover:bg-[#5a2a6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Location</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
