import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Loader2, AlertCircle } from 'lucide-react';
import { DEFAULT_MAP_CONFIG, MAP_STYLES, MARKER_CONFIG } from '../../config/maps';
import { LocationCoordinates, formatAddressForDisplay } from '../../utils/location';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';

interface MapViewerProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  address: string;
  title?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  address,
  title = 'Address Location'
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [showInfoWindow, setShowInfoWindow] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);

  const coordinates: LocationCoordinates = { lat: latitude, lng: longitude };

  // Initialize map
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Close info window
  const handleInfoWindowClose = useCallback(() => {
    setShowInfoWindow(false);
  }, []);

  // Reopen info window when marker is clicked
  const handleMarkerClick = useCallback(() => {
    setShowInfoWindow(true);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#73338A]" />
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
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
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={coordinates}
                zoom={16}
                options={{
                  ...DEFAULT_MAP_CONFIG,
                  styles: MAP_STYLES,
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: true,
                  fullscreenControl: true,
                  mapTypeControl: true,
                  gestureHandling: 'greedy',
                }}
                onLoad={onMapLoad}
              >
                <Marker
                  position={coordinates}
                  icon={MARKER_CONFIG.icon}
                  onClick={handleMarkerClick}
                />
                
                {showInfoWindow && (
                  <InfoWindow
                    position={coordinates}
                    onCloseClick={handleInfoWindowClose}
                    options={{
                      pixelOffset: new google.maps.Size(0, -40),
                    }}
                  >
                    <div className="max-w-xs p-2">
                      <h3 className="font-medium text-gray-900 mb-1">Saved Address</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {formatAddressForDisplay(address, 150)}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>

          {/* Footer with Address Info */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-[#73338A] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Address Details</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  {address}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Latitude: {latitude.toFixed(6)}</span>
                  <span>Longitude: {longitude.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Open in Google Maps app/website
                  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                  window.open(url, '_blank');
                }}
                className="px-6 py-2 bg-[#73338A] text-white rounded-lg hover:bg-[#5a2a6b] transition-colors"
              >
                Open in Google Maps
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
