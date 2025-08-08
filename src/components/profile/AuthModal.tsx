import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, ArrowRight, Shield, AlertCircle, Loader2 } from 'lucide-react';
import OtpInput from 'react-otp-input';
import { sendOTP, verifyOTPAndAuthenticate } from '../../firebase/customTokenAuth';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { createUserProfile } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [userDetails, setUserDetails] = useState({
    name: '',
    address: '',
    pincode: ''
  });
  const [showReactivationMessage, setShowReactivationMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userExists, setUserExists] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Generate unique container ID for this component instance
  // This will be updated dynamically for resend operations
  const [recaptchaContainerId, setRecaptchaContainerId] = useState(`recaptcha-container-auth-modal-${Date.now()}`);

  // Handle countdown for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending sessions if needed
    };
  }, []);

  // Handle viewport changes for mobile keyboard and prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleResize = () => {
      // Scroll to top of modal when viewport changes (keyboard open/close)
      if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
      }
    };

    const handleFocus = (e: FocusEvent) => {
      // When an input is focused, ensure it's visible
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          // Check if the target is still in the DOM and visible
          if (target.offsetParent !== null) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }
        }, 300); // Delay to allow keyboard animation
      }
    };

    // Handle escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalStyle;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  // Format phone number to include country code if not present
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';

    // Remove any non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // If it doesn't start with +91 (India), add it
    if (!digits.startsWith('91')) {
      return `+91${digits}`;
    }

    return `+${digits}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Format and use the actual phone number entered by user
      const phoneToUse = formatPhoneNumber(phone);

      // Send OTP via integrated auth system
      const result = await sendOTP(phoneToUse);

      if (result.success) {
        setStep('otp');
        setCountdown(30); // Start countdown for resend
      } else {
        // Handle specific error codes
        if (result.errorCode === 'INVALID_PHONE_NUMBER') {
          setError('Invalid phone number format. Please check and try again.');
        } else if (result.errorCode === 'RATE_LIMITED') {
          setError('Too many requests. Please try again later.');
        } else {
          setError(result.error || 'Failed to send OTP. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error in phone submission:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Format phone number and verify OTP with integrated auth
      const phoneToUse = formatPhoneNumber(phone);
      console.log('=== AUTH MODAL: Starting OTP verification ===');
      const result = await verifyOTPAndAuthenticate(phoneToUse, otp);
      console.log('=== AUTH MODAL: OTP verification result ===', result);

      if (result.success) {
        setAuthResult(result);
        setUserExists(result.userExists || false);

        if (result.userExists) {
          if (result.isDeactivated) {
            console.log('=== AUTH MODAL: Deactivated user reactivated, calling onSuccess ===');
            setShowReactivationMessage(true);
            // Show reactivation message briefly, then proceed
            setTimeout(() => {
              setShowReactivationMessage(false);
              onSuccess();
            }, 2000);
          } else {
            console.log('=== AUTH MODAL: Existing user detected, calling onSuccess ===');
            onSuccess();
          }
        } else {
          console.log('=== AUTH MODAL: New user detected, showing details form ===');
          setStep('details');
        }
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error in OTP verification:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setError(null);
    setLoading(true);

    try {
      // Get the phone number to resend to
      const phoneToResend = formatPhoneNumber(phone);

      console.log('=== AUTH MODAL: Resending OTP ===');
      console.log('Resending OTP to:', phoneToResend);

      const result = await sendOTP(phoneToResend, true);

      if (result.success) {
        setCountdown(30); // Reset countdown
        console.log('=== AUTH MODAL: OTP resent successfully ===');
      } else {
        console.error('Failed to resend OTP:', result);
        setError(result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('=== ERROR IN AUTH MODAL RESEND OTP ===', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== AUTH MODAL: Resend OTP operation completed ===');
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs with better error messages
      if (!userDetails.name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }

      if (userDetails.name.trim().length < 2) {
        setError('Name must be at least 2 characters long');
        setLoading(false);
        return;
      }

      if (!userDetails.address.trim()) {
        setError('Please enter your delivery address');
        setLoading(false);
        return;
      }

      if (userDetails.address.trim().length < 10) {
        setError('Please enter a complete address (at least 10 characters)');
        setLoading(false);
        return;
      }

      if (!userDetails.pincode || !/^\d{6}$/.test(userDetails.pincode)) {
        setError('Please enter a valid 6-digit pincode');
        setLoading(false);
        return;
      }

      console.log('=== AUTH MODAL: Creating user profile with details ===', {
        name: userDetails.name,
        phone: formatPhoneNumber(phone),
        address: userDetails.address,
        pincode: userDetails.pincode
      });

      // Create user profile in Firestore with more detailed address
      const addressData = {
        addressID: 1, // First address ID
        addressLines: userDetails.address,
        addressName: 'Home',
        landmark: '',
        pincode: parseInt(userDetails.pincode),
        phoneNumber: formatPhoneNumber(phone),
        branchCode: 'MAIN', // Default branch code
        branchName: 'Main Branch' // Default branch name
      };

      console.log('=== AUTH MODAL: Address data being sent ===', addressData);

      await createUserProfile(userDetails.name, formatPhoneNumber(phone), addressData);

      console.log('=== AUTH MODAL: User profile created successfully ===');
      onSuccess();
    } catch (err: any) {
      console.error('=== AUTH MODAL: Error creating user profile ===', err);
      setError(`Failed to create profile: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-1 sm:p-4 overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="auth-modal-container bg-white rounded-xl sm:rounded-2xl w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg relative overflow-hidden max-h-[98vh] sm:max-h-[95vh] flex flex-col mx-1 sm:mx-0"
          >
            {/* Scrollable content container */}
            <div
              ref={modalContentRef}
              className="auth-modal-content overflow-y-auto flex-1 p-3 sm:p-4 md:p-6 scroll-smooth"
            >
              <button
                onClick={onClose}
                className="absolute right-2 top-2 sm:right-4 sm:top-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                disabled={loading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

            {/* Global reCAPTCHA container - always present in DOM */}
            <div
              id={recaptchaContainerId}
              ref={recaptchaContainerRef}
              className="hidden"
              style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}
            ></div>

              {step === 'phone' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Welcome Back!</h2>
                    <p className="text-sm sm:text-base text-gray-600">Enter your phone number to continue</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base">{error}</span>
                    </div>
                  )}

                {recaptchaError && (
                  <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{recaptchaError}</span>
                  </div>
                )}

                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="auth-modal-form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          setPhone(value);
                        }}
                        placeholder="Enter your phone number"
                        className="auth-modal-input w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
                        required
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: 9876543210 (Country code will be added automatically)
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="auth-modal-button w-full bg-primary text-white py-2.5 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs sm:text-sm text-gray-500">
                    By continuing, you agree to our{' '}
                    <button className="text-primary">Terms of Service</button> and{' '}
                    <button className="text-primary">Privacy Policy</button>
                  </p>
                </div>
              )}

              {step === 'otp' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Verify OTP</h2>
                    <p className="text-sm sm:text-base text-gray-600">Enter the OTP sent to {formatPhoneNumber(phone)}</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="flex justify-center px-1 sm:px-2">
                      <OtpInput
                        value={otp}
                        onChange={setOtp}
                        numInputs={6}
                        renderSeparator={<span className="w-0.5 sm:w-1 md:w-2"></span>}
                        renderInput={(props) => (
                          <input
                            {...props}
                            className="auth-modal-otp-input !w-7 h-7 xs:!w-8 xs:h-8 sm:!w-10 sm:h-10 md:!w-12 md:h-12 !mx-0 text-center text-xs xs:text-sm sm:text-base md:text-lg font-bold text-gray-800 border-2 border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-white focus:bg-white focus:shadow-md hover:border-gray-400"
                            disabled={loading}
                            style={{
                              color: '#1f2937',
                              backgroundColor: '#ffffff',
                              caretColor: '#73338A',
                              fontSize: window.innerWidth < 400 ? '14px' : undefined
                            }}
                          />
                        )}
                        containerStyle="flex justify-center gap-0.5 xs:gap-1 sm:gap-2"
                      />
                    </div>

                    <button
                      type="submit"
                      className="auth-modal-button w-full bg-primary text-white py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Verifying...
                        </div>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>

                    <div className="flex flex-col xs:flex-row justify-between items-center gap-2 xs:gap-3 sm:gap-0">
                      <button
                        type="button"
                        className="text-xs sm:text-sm text-primary hover:text-primary/80 py-1 px-2 rounded"
                        onClick={() => {
                          setOtp('');
                          setStep('phone');
                        }}
                        disabled={loading}
                      >
                        Change phone number
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={countdown > 0 || loading}
                        className={`text-xs sm:text-sm py-1 px-2 rounded ${
                          countdown > 0 || loading ? 'text-gray-400' : 'text-primary hover:text-primary/80'
                        }`}
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {showReactivationMessage && (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Account Reactivated!</h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Your account was previously deactivated. Logging in has reactivated your account.
                  </p>
                  <div>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto text-primary" />
                  </div>
                </div>
              )}

              {step === 'details' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Complete Your Profile</h2>
                    <p className="text-sm sm:text-base text-gray-600">We need a few more details</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div className="auth-modal-form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={userDetails.name}
                        onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="auth-modal-input w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="auth-modal-form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Address
                      </label>
                      <textarea
                        value={userDetails.address}
                        onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                        placeholder="Enter your delivery address"
                        rows={3}
                        className="auth-modal-input w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm sm:text-base resize-none"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="auth-modal-form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={userDetails.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          setUserDetails({ ...userDetails, pincode: value });
                        }}
                        placeholder="Enter your pincode"
                        className="auth-modal-input w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm sm:text-base"
                        required
                        disabled={loading}
                      />
                    </div>

                    <button
                      type="submit"
                      className="auth-modal-button w-full bg-primary text-white py-2.5 sm:py-3 rounded-xl font-semibold mt-6 text-sm sm:text-base"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Creating Profile...
                        </div>
                      ) : (
                        'Complete Profile'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
