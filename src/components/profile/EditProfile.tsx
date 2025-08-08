import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, MapPin, Loader2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface EditProfileProps {
  onBack: () => void;
}

export function EditProfile({ onBack }: EditProfileProps) {
  const { userData, updateUser, getUserPhoneNumber } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    address: '',
    pincode: ''
  });

  // Load user data when component mounts
  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        phoneNumber: getUserPhoneNumber() || '',
        address: userData.listOfAddress && userData.listOfAddress.length > 0
          ? userData.listOfAddress[0].addressLines || ''
          : '',
        pincode: userData.listOfAddress && userData.listOfAddress.length > 0
          ? userData.listOfAddress[0].pincode?.toString() || ''
          : ''
      });
    } else {
      // Set default values if userData is null
      setFormData({
        displayName: '',
        phoneNumber: '',
        address: '',
        pincode: ''
      });

      // Show error
      setError('User data not available. Please try again later.');
    }
  }, [userData, getUserPhoneNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.displayName.trim()) {
        throw new Error('Please enter your name');
      }

      if (!formData.address.trim()) {
        throw new Error('Please enter your address');
      }

      if (!formData.pincode || formData.pincode.length !== 6) {
        throw new Error('Please enter a valid 6-digit pincode');
      }

      // Prepare update data
      const updateData: any = {
        displayName: formData.displayName,
        phone_number: formData.phoneNumber, // Keep the phone number in the user document
      };

      // Update address if it exists
      if (userData?.listOfAddress && userData.listOfAddress.length > 0) {
        const updatedAddresses = [...userData.listOfAddress];
        updatedAddresses[0] = {
          ...updatedAddresses[0],
          addressLines: formData.address,
          pincode: parseInt(formData.pincode),
          phoneNumber: formData.phoneNumber // Also update in address for consistency
        };
        updateData.listOfAddress = updatedAddresses;
      } else {
        // Create new address if none exists
        updateData.listOfAddress = [{
          addressID: 1,
          addressName: 'Home',
          addressLines: formData.address,
          landmark: '',
          pincode: parseInt(formData.pincode),
          phoneNumber: formData.phoneNumber,
          branchCode: '',
          branchName: ''
        }];
      }

      console.log('Updating user profile with:', updateData);
      await updateUser(updateData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || 'Failed to update profile');
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
          <h1 className="font-display text-2xl font-bold text-gray-800">Edit Profile</h1>
        </div>
      </div>

      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                  placeholder="Your phone number"
                />
                <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Your delivery address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="6-digit pincode"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium mt-4 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating Profile...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}