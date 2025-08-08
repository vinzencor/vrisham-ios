import React, { useState, useEffect } from 'react';
import { MapPin, CreditCard, Truck, ChevronRight, ArrowLeft, Plus, Ticket, AlertCircle, X, Loader2, Package, Home, Briefcase, Banknote, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { createOrder, createOrderForPayment, updateOrderPaymentStatus, listenToOrderStatus } from '../firebase/orders';
import { validateCoupon, applyCoupon } from '../firebase/coupons';
import { validatePincode, PincodeValidationResult } from '../firebase/pincodes';
import { LocationSelector } from './maps/LocationSelector';
import { AddressMapPreview } from './maps/AddressMapPreview';
import { MapViewer } from './maps/MapViewer';
import { LocationResult, extractPincode } from '../utils/location';
import { initiatePayment, PaymentResult } from '../services/razorpay';
import { getDeliveryInfoForItem } from '../firebase/products';
import { formatPrice, ensureSafeNumber } from '../utils/numberUtils';

interface Address {
  id: string;
  name: string;
  address: string;
  phone: string;
  pincode: string;
  isDefault: boolean;
}

interface DeliveryOption {
  id: string;
  label: string;
  description: string;
  price: number;
}

type PaymentMethod = 'cod' | 'online';

export function Checkout() {
  const navigate = useNavigate();
  const { userData, updateUser, getUserPhoneNumber, isAuthenticated, currentUser, isLoading } = useAuth();

  console.log('=== CHECKOUT: Authentication state ===', {
    isAuthenticated,
    hasCurrentUser: !!currentUser,
    hasUserData: !!userData,
    isLoading,
    userUID: currentUser?.uid,
    userPhone: currentUser?.phoneNumber
  });
  const { items, subtotal, deliveryFee, total, clearCart, appliedCoupon, couponDiscount, applyCoupon: applyCouponToCart, removeCoupon, setDeliveryFee, isCartLoading } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Payment method selection
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('online');

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment processing state
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Order tracking state
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [waitingForPayment, setWaitingForPayment] = useState(false);

  // Delivery validation state
  const [deliveryValidation, setDeliveryValidation] = useState<PincodeValidationResult | null>(null);
  const [validatingDelivery, setValidatingDelivery] = useState(false);

  // Calculate consolidated delivery date (maximum delivery time among all items)
  const getConsolidatedDeliveryInfo = () => {
    if (items.length === 0) {
      return getDeliveryInfoForItem('in-stock');
    }

    // Get delivery info for all items and find the one with maximum days
    const deliveryInfos = items.map(item => getDeliveryInfoForItem(item.type));

    // Find the delivery info with the maximum days from now
    const maxDeliveryInfo = deliveryInfos.reduce((max, current) => {
      return current.daysFromNow > max.daysFromNow ? current : max;
    });

    return maxDeliveryInfo;
  };

  const consolidatedDelivery = getConsolidatedDeliveryInfo();

  // Fetch addresses from user profile
  useEffect(() => {
    const loadAddresses = async () => {
      setLoadingAddresses(true);
      setAddressError(null);

      try {
        if (userData && userData.listOfAddress && userData.listOfAddress.length > 0) {
          console.log('Loading addresses from user profile:', userData.listOfAddress);

          // Map Firebase addresses to checkout format
          const mappedAddresses = userData.listOfAddress.map((addr, index) => ({
            id: addr.addressID?.toString() || index.toString(),
            name: addr.addressName || 'Address',
            address: addr.addressLines || '',
            phone: addr.phoneNumber || userData.phoneNumber || '',
            pincode: addr.pincode?.toString() || '',
            isDefault: index === 0 // First address is default
          }));

          setAddresses(mappedAddresses);

          // Set first address as selected by default
          if (mappedAddresses.length > 0) {
            setSelectedAddress(mappedAddresses[0].id);
          }

          console.log('Addresses loaded successfully:', mappedAddresses);
        } else {
          // No addresses found
          console.log('No addresses found in user profile');
          setAddresses([]);
        }
      } catch (err) {
        console.error('Error loading addresses:', err);
        setAddressError('Failed to load your addresses. Please try again.');
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (userData) {
      loadAddresses();
    } else {
      setLoadingAddresses(false);
    }
  }, [userData]);

  // Validate delivery when address is selected
  useEffect(() => {
    const validateDeliveryForSelectedAddress = async () => {
      if (!selectedAddress || addresses.length === 0) {
        setDeliveryValidation(null);
        setDeliveryFee(0);
        return;
      }

      const selectedAddressData = addresses.find(a => a.id === selectedAddress);
      if (!selectedAddressData || !selectedAddressData.pincode) {
        setDeliveryValidation(null);
        setDeliveryFee(0);
        return;
      }

      setValidatingDelivery(true);
      try {
        const validation = await validatePincode(selectedAddressData.pincode);
        setDeliveryValidation(validation);

        if (validation.isServiceable && validation.deliveryCharge !== undefined) {
          setDeliveryFee(validation.deliveryCharge);
        } else {
          setDeliveryFee(0);
        }
      } catch (error) {
        console.error('Error validating delivery:', error);
        setDeliveryValidation({
          isServiceable: false,
          error: 'Failed to validate delivery area'
        });
        setDeliveryFee(0);
      } finally {
        setValidatingDelivery(false);
      }
    };

    validateDeliveryForSelectedAddress();
  }, [selectedAddress, addresses, setDeliveryFee]);

  // New address form state
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

    console.log('Location selected:', {
      coordinates: location.coordinates,
      formattedAddress: location.formattedAddress,
      placeId: location.placeId,
      pincode
    });

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
    if (!pincodeValid) return;

    // Validate phone number before submission
    if (!validatePhoneNumber(newAddress.phone)) {
      return;
    }

    try {
      setLoadingAddresses(true);

      // Create new address in Firebase format
      const firebaseAddress: any = {
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

      console.log('Saving address with coordinates:', {
        addressID: firebaseAddress.addressID,
        latitude: firebaseAddress.latitude,
        longitude: firebaseAddress.longitude,
        formattedAddress: firebaseAddress.formattedAddress
      });

      // Get current addresses or initialize empty array
      const currentAddresses = userData?.listOfAddress || [];

      // Add new address to the list
      const updatedAddresses = [...currentAddresses, firebaseAddress];

      // Update user data in Firebase
      await updateUser({
        listOfAddress: updatedAddresses
      });

      console.log('Address added successfully');

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
    } catch (error) {
      console.error('Error adding address:', error);
      setAddressError('Failed to add address. Please try again.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (!userData) {
      setCouponError('Please log in to apply coupon');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      // Calculate total before discount for coupon validation
      const totalBeforeDiscount = subtotal + deliveryFee;
      const validation = await validateCoupon(couponCode.trim(), userData.uid, totalBeforeDiscount);

      if (validation.isValid && validation.coupon && validation.discountAmount !== undefined) {
        // Apply coupon to cart
        applyCouponToCart(validation.coupon, validation.discountAmount);
        setShowCouponInput(false);
        setCouponCode('');
      } else {
        setCouponError(validation.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError(null);
  };

  const handleProceedToPayment = async () => {
    if (!userData || !selectedAddress) {
      setOrderError('Please select a delivery address');
      return;
    }

    const selectedAddressData = addresses.find(a => a.id === selectedAddress);
    if (!selectedAddressData) {
      setOrderError('Selected address not found');
      return;
    }

    if (items.length === 0) {
      setOrderError('Your cart is empty');
      return;
    }

    try {
      setPlacingOrder(true);
      setPaymentError(null);
      setOrderError(null);

      // Check authentication before proceeding
      if (!isAuthenticated || !currentUser || !userData) {
        console.error('=== CHECKOUT: User not authenticated ===', {
          isAuthenticated,
          hasCurrentUser: !!currentUser,
          hasUserData: !!userData
        });
        throw new Error('You must be logged in to place an order. Please login and try again.');
      }

      console.log('Creating order with payment method:', selectedPaymentMethod);
      console.log('User data:', userData);
      console.log('Selected address:', selectedAddressData);

      // Apply coupon if one is selected (before creating order)
      if (appliedCoupon && couponDiscount > 0) {
        const tempOrderId = Date.now(); // Temporary ID for coupon application
        const couponResult = await applyCoupon(
          appliedCoupon.code,
          userData.uid,
          tempOrderId,
          couponDiscount,
          'MAIN'
        );

        if (!couponResult.success) {
          throw new Error(couponResult.error || 'Failed to apply coupon');
        }
      }

      // Handle COD orders differently
      if (selectedPaymentMethod === 'cod') {
        // For COD, create order directly and redirect to success
        const orderId = await createOrder({
          customerID: userData.uid,
          customerName: userData.displayName || 'Customer',
          phoneNumber: getUserPhoneNumber() || selectedAddressData.phone || '',
          address: selectedAddressData,
          items: items,
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          discount: couponDiscount,
          grandTotal: finalTotal,
          paymentMethod: 'cod',
          couponCode: appliedCoupon?.code || null,
          couponDiscount: couponDiscount || null,
        });

        console.log('COD Order created with ID:', orderId);

        // For COD orders, use the timestamp as orderNumber (since createOrder generates orderID as timestamp)
        const orderNumber = Date.now();

        // Clear cart and redirect to success page
        clearCart();
        navigate('/success', {
          state: {
            orderId,
            orderNumber: orderNumber,
            total: finalTotal,
            paymentMethod: 'cod',
            address: selectedAddressData,
            items: items,
            coupon: appliedCoupon,
            couponDiscount: couponDiscount,
            deliveryDate: consolidatedDelivery.date,
            deliveryLabel: consolidatedDelivery.label,
          }
        });
        return;
      }

      // For online payment, create order with pending payment status
      const { orderId, orderNumber: orderNum } = await createOrderForPayment({
        customerID: userData.uid,
        customerName: userData.displayName || 'Customer',
        phoneNumber: getUserPhoneNumber() || selectedAddressData.phone || '',
        address: selectedAddressData,
        items: items,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: couponDiscount,
        grandTotal: finalTotal,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount || null,
      });

      console.log('Order created with ID:', orderId, 'Order Number:', orderNum);
      setCreatedOrderId(orderId);
      setOrderNumber(orderNum);

      // Step 2: Start listening to order status changes
      const unsubscribe = listenToOrderStatus(orderId, (order) => {
        if (order) {
          console.log('Order status update:', order.status, 'Payment status:', order.paymentStatus);

          if (order.paymentStatus === 'paid' && order.status === 'placed') {
            // Payment successful, navigate to success page
            console.log('Payment confirmed, navigating to success page');
            unsubscribe(); // Stop listening
            clearCart();
            navigate('/success', {
              state: {
                orderId,
                orderNumber: ensureSafeNumber(orderNum),
                total: finalTotal,
                paymentMethod: 'online',
                address: selectedAddressData,
                items: items,
                coupon: appliedCoupon,
                couponDiscount: couponDiscount,
                paymentId: order.paymentId,
                deliveryDate: consolidatedDelivery.date,
                deliveryLabel: consolidatedDelivery.label,
              }
            });
          } else if (order.paymentStatus === 'failed' && order.status === 'payment_failed') {
            // Payment failed
            console.log('Payment failed');
            unsubscribe(); // Stop listening
            setWaitingForPayment(false);
            setProcessingPayment(false);
            setPlacingOrder(false);
            setPaymentError('Payment failed. Please try again.');
          }
        }
      });

      // Step 3: Initiate Razorpay payment with order ID as receipt
      setPlacingOrder(false);
      setProcessingPayment(true);
      setWaitingForPayment(true);

      const paymentResult: PaymentResult = await initiatePayment({
        amount: finalTotal,
        receipt: orderId, // Use Firebase order ID as receipt
        customerName: userData.displayName || 'Customer',
        customerEmail: userData.email || '',
        customerPhone: getUserPhoneNumber() || selectedAddressData.phone || '',
        description: `Vrisham Organic - Order #${orderNum}`,
      }, orderId); // Pass orderId for Firebase Functions verification

      if (paymentResult.success) {
        // Step 4: Update order with payment details
        console.log('Payment successful, updating order:', paymentResult);
        await updateOrderPaymentStatus(orderId, 'paid', {
          paymentId: paymentResult.paymentId,
          razorpayOrderId: paymentResult.orderId,
          paymentSignature: paymentResult.signature,
        });
      } else {
        // Payment failed or cancelled
        console.log('Payment failed or cancelled:', paymentResult.error);
        await updateOrderPaymentStatus(orderId, 'failed');
        throw new Error(paymentResult.error || 'Payment failed');
      }

    } catch (error) {
      console.error('Error in payment process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';

      if (errorMessage.includes('cancelled')) {
        setPaymentError('Payment was cancelled. Please try again.');
      } else {
        setPaymentError(errorMessage);
        setOrderError(errorMessage);
      }
    } finally {
      if (!waitingForPayment) {
        setProcessingPayment(false);
        setPlacingOrder(false);
      }
    }
  };

  // Calculate final total (discount is already handled in cart context)
  const finalTotal = ensureSafeNumber(total);

  // Check if cart is empty - but wait a bit to allow cart to load after authentication
  useEffect(() => {
    // Add a delay to prevent premature redirect during authentication state changes
    const timer = setTimeout(() => {
      if (items.length === 0) {
        console.log('Cart is empty after delay, redirecting to categories');
        navigate('/categories');
      }
    }, 500); // Wait 500ms to allow cart to load

    return () => clearTimeout(timer);
  }, [items, navigate]);

  // Show loading state while cart is loading
  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-800"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      <div className="pt-16 p-4 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        {/* Delivery Address Section */}
        <section className="mb-6">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <MapPin className="w-5 h-5 mr-2" />
            Delivery Address
          </h2>

          {/* Loading State */}
          {loadingAddresses && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-gray-600">Loading your addresses...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {addressError && !loadingAddresses && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-600 mt-1">{addressError}</p>
            </div>
          )}

          {/* Addresses List */}
          {!loadingAddresses && (
            <div className="space-y-3">
              {addresses.length > 0 ? (
                addresses.map((address) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                        selectedAddress === address.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white'
                      }`}
                      onClick={() => setSelectedAddress(address.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{address.name}</span>
                            {address.isDefault && (
                              <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-1">{address.address}</p>
                          <p className="text-gray-600 text-sm mb-1">{address.pincode}</p>
                          <p className="text-gray-600 text-sm">{address.phone}</p>
                        </div>

                        {/* Map Preview */}
                        {(() => {
                          const firebaseAddress = userData?.listOfAddress?.find(addr => addr.addressID?.toString() === address.id);
                          console.log('Address preview check:', {
                            addressId: address.id,
                            firebaseAddress,
                            hasCoordinates: !!(firebaseAddress?.latitude && firebaseAddress?.longitude)
                          });

                          if (firebaseAddress?.latitude && firebaseAddress?.longitude) {
                            return (
                              <div className="flex-shrink-0">
                                <AddressMapPreview
                                  latitude={firebaseAddress.latitude}
                                  longitude={firebaseAddress.longitude}
                                  address={address.address}
                                  size="small"
                                  isClickable={true}
                                  onClick={() => handleMapPreviewClick(address)}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No addresses found</h3>
                  <p className="text-gray-600 mb-4">Add your first delivery address to continue</p>
                </div>
              )}

              <button
                onClick={() => setShowAddAddress(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>
            </div>
          )}
        </section>

        {/* Order Items Summary */}
        <section className="mb-6">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <Package className="w-5 h-5 mr-2" />
            Order Summary ({items.length} item{items.length !== 1 ? 's' : ''})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 flex items-center gap-3 ${
                  index !== items.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                  <p className="text-gray-500 text-xs">{item.nameTamil}</p>
                  <p className="text-gray-600 text-sm">
                    {item.quantity} {item.unit} × {formatPrice(ensureSafeNumber(item.price))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">
                    {formatPrice(ensureSafeNumber(item.price) * ensureSafeNumber(item.quantity))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Method Selection */}
        <section className="mb-6">
          <h2 className="flex items-center text-lg font-semibold mb-4">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Method
          </h2>
          <div className="space-y-3">
            {/* Online Payment Option */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  selectedPaymentMethod === 'online'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white'
                }`}
                onClick={() => setSelectedPaymentMethod('online')}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💳</div>
                  <div className="flex-1">
                    <div className="font-medium">Online Payment</div>
                    <div className="text-sm text-gray-600">
                      Pay securely using UPI, Cards, Net Banking via Razorpay
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'online'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'online' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Cash on Delivery Option */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  selectedPaymentMethod === 'cod'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white'
                }`}
                onClick={() => setSelectedPaymentMethod('cod')}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">
                      Pay with cash when your order is delivered
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'cod'
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === 'cod' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          </div>
        </section>

        {/* Delivery Information */}
        <section className="mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-gray-900">Delivery Information</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expected Delivery</span>
              <span className="font-medium text-primary">{consolidatedDelivery.label}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              All items will be delivered together on the latest delivery date
            </p>
          </div>
        </section>

        {/* Order Summary */}
        <section className="mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(ensureSafeNumber(subtotal))}</span>
              </div>

              {/* Delivery Status and Charges */}
              {selectedAddress && (
                <div className="space-y-2">
                  {validatingDelivery ? (
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking delivery...
                      </span>
                      <span>-</span>
                    </div>
                  ) : deliveryValidation ? (
                    deliveryValidation.isServiceable ? (
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery Fee</span>
                        <span>{formatPrice(ensureSafeNumber(deliveryFee))}</span>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Delivery Not Available</span>
                        </div>
                        <p className="text-red-600 text-sm mt-1">
                          {deliveryValidation.error}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex justify-between text-gray-400">
                      <span>Delivery Fee</span>
                      <span>Select address to calculate</span>
                    </div>
                  )}
                </div>
              )}

              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatPrice(ensureSafeNumber(couponDiscount))}</span>
                </div>
              )}
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {!appliedCoupon && !showCouponInput && (
              <button
                onClick={() => setShowCouponInput(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 text-primary font-medium"
              >
                <Ticket className="w-5 h-5" />
                Apply Coupon
              </button>
            )}

            {showCouponInput && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError(null);
                    }}
                    placeholder="Enter coupon code"
                    className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      couponError ? 'border-red-300' : 'border-gray-200'
                    }`}
                    disabled={couponLoading}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {couponLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-600 text-sm mt-2">{couponError}</p>
                )}
                <button
                  onClick={() => {
                    setShowCouponInput(false);
                    setCouponCode('');
                    setCouponError(null);
                  }}
                  className="text-gray-500 text-sm mt-2 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {appliedCoupon && (
              <div className="mt-4 flex items-center justify-between bg-green-50 p-3 rounded-lg text-green-600">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  <div>
                    <span className="font-medium">{appliedCoupon.code} applied</span>
                    {appliedCoupon.description && (
                      <p className="text-xs text-green-600/80">{appliedCoupon.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Important Notes */}
        <section className="mb-6">
          <div className="bg-primary/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div className="text-sm text-gray-600">
                <p>
                  Farm items will be confirmed after harvest. If there's limited availability,
                  we'll notify you and adjust the final bill accordingly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto">
          {/* Payment Error */}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{paymentError}</span>
              </div>
            </div>
          )}

          {/* Order Error */}
          {orderError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{orderError}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleProceedToPayment}
            disabled={processingPayment || placingOrder || waitingForPayment || !selectedAddress || items.length === 0 || (deliveryValidation && !deliveryValidation.isServiceable)}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold shadow-md hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {placingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {selectedPaymentMethod === 'cod' ? 'Placing Order...' : 'Creating Order...'}
              </>
            ) : processingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Payment...
              </>
            ) : waitingForPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Confirming Payment...
              </>
            ) : (
              <>
                {selectedPaymentMethod === 'cod'
                  ? `Place Order • ${formatPrice(finalTotal)}`
                  : `Pay Now • ${formatPrice(finalTotal)}`
                }
              </>
            )}
          </button>
        </div>
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
              className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold">Add New Address</h3>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="checkout-add-address-form" onSubmit={handleAddAddress}>
                  <div className="space-y-4">
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
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
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
                      <p className="mt-1 text-sm text-red-500">{pincodeError}</p>
                    )}
                    {pincodeValid && (
                      <p className="mt-1 text-sm text-green-500">Delivery available in your area!</p>
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
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
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
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="checkout-add-address-form"
                    disabled={!pincodeValid}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Address
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