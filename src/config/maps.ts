// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA6DZgq0n6pQ7UAtbQiuD6o1TJTx4b947s',
  libraries: ['places', 'geometry'] as const,
  region: 'IN', // India
  language: 'en',
};

// Default map settings - No restrictions, worldwide access
export const DEFAULT_MAP_CONFIG = {
  zoom: 6, // Default zoom level
  mapTypeId: 'roadmap' as const,
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
};

// Fallback locations for different regions
export const FALLBACK_LOCATIONS = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
};

// Location permission settings
export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes
};

// Map styles for better UI
export const MAP_STYLES = [
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
];

// Marker configuration
export const MARKER_CONFIG = {
  draggable: true,
  animation: 2, // DROP animation
  icon: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#73338A"/>
      </svg>
    `),
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 32 },
  },
};
