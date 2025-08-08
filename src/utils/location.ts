import { GEOLOCATION_OPTIONS } from '../config/maps';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationResult {
  coordinates: LocationCoordinates;
  formattedAddress: string;
  placeId?: string;
  addressComponents?: google.maps.GeocoderAddressComponent[];
}

export interface LocationError {
  code: number;
  message: string;
}

/**
 * Get current user location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject({
          code: error.code,
          message,
        });
      },
      GEOLOCATION_OPTIONS
    );
  });
};

/**
 * Reverse geocode coordinates to get formatted address
 */
export const reverseGeocode = (
  coordinates: LocationCoordinates,
  geocoder: google.maps.Geocoder
): Promise<LocationResult> => {
  return new Promise((resolve, reject) => {
    geocoder.geocode(
      { location: coordinates },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve({
            coordinates,
            formattedAddress: results[0].formatted_address,
            placeId: results[0].place_id,
            addressComponents: results[0].address_components,
          });
        } else {
          reject({
            code: 1,
            message: 'Unable to get address for this location.',
          });
        }
      }
    );
  });
};

/**
 * Extract pincode from address components
 */
export const extractPincode = (
  addressComponents: google.maps.GeocoderAddressComponent[]
): string | null => {
  const postalCodeComponent = addressComponents.find(
    (component) => component.types.includes('postal_code')
  );
  return postalCodeComponent ? postalCodeComponent.long_name : null;
};

/**
 * Extract city from address components
 */
export const extractCity = (
  addressComponents: google.maps.GeocoderAddressComponent[]
): string | null => {
  const cityComponent = addressComponents.find(
    (component) => 
      component.types.includes('locality') || 
      component.types.includes('administrative_area_level_2')
  );
  return cityComponent ? cityComponent.long_name : null;
};

/**
 * Extract state from address components
 */
export const extractState = (
  addressComponents: google.maps.GeocoderAddressComponent[]
): string | null => {
  const stateComponent = addressComponents.find(
    (component) => component.types.includes('administrative_area_level_1')
  );
  return stateComponent ? stateComponent.long_name : null;
};

/**
 * Format address for display
 */
export const formatAddressForDisplay = (
  formattedAddress: string,
  maxLength: number = 100
): string => {
  if (formattedAddress.length <= maxLength) {
    return formattedAddress;
  }
  return formattedAddress.substring(0, maxLength - 3) + '...';
};

/**
 * Check if location permissions are granted
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  if (!navigator.permissions) {
    return false;
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state === 'granted';
  } catch (error) {
    console.warn('Unable to check location permission:', error);
    return false;
  }
};

/**
 * Search for places using Google Places API - worldwide search
 */
export const searchPlaces = (
  query: string,
  placesService: google.maps.places.PlacesService,
  bounds?: google.maps.LatLngBounds
): Promise<google.maps.places.PlaceResult[]> => {
  return new Promise((resolve, reject) => {
    const request: google.maps.places.TextSearchRequest = {
      query: query, // Use query as-is without any country bias
      bounds: bounds, // Use provided bounds if any
      // No region bias - allow worldwide search
    };

    console.log('Searching places with request:', request);

    placesService.textSearch(request, (results, status) => {
      console.log('Places search status:', status, 'Results:', results);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Filter to ensure we have valid coordinates
        const filteredResults = results.filter(result => {
          return result.geometry?.location; // Only keep results with valid coordinates
        });

        console.log('Filtered results:', filteredResults.length, 'from', results.length);

        // Sort results by relevance (prioritize exact matches)
        const sortedResults = filteredResults.sort((a, b) => {
          const aName = a.name?.toLowerCase() || '';
          const bName = b.name?.toLowerCase() || '';
          const queryLower = query.toLowerCase();

          // Exact name matches first
          const aExactMatch = aName === queryLower || aName.startsWith(queryLower);
          const bExactMatch = bName === queryLower || bName.startsWith(queryLower);

          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;

          // Then partial name matches
          const aNameMatch = aName.includes(queryLower);
          const bNameMatch = bName.includes(queryLower);

          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;

          // Keep Google's original ranking for the rest
          return 0;
        });

        resolve(sortedResults.length > 0 ? sortedResults : results.slice(0, 8));
      } else {
        reject({
          code: 2,
          message: 'No places found for this search.',
        });
      }
    });
  });
};

/**
 * Get detailed information about a place
 */
export const getPlaceDetails = (
  placeId: string,
  placesService: google.maps.places.PlacesService
): Promise<google.maps.places.PlaceResult> => {
  return new Promise((resolve, reject) => {
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
      fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components'],
    };

    placesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        resolve(place);
      } else {
        reject({
          code: 3,
          message: 'Unable to get place details.',
        });
      }
    });
  });
};

/**
 * Request location permission
 */
export const requestLocationPermission = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { ...GEOLOCATION_OPTIONS, timeout: 5000 }
    );
  });
};
