# Google Maps Integration

This document describes the Google Maps location selection functionality implemented in the customer app.

## Overview

The Google Maps integration allows customers to:
- Select their current location automatically with proper reverse geocoding
- Pick any location on an interactive map with real-time address updates
- Get reverse geocoded addresses from coordinates using Google's Geocoding API
- Save location data with coordinates to Firebase
- View small map previews of saved addresses
- Seamless integration with existing address management

## Recent Fixes (Critical Issues Resolved)

### ✅ Issue 1: GPS Location Detection & Map Centering
- **Fixed**: GPS coordinates now properly update map view and center position
- **Fixed**: Map automatically pans to detected location with zoom level 16
- **Fixed**: Marker position updates correctly when GPS location is detected

### ✅ Issue 2: Reverse Geocoding for GPS Detection
- **Fixed**: GPS detection now performs proper reverse geocoding using Google's API
- **Fixed**: Real formatted addresses replace placeholder "Current Location" text
- **Fixed**: Proper error handling for geocoding failures

### ✅ Issue 3: Address Map Previews
- **Added**: Small map thumbnails (150x100px) for saved addresses with coordinates
- **Added**: AddressMapPreview component integrated into AddressBook and Checkout
- **Added**: Graceful handling when coordinates are not available

### ✅ Issue 4: LoadScript Conflicts
- **Fixed**: Moved Google Maps API loading to app-level GoogleMapsProvider
- **Fixed**: Eliminated "google api is already presented" errors
- **Fixed**: Proper loading states and error handling throughout the app

## Components

### 1. GoogleMapPicker
Main component for interactive map selection.

**Location**: `src/components/maps/GoogleMapPicker.tsx`

**Features**:
- Interactive Google Maps with marker
- Drag marker to select location
- Click map to place marker
- Current location detection
- Reverse geocoding for addresses
- Responsive modal interface

### 2. LocationSelector
Simplified component with buttons for location selection.

**Location**: `src/components/maps/LocationSelector.tsx`

**Features**:
- "Use Current Location" button with proper reverse geocoding
- "Select on Map" button
- Card and button variants
- Opens GoogleMapPicker when needed
- Passes detected GPS coordinates to map picker

### 3. AddressMapPreview
Small map thumbnail component for displaying saved address locations.

**Location**: `src/components/maps/AddressMapPreview.tsx`

**Features**:
- Small (150x100px) and medium (200x150px) size options
- Static map display with marker at coordinates
- Graceful fallback when coordinates are unavailable
- Integrated into address lists in AddressBook and Checkout
- Optimized for performance with disabled interactions
- **NEW**: Interactive clickable overlay to open full-screen map view
- **NEW**: Hover effects and visual feedback for clickable maps

### 4. MapViewer
Full-screen interactive map viewer for saved addresses.

**Location**: `src/components/maps/MapViewer.tsx`

**Features**:
- Full-screen modal with interactive Google Map
- Read-only view (no editing capabilities)
- InfoWindow popup showing address details
- Zoom, street view, and map type controls enabled
- "Open in Google Maps" button for external navigation
- Responsive design with proper loading states

### 5. GoogleMapsProvider
Context provider for managing Google Maps API loading.

**Location**: `src/contexts/GoogleMapsContext.tsx`

**Features**:
- App-level Google Maps API initialization
- Prevents LoadScript conflicts
- Centralized loading state management
- Error handling for API loading failures

## Configuration

### Environment Variables
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyA6DZgq0n6pQ7UAtbQiuD6o1TJTx4b947s
```

### Maps Configuration
**Location**: `src/config/maps.ts`

Contains:
- API key configuration
- Default map settings (center, zoom)
- Geolocation options
- Map styles
- Marker configuration

## Utilities

### Location Utilities
**Location**: `src/utils/location.ts`

**Functions**:
- `getCurrentLocation()` - Get user's current location
- `reverseGeocode()` - Convert coordinates to address
- `extractPincode()` - Extract pincode from address components
- `checkLocationPermission()` - Check location permissions
- `requestLocationPermission()` - Request location access

## Database Schema

The Address interface has been extended to include location data:

```typescript
interface Address {
  // Existing fields...
  addressID: number;
  addressLines: string;
  addressName: string;
  // ... other fields

  // New location fields (optional for backward compatibility)
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
}
```

## Integration Points

### 1. Profile Page - AddressBook
**Location**: `src/components/profile/AddressBook.tsx`

- Added LocationSelector in the "Add Address" form
- Automatically fills address field when location is selected
- Extracts and validates pincode from selected location

### 2. Checkout Page
**Location**: `src/components/Checkout.tsx`

- Added LocationSelector in the "Add Address" modal
- Same functionality as profile page
- Integrates with existing address validation

## Usage

### Basic Usage
```tsx
import { LocationSelector } from './maps/LocationSelector';

function MyComponent() {
  const handleLocationSelect = (location: LocationResult) => {
    console.log('Selected:', location);
    // Use location.coordinates, location.formattedAddress, etc.
  };

  return (
    <LocationSelector
      onLocationSelect={handleLocationSelect}
      variant="card" // or "button"
      showCurrentLocationOption={true}
    />
  );
}
```

### Advanced Usage with GoogleMapPicker
```tsx
import { GoogleMapPicker } from './maps/GoogleMapPicker';

function MyComponent() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleLocationSelect = (location: LocationResult) => {
    // Handle location selection
    setIsMapOpen(false);
  };

  return (
    <GoogleMapPicker
      isOpen={isMapOpen}
      onClose={() => setIsMapOpen(false)}
      onLocationSelect={handleLocationSelect}
      initialLocation={{ lat: 28.6139, lng: 77.2090 }}
      title="Select Delivery Location"
    />
  );
}
```

### Interactive Map Preview Usage
```tsx
import { AddressMapPreview } from './maps/AddressMapPreview';
import { MapViewer } from './maps/MapViewer';

function AddressList() {
  const [mapViewerOpen, setMapViewerOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const handleMapPreviewClick = (address) => {
    setSelectedAddress(address);
    setMapViewerOpen(true);
  };

  return (
    <>
      {/* Clickable map preview */}
      <AddressMapPreview
        latitude={address.latitude}
        longitude={address.longitude}
        address={address.formattedAddress}
        size="small"
        isClickable={true}
        onClick={() => handleMapPreviewClick(address)}
      />

      {/* Full-screen map viewer */}
      {selectedAddress && (
        <MapViewer
          isOpen={mapViewerOpen}
          onClose={() => setMapViewerOpen(false)}
          latitude={selectedAddress.latitude}
          longitude={selectedAddress.longitude}
          address={selectedAddress.address}
          title="Address Location"
        />
      )}
    </>
  );
}
```

## Permissions

The app handles location permissions gracefully:
- Requests permission when "Use Current Location" is clicked
- Falls back to map selection if permission is denied
- Shows appropriate error messages for permission issues

## Error Handling

- Network errors during geocoding
- Location permission denied
- GPS unavailable
- Invalid coordinates
- API key issues

All errors are handled with user-friendly messages and fallback options.

## Testing

A test component is available at `src/components/TestMaps.tsx` for testing the Google Maps integration during development.

## Dependencies

- `@react-google-maps/api` - React wrapper for Google Maps
- `@googlemaps/js-api-loader` - Google Maps JavaScript API loader

## API Key Setup

The Google Maps API key is configured for:
- Maps JavaScript API
- Places API
- Geocoding API

Make sure these APIs are enabled in your Google Cloud Console project.
