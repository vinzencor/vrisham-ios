import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Plus, Loader2, X, Home, Briefcase, AlertCircle, Check, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Address as FirebaseAddress } from '../../firebase/schema';
import { LocationSelector } from '../maps/LocationSelector';
import { AddressMapPreview } from '../maps/AddressMapPreview';
import { MapViewer } from '../maps/MapViewer';
import { LocationResult, extractPincode } from '../../utils/location';

interface AddressBookProps {
  onBack: () => void;
}

interface Address {
  id: string;
  name: string;
  type: 'home' | 'office';
  address: string;
  phone: string;
  pincode: string;
  isDefault: boolean;
}

export function AddressBook({ onBack }: AddressBookProps) {
  const { userData, updateUser, refreshUserData } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Convert Firebase addresses to our local format
  useEffect(() => {
    const loadAddresses = async () => {
      setLoading(true);
      setError(null);

      try {
        if (userData && userData.listOfAddress && userData.listOfAddress.length > 0) {
          // Map Firebase addresses to our local format
          const mappedAddresses = userData.listOfAddress.map((addr, index) => ({
            id: addr.addressID?.toString() || index.toString(),
            name: addr.addressName || (addr.addressLines.includes('Home') ? 'Home' : 'Office'),
            type: addr.addressLines.toLowerCase().includes('office') ? 'office' as const : 'home' as const,
            address: addr.addressLines || '',
            phone: addr.phoneNumber || userData.phoneNumber || '',
            pincode: addr.pincode?.toString() || '',
            isDefault: index === 0 // First address is default
          }));

          setAddresses(mappedAddresses);
        } else {
          // No addresses found
          setAddresses([]);
        }
      } catch (err) {
        console.error('Error loading addresses:', err);
        setError('Failed to load your addresses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [userData]);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    type: 'home' as 'home' | 'office',
    address: '',
    phone: '',
    pincode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    formattedAddress: undefined as string | undefined,
    placeId: undefined as string | undefined
  });
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [pincodeValid, setPincodeValid] = useState(false);
  const [useMapLocation, setUseMapLocation] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Map viewer state
  const [mapViewerOpen, setMapViewerOpen] = useState(false);
  const [selectedMapAddress, setSelectedMapAddress] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    name: string;
  } | null>(null);

  const validatePhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length === 0) {
      setPhoneError('Phone number is required');
      return false;
    }

    if (cleanPhone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      return false;
    }

    // Check if it starts with a valid digit (6-9 for Indian mobile numbers)
    if (!/^[6-9]/.test(cleanPhone)) {
      setPhoneError('Phone number must start with 6, 7, 8, or 9');
      return false;
    }

    setPhoneError('');
    return true;
  };

  const checkPincodeServiceability = async (pincode: string) => {
    setCheckingPincode(true);
    setPincodeError('');
    setPincodeValid(false);

    try {
      const { validatePincode } = await import('../../firebase/pincodes');
      const validation = await validatePincode(pincode);

      if (validation.isServiceable) {
        setPincodeValid(true);
      } else {
        setPincodeError(validation.error || 'Sorry, we do not deliver to this pincode yet.');
      }
    } catch (error) {
      console.error('Error checking pincode:', error);
      setPincodeError('Failed to validate pincode. Please try again.');
    } finally {
      setCheckingPincode(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    setNewAddress(prev => ({ ...prev, pincode }));

    if (pincode.length === 6) {
      checkPincodeServiceability(pincode);
    } else {
      setPincodeError('');
      setPincodeValid(false);
    }
  };

  const handleMapPreviewClick = (address: Address) => {
    const firebaseAddress = userData?.listOfAddress?.find(addr => addr.addressID?.toString() === address.id);
    if (firebaseAddress?.latitude && firebaseAddress?.longitude) {
      setSelectedMapAddress({
        latitude: firebaseAddress.latitude,
        longitude: firebaseAddress.longitude,
        address: address.address,
        name: address.name
      });
      setMapViewerOpen(true);
    }
  };

  const handleLocationSelect = (location: LocationResult) => {
    const pincode = location.addressComponents ? extractPincode(location.addressComponents) : null;

    setNewAddress(prev => ({
      ...prev,
      address: location.formattedAddress,
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng,
      formattedAddress: location.formattedAddress,
      placeId: location.placeId,
      pincode: pincode || prev.pincode
    }));

    setUseMapLocation(true);

    // Validate pincode if extracted
    if (pincode && pincode.length === 6) {
      checkPincodeServiceability(pincode);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeValid || !userData) return;

    // Validate phone number before submission
    if (!validatePhoneNumber(newAddress.phone)) {
      return;
    }

    try {
      setLoading(true);

      // Create new address in Firebase format
      const firebaseAddress: Partial<FirebaseAddress> = {
        addressID: Date.now(),
        addressName: newAddress.type === 'home' ? 'Home' : 'Office',
        addressLines: newAddress.address,
        phoneNumber: newAddress.phone,
        pincode: parseInt(newAddress.pincode),
        landmark: '',
        branchCode: '',
        branchName: ''
      };

      // Only include location data if available (not undefined)
      if (newAddress.latitude !== undefined) {
        firebaseAddress.latitude = newAddress.latitude;
      }
      if (newAddress.longitude !== undefined) {
        firebaseAddress.longitude = newAddress.longitude;
      }
      if (newAddress.formattedAddress !== undefined) {
        firebaseAddress.formattedAddress = newAddress.formattedAddress;
      }
      if (newAddress.placeId !== undefined) {
        firebaseAddress.placeId = newAddress.placeId;
      }

      // Get current addresses or initialize empty array
      const currentAddresses = userData.listOfAddress || [];

      // Add new address to the list
      const updatedAddresses = [...currentAddresses, firebaseAddress as FirebaseAddress];

      // Update user data in Firebase
      await updateUser({
        listOfAddress: updatedAddresses
      });

      // Refresh user data to get updated addresses
      await refreshUserData();

      // Create local address entry for immediate UI update
      const newAddressEntry: Address = {
        id: firebaseAddress.addressID?.toString() || Date.now().toString(),
        name: newAddress.type === 'home' ? 'Home' : 'Office',
        type: newAddress.type,
        address: newAddress.address,
        phone: newAddress.phone,
        pincode: newAddress.pincode,
        isDefault: addresses.length === 0
      };

      // Update local state
      setAddresses(prev => [...prev, newAddressEntry]);

      // Reset form
      setShowAddAddress(false);
      setNewAddress({
        type: 'home',
        address: '',
        phone: '',
        pincode: '',
        latitude: undefined,
        longitude: undefined,
        formattedAddress: undefined,
        placeId: undefined
      });
      setPincodeValid(false);
      setUseMapLocation(false);
    } catch (err) {
      console.error('Error adding address:', err);
      setError('Failed to save your address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!userData) return;

    try {
      setLoading(true);

      // Find the address to make default
      const addressToMakeDefault = addresses.find(addr => addr.id === id);
      if (!addressToMakeDefault) return;

      // Get current addresses
      const currentAddresses = [...(userData.listOfAddress || [])];

      // Find the address in Firebase format
      const firebaseAddressIndex = currentAddresses.findIndex(
        addr => addr.addressID?.toString() === id
      );

      if (firebaseAddressIndex !== -1) {
        // Reorder addresses to make the selected one first (default)
        const addressToMove = currentAddresses.splice(firebaseAddressIndex, 1)[0];
        currentAddresses.unshift(addressToMove);

        // Update user data in Firebase
        await updateUser({
          listOfAddress: currentAddresses
        });

        // Refresh user data
        await refreshUserData();
      }

      // Update local state immediately for better UX
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })));
    } catch (err) {
      console.error('Error setting default address:', err);
      setError('Failed to set default address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!userData) return;

    try {
      setLoading(true);

      // Get current addresses
      const currentAddresses = [...(userData.listOfAddress || [])];

      // Filter out the address to delete
      const updatedAddresses = currentAddresses.filter(
        addr => addr.addressID?.toString() !== id
      );

      // Update user data in Firebase
      await updateUser({
        listOfAddress: updatedAddresses
      });

      // Refresh user data
      await refreshUserData();

      // Update local state immediately for better UX
      setAddresses(addresses.filter(addr => addr.id !== id));
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Failed to delete address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEditAddress = (address: Address) => {
    const firebaseAddress = userData?.listOfAddress?.find(addr => addr.addressID?.toString() === address.id);

    setEditingAddressId(address.id);
    setNewAddress({
      type: address.type,
      address: address.address,
      phone: address.phone,
      pincode: address.pincode,
      latitude: firebaseAddress?.latitude,
      longitude: firebaseAddress?.longitude,
      formattedAddress: firebaseAddress?.formattedAddress,
      placeId: firebaseAddress?.placeId
    });

    // Reset validation states
    setPincodeValid(true); // Assume current pincode is valid
    setPincodeError('');
    setPhoneError('');
    setUseMapLocation(false);

    setShowEditAddress(true);
  };

  const handleEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeValid || !userData || !editingAddressId) return;

    // Validate phone number before submission
    if (!validatePhoneNumber(newAddress.phone)) {
      return;
    }

    try {
      setLoading(true);

      // Get current addresses
      const currentAddresses = [...(userData.listOfAddress || [])];

      // Find the address to update
      const addressIndex = currentAddresses.findIndex(
        addr => addr.addressID?.toString() === editingAddressId
      );

      if (addressIndex === -1) {
        throw new Error('Address not found');
      }

      // Update the address with new data
      const updatedAddress: Partial<FirebaseAddress> = {
        ...currentAddresses[addressIndex],
        addressName: newAddress.type === 'home' ? 'Home' : 'Office',
        addressLines: newAddress.address,
        phoneNumber: newAddress.phone,
        pincode: parseInt(newAddress.pincode),
      };

      // Only include location data if available (not undefined)
      if (newAddress.latitude !== undefined) {
        updatedAddress.latitude = newAddress.latitude;
      }
      if (newAddress.longitude !== undefined) {
        updatedAddress.longitude = newAddress.longitude;
      }
      if (newAddress.formattedAddress !== undefined) {
        updatedAddress.formattedAddress = newAddress.formattedAddress;
      }
      if (newAddress.placeId !== undefined) {
        updatedAddress.placeId = newAddress.placeId;
      }

      // Update the address in the array
      currentAddresses[addressIndex] = updatedAddress as FirebaseAddress;

      // Update user data in Firebase
      await updateUser({
        listOfAddress: currentAddresses
      });

      // Refresh user data to get updated addresses
      await refreshUserData();

      // Update local state immediately for better UX
      const updatedLocalAddress: Address = {
        id: editingAddressId,
        name: newAddress.type === 'home' ? 'Home' : 'Office',
        type: newAddress.type,
        address: newAddress.address,
        phone: newAddress.phone,
        pincode: newAddress.pincode,
        isDefault: addresses.find(addr => addr.id === editingAddressId)?.isDefault || false
      };

      setAddresses(prev => prev.map(addr =>
        addr.id === editingAddressId ? updatedLocalAddress : addr
      ));

      // Reset form and close modal
      setShowEditAddress(false);
      setEditingAddressId(null);
      setNewAddress({
        type: 'home',
        address: '',
        phone: '',
        pincode: '',
        latitude: undefined,
        longitude: undefined,
        formattedAddress: undefined,
        placeId: undefined
      });
      setPincodeValid(false);
      setUseMapLocation(false);
    } catch (err) {
      console.error('Error updating address:', err);
      setError('Failed to update address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-white z-10">
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onBack();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-2xl font-bold text-gray-800">Delivery Addresses</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 rounded-xl flex items-start gap-3 text-red-700"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              <button
                onClick={() => refreshUserData()}
                className="text-sm underline mt-1"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        )}

        {/* No addresses state */}
        {!loading && !error && addresses.length === 0 && (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No addresses found</h3>
            <p className="text-gray-600 mb-6">You haven't added any delivery addresses yet.</p>
            <button
              onClick={() => setShowAddAddress(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        )}

        {/* Address list */}
        {!loading && addresses.map((address, index) => (
          <motion.div
            key={address.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  {address.type === 'home' ? (
                    <Home className="w-5 h-5 text-primary" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-800">{address.name}</h3>
                    {address.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{address.address}</p>
                  <p className="text-gray-600 text-sm mb-1">{address.pincode}</p>
                  <p className="text-gray-600 text-sm">{address.phone}</p>
                </div>

                {/* Map Preview */}
                {userData?.listOfAddress && userData.listOfAddress.find(addr => addr.addressID?.toString() === address.id)?.latitude && (
                  <div className="flex-shrink-0">
                    <AddressMapPreview
                      latitude={userData.listOfAddress.find(addr => addr.addressID?.toString() === address.id)?.latitude}
                      longitude={userData.listOfAddress.find(addr => addr.addressID?.toString() === address.id)?.longitude}
                      address={address.address}
                      size="small"
                      className="ml-2"
                      isClickable={true}
                      onClick={() => handleMapPreviewClick(address)}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEditAddress(address)}
                  disabled={loading}
                  className="text-gray-400 hover:text-primary transition-colors p-2 disabled:opacity-50"
                  title="Edit address"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteAddress(address.id)}
                  disabled={loading}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 disabled:opacity-50"
                  title="Delete address"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!address.isDefault && (
              <button
                onClick={() => setDefaultAddress(address.id)}
                disabled={loading}
                className="mt-4 w-full py-2 border-2 border-primary text-primary rounded-xl font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Setting as Default...
                  </span>
                ) : (
                  'Set as Default'
                )}
              </button>
            )}
          </motion.div>
        ))}

        {/* Add address button */}
        {!loading && addresses.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowAddAddress(true)}
            disabled={loading}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add New Address
          </motion.button>
        )}
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pb-24"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800">Add New Address</h3>
                <button
                  onClick={() => setShowAddAddress(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-address-form" onSubmit={handleAddAddress} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewAddress(prev => ({ ...prev, type: 'home' }))}
                        className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                          newAddress.type === 'home'
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAddress(prev => ({ ...prev, type: 'office' }))}
                        className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                          newAddress.type === 'office'
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Briefcase className="w-5 h-5" />
                        Office
                      </button>
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Location
                    </label>
                    <LocationSelector
                      onLocationSelect={handleLocationSelect}
                      variant="card"
                      className="mb-4"
                    />
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Address {useMapLocation && <span className="text-xs text-green-600">(From Map)</span>}
                  </label>
                  <textarea
                    value={newAddress.address}
                    onChange={(e) => {
                      setNewAddress(prev => ({ ...prev, address: e.target.value }));
                      setUseMapLocation(false);
                    }}
                    rows={3}
                    placeholder="Enter your full address or select from map above"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newAddress.pincode}
                      onChange={handlePincodeChange}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                        pincodeValid
                          ? 'border-green-500 focus:ring-green-200'
                          : pincodeError
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-primary/20'
                      }`}
                      required
                    />
                    {checkingPincode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  {pincodeError && (
                    <div className="mt-2 flex items-center gap-1.5 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{pincodeError}</span>
                    </div>
                  )}
                  {pincodeValid && (
                    <div className="mt-2 flex items-center gap-1.5 text-green-500 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Delivery available in your area!</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits and limit to 10 characters
                      const cleanValue = value.replace(/\D/g, '').slice(0, 10);
                      setNewAddress(prev => ({ ...prev, phone: cleanValue }));

                      // Validate on change
                      if (cleanValue.length > 0) {
                        validatePhoneNumber(cleanValue);
                      } else {
                        setPhoneError('');
                      }
                    }}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                      phoneError
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-primary/20'
                    }`}
                    required
                  />
                  {phoneError && (
                    <div className="mt-2 flex items-center gap-1.5 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                  {newAddress.phone.length === 10 && !phoneError && (
                    <div className="mt-2 flex items-center gap-1.5 text-green-500 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Valid phone number</span>
                    </div>
                  )}
                </div>

                </form>
              </div>

              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-address-form"
                    disabled={!pincodeValid || loading}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </span>
                    ) : (
                      'Add Address'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Address Modal */}
      <AnimatePresence>
        {showEditAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pb-24"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800">Edit Address</h3>
                <button
                  onClick={() => {
                    setShowEditAddress(false);
                    setEditingAddressId(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="edit-address-form" onSubmit={handleEditAddress} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewAddress(prev => ({ ...prev, type: 'home' }))}
                        className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                          newAddress.type === 'home'
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAddress(prev => ({ ...prev, type: 'office' }))}
                        className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                          newAddress.type === 'office'
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Briefcase className="w-5 h-5" />
                        Office
                      </button>
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Update Location (Optional)
                    </label>
                    <LocationSelector
                      onLocationSelect={handleLocationSelect}
                      variant="card"
                      className="mb-4"
                    />
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Address {useMapLocation && <span className="text-xs text-green-600">(Updated from Map)</span>}
                  </label>
                  <textarea
                    value={newAddress.address}
                    onChange={(e) => {
                      setNewAddress(prev => ({ ...prev, address: e.target.value }));
                      setUseMapLocation(false);
                    }}
                    rows={3}
                    placeholder="Enter your full address or select from map above"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newAddress.pincode}
                      onChange={handlePincodeChange}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                        pincodeValid
                          ? 'border-green-500 focus:ring-green-200'
                          : pincodeError
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-primary/20'
                      }`}
                      required
                    />
                    {checkingPincode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  {pincodeError && (
                    <div className="mt-2 flex items-center gap-1.5 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{pincodeError}</span>
                    </div>
                  )}
                  {pincodeValid && (
                    <div className="mt-2 flex items-center gap-1.5 text-green-500 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Delivery available in your area!</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits and limit to 10 characters
                      const cleanValue = value.replace(/\D/g, '').slice(0, 10);
                      setNewAddress(prev => ({ ...prev, phone: cleanValue }));

                      // Validate on change
                      if (cleanValue.length > 0) {
                        validatePhoneNumber(cleanValue);
                      } else {
                        setPhoneError('');
                      }
                    }}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${
                      phoneError
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-primary/20'
                    }`}
                    required
                  />
                  {phoneError && (
                    <div className="mt-2 flex items-center gap-1.5 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                  {newAddress.phone.length === 10 && !phoneError && (
                    <div className="mt-2 flex items-center gap-1.5 text-green-500 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Valid phone number</span>
                    </div>
                  )}
                </div>

                </form>
              </div>

              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditAddress(false);
                      setEditingAddressId(null);
                    }}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-address-form"
                    disabled={!pincodeValid || loading}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Updating...
                      </span>
                    ) : (
                      'Update Address'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Viewer Modal */}
      {selectedMapAddress && (
        <MapViewer
          isOpen={mapViewerOpen}
          onClose={() => {
            setMapViewerOpen(false);
            setSelectedMapAddress(null);
          }}
          latitude={selectedMapAddress.latitude}
          longitude={selectedMapAddress.longitude}
          address={selectedMapAddress.address}
          title={`${selectedMapAddress.name} Location`}
        />
      )}
    </div>
  );
}