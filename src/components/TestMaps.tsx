import React, { useState } from 'react';
import { LocationSelector } from './maps/LocationSelector';
import { AddressMapPreview } from './maps/AddressMapPreview';
import { LocationResult } from '../utils/location';

export function TestMaps() {
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [testLocations] = useState([
    { lat: 28.6139, lng: 77.2090, address: "New Delhi, India" },
    { lat: 19.0760, lng: 72.8777, address: "Mumbai, India" },
    { lat: 13.0827, lng: 80.2707, address: "Chennai, India" },
  ]);

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Google Maps Integration Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Location Selector (Card Variant)</h2>
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              variant="card"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Location Selector (Button Variant)</h2>
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              variant="button"
            />
          </div>
        </div>

        {selectedLocation && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Selected Location Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p><strong>Address:</strong> {selectedLocation.formattedAddress}</p>
                <p><strong>Coordinates:</strong> {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}</p>
                {selectedLocation.placeId && (
                  <p><strong>Place ID:</strong> {selectedLocation.placeId}</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Map Preview</h3>
                <AddressMapPreview
                  latitude={selectedLocation.coordinates.lat}
                  longitude={selectedLocation.coordinates.lng}
                  address={selectedLocation.formattedAddress}
                  size="medium"
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Address Map Previews (Test Locations)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testLocations.map((location, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">{location.address}</h3>
                <AddressMapPreview
                  latitude={location.lat}
                  longitude={location.lng}
                  address={location.address}
                  size="small"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">Test Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Test "Use Current Location" - should detect GPS and show real address</li>
            <li>2. Test "Select on Map" - should open map picker and allow location selection</li>
            <li>3. Verify map centers on detected GPS location when opened</li>
            <li>4. Test repeated opening/closing of map picker</li>
            <li>5. Verify address previews show correctly for saved locations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
