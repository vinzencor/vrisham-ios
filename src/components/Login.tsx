import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, MapPin, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import OtpInput from 'react-otp-input';
import { sendOTP, verifyOTPAndAuthenticate } from '../firebase/customTokenAuth';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../firebase/schema';
import { LocationSelector } from './maps/LocationSelector';
import { LocationResult, extractPincode } from '../utils/location';

// Step enum to track the login flow
enum LoginStep {
  PHONE_INPUT,
  OTP_VERIFICATION,
  NEW_USER_DETAILS
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, createUserProfile, userData, currentUser } = useAuth();
  const [loginStep, setLoginStep] = useState<LoginStep>(LoginStep.PHONE_INPUT);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [addressName, setAddressName] = useState('Home');
  const [addressLines, setAddressLines] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [formattedAddress, setFormattedAddress] = useState<string | undefined>(undefined);
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [useMapLocation, setUseMapLocation] = useState(false);

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showReactivationMessage, setShowReactivationMessage] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);

  // Redirect if already authenticated AND has user data (existing users only)
  useEffect(() => {
    console.log('=== LOGIN: Checking authentication state ===', {
      isAuthenticated,
      isLoading,
      hasUserData: !!userData,
      currentUserUID: currentUser?.uid,
      currentUserPhone: currentUser?.phoneNumber
    });

    // Only redirect if user is authenticated AND has user data (existing users)
    // New users will be authenticated but won't have userData yet
    if (isAuthenticated && !isLoading && userData) {
      // Get the redirect path from location state
      const redirectTo = location.state?.redirectTo || location.state?.from?.pathname || '/';
      console.log('=== LOGIN: User already authenticated, redirecting to:', redirectTo);

      // Increased delay to ensure cart context has processed authentication change
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 300);
    }
  }, [isAuthenticated, isLoading, userData, currentUser, navigate, location]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending sessions if needed
    };
  }, []);

  // Handle countdown for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format phone number with country code
  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Add India country code (+91) if not present
    if (digits.length === 10) {
      return `+91${digits}`;
    } else if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }

    return phone;
  };

  // Handle location selection from Google Maps
  const handleLocationSelect = (location: LocationResult) => {
    const extractedPincode = location.addressComponents ? extractPincode(location.addressComponents) : null;

    console.log('Location selected in new user setup:', {
      coordinates: location.coordinates,
      formattedAddress: location.formattedAddress,
      placeId: location.placeId,
      pincode: extractedPincode
    });

    setAddressLines(location.formattedAddress);
    setLatitude(location.coordinates.lat);
    setLongitude(location.coordinates.lng);
    setFormattedAddress(location.formattedAddress);
    setPlaceId(location.placeId);
    setUseMapLocation(true);

    // Auto-fill pincode if extracted from address
    if (extractedPincode && extractedPincode.length === 6) {
      setPincode(extractedPincode);
    }
  };

  // Handle phone number submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (formattedPhone.length < 13) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send OTP via hosted SMS proxy server
      const result = await sendOTP(formattedPhone);

      if (result.success) {
        setLoginStep(LoginStep.OTP_VERIFICATION);
        setCountdown(30); // Start 30 second countdown for resend
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone number and verify OTP via hosted server
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await verifyOTPAndAuthenticate(formattedPhone, otp);

      console.log('=== LOGIN: OTP verification result ===', {
        success: result.success,
        userExists: result.userExists,
        isDeactivated: result.isDeactivated,
        userUID: result.user?.uid,
        userPhone: result.user?.phoneNumber
      });

      if (result.success) {
        setAuthResult(result);

        if (result.userExists) {
          if (result.isDeactivated) {
            // Show reactivation message
            setShowReactivationMessage(true);
            setTimeout(() => {
              setShowReactivationMessage(false);
              const redirectTo = location.state?.redirectTo || location.state?.from?.pathname || '/';
              console.log('=== LOGIN: Account reactivated, redirecting to:', redirectTo);

              // Increased delay to ensure cart context has processed authentication change
              setTimeout(() => {
                navigate(redirectTo, { replace: true });
              }, 300);
            }, 2000);
          } else {
            // User exists, redirect to intended destination
            const redirectTo = location.state?.redirectTo || location.state?.from?.pathname || '/';
            console.log('=== LOGIN: Existing user verified, redirecting to:', redirectTo);

            // Increased delay to ensure cart context has processed authentication change
            setTimeout(() => {
              navigate(redirectTo, { replace: true });
            }, 300);
          }
        } else {
          // New user, collect additional information
          setLoginStep(LoginStep.NEW_USER_DETAILS);
        }
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle new user details submission
  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!addressLines.trim()) {
      setError('Please enter your address');
      return;
    }

    if (!pincode.trim() || pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new user profile with address
      const newAddress: Partial<Address> = {
        addressID: 1, // First address
        addressName,
        addressLines,
        landmark,
        pincode: parseInt(pincode),
        phoneNumber: formatPhoneNumber(phoneNumber),
        branchCode: 'MAIN', // Default branch
        branchName: 'Main Branch'
      };

      // Only include location data if available (not undefined)
      if (latitude !== undefined) {
        newAddress.latitude = latitude;
      }
      if (longitude !== undefined) {
        newAddress.longitude = longitude;
      }
      if (formattedAddress !== undefined) {
        newAddress.formattedAddress = formattedAddress;
      }
      if (placeId !== undefined) {
        newAddress.placeId = placeId;
      }

      console.log('Creating new user profile with address and location:', {
        addressID: newAddress.addressID,
        addressName: newAddress.addressName,
        hasLocation: !!(latitude && longitude),
        latitude,
        longitude,
        formattedAddress,
        placeId
      });

      await createUserProfile(name, formatPhoneNumber(phoneNumber), newAddress);

      // Redirect to intended destination
      const redirectTo = location.state?.redirectTo || location.state?.from?.pathname || '/';
      console.log('=== LOGIN: New user profile created, redirecting to:', redirectTo);

      // Increased delay to ensure cart context has processed authentication change
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 300);
    } catch (err) {
      console.error('Error creating user profile:', err);
      setError('Failed to create user profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Get the phone number to resend to
      const phoneToResend = formatPhoneNumber(phoneNumber);

      console.log('=== LOGIN: Resending OTP ===');
      console.log('Resending OTP to:', phoneToResend);

      const result = await sendOTP(phoneToResend);

      if (result.success) {
        setCountdown(30); // Reset countdown
        console.log('=== LOGIN: OTP resent successfully ===');
      } else {
        console.error('Failed to resend OTP:', result);
        setError(result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('=== ERROR IN LOGIN RESEND OTP ===', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
      console.log('=== LOGIN: Resend OTP operation completed ===');
    }
  };

  // Render different steps based on login flow
  const renderStep = () => {
    switch (loginStep) {
      case LoginStep.PHONE_INPUT:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Login with Phone</h1>
            <p className="text-gray-600 mb-8">
              Enter your phone number to receive a one-time password
            </p>

            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your 10-digit number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We'll send you a 6-digit OTP to verify your number
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || phoneNumber.length !== 10}
                className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  isSubmitting || phoneNumber.length !== 10
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                } transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>


          </motion.div>
        );

      case LoginStep.OTP_VERIFICATION:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Verify OTP</h1>
            <p className="text-gray-600 mb-8">
              We've sent a 6-digit code to {formatPhoneNumber(phoneNumber)}
            </p>

            <form onSubmit={handleOtpSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  renderSeparator={<span className="w-0.5 sm:w-1"></span>}
                  renderInput={(props) => (
                    <input
                      {...props}
                      className="w-10 h-10 sm:w-14 sm:h-14 text-center text-sm sm:text-lg font-bold text-gray-800 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200 bg-white focus:bg-white focus:shadow-md hover:border-gray-400 px-1 sm:px-2"
                      style={{
                        color: '#1f2937',
                        backgroundColor: '#ffffff',
                        caretColor: '#73338A'
                      }}
                    />
                  )}
                  containerStyle="flex justify-center gap-0.5 sm:gap-1"
                />
                <div className="flex justify-between items-center mt-4">
                  <button
                    type="button"
                    onClick={() => setLoginStep(LoginStep.PHONE_INPUT)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Change phone number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0}
                    className={`text-sm ${
                      countdown > 0 ? 'text-gray-400' : 'text-primary hover:text-primary/80'
                    }`}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  isSubmitting || otp.length !== 6
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                } transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        );

      case LoginStep.NEW_USER_DETAILS:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full min-h-0 flex-shrink-0"
          >
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Complete Your Profile</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Please provide your details to complete registration
            </p>

            <form onSubmit={handleNewUserSubmit} className="w-full">
              <div className="space-y-4 sm:space-y-5 mb-6 auth-modal-form-group">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors auth-modal-input text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type
                  </label>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {['Home', 'Work', 'Other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressName(type)}
                        className={`flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-colors auth-modal-button ${
                          addressName === type
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {addressName === type && <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Select Your Location
                  </label>
                  <div className="w-full">
                    <LocationSelector
                      onLocationSelect={handleLocationSelect}
                      variant="card"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address {useMapLocation && <span className="text-xs text-green-600">(From Map)</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      value={addressLines}
                      onChange={(e) => {
                        setAddressLines(e.target.value);
                        setUseMapLocation(false);
                      }}
                      placeholder="Enter your complete address or select from map above"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors auth-modal-input text-base resize-none"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Nearby landmark"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors auth-modal-input text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit pincode"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors auth-modal-input text-base"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !addressLines.trim() || pincode.length !== 6}
                className={`w-full py-3 sm:py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base auth-modal-button ${
                  isSubmitting || !name.trim() || !addressLines.trim() || pincode.length !== 6
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                } transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Creating Account...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Complete Registration</span>
                    <span className="sm:hidden">Complete</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </button>


            </form>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg flex flex-col auth-modal-container" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        {/* Scrollable content container */}
        <div className="flex-1 overflow-y-auto auth-modal-content p-4 sm:p-6 md:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src="/image/logo.svg"
              alt="Vrisham Organic"
              className="h-10 sm:h-12"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Reactivation message */}
          {showReactivationMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-4 sm:mb-6"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Account Reactivated!</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Your account was previously deactivated. Logging in has reactivated your account.
              </p>
              <div className="mt-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </div>
            </motion.div>
          )}

          {/* Login steps */}
          {!showReactivationMessage && (
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          )}
        </div>


      </div>
    </div>
  );
}
