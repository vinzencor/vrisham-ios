import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getOrderById, listenToOrderStatus, mapOrderForUI } from '../firebase/orders';

interface OrderTrackingProps {}

// Status mapping from database to display labels
const STATUS_MAPPING = {
  'placed': 'Order Placed',
  'processing': 'Processing',
  'assigned': 'Processing',
  'confirmed': 'Processing',
  'shipped': 'Out for Delivery',
  'picked': 'Out for Delivery',
  'out_for_delivery': 'Out for Delivery', // Add mapping for admin app status
  'delivered': 'Delivered',
  'completed': 'Delivered',
  'cancelled': 'Cancelled',
  'canceled': 'Cancelled',
  'payment_pending': 'Payment Pending',
  'payment_failed': 'Payment Failed'
};

// Status progression order (using actual database values)
const STATUS_PROGRESSION = ['placed', 'processing', 'shipped', 'delivered'];

interface StatusStep {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const STATUS_STEPS: StatusStep[] = [
  {
    key: 'placed',
    label: 'Order Placed',
    icon: Package,
    description: 'Your order has been confirmed'
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: Clock,
    description: 'We are preparing your order'
  },
  {
    key: 'shipped',
    label: 'Out for Delivery',
    icon: Truck,
    description: 'Your order is on the way'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: CheckCircle2,
    description: 'Order delivered successfully'
  }
];

export function OrderTracking({}: OrderTrackingProps) {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [rawOrder, setRawOrder] = useState<any>(null); // Store raw Firestore data for status logic
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID not provided');
      setLoading(false);
      return;
    }

    console.log('OrderTracking: Fetching order with ID:', orderId);

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const firestoreOrder = await getOrderById(orderId);
        console.log('OrderTracking: Raw Firestore order data:', firestoreOrder);

        if (firestoreOrder) {
          // Store raw order for status logic
          setRawOrder(firestoreOrder);
          console.log('OrderTracking: Raw order status:', firestoreOrder.status);
          console.log('OrderTracking: Raw order paymentStatus:', firestoreOrder.paymentStatus);

          // Map the order data to UI format (same as OrderDetails)
          const mappedOrder = mapOrderForUI(firestoreOrder);
          console.log('OrderTracking: Mapped order for UI:', mappedOrder);
          console.log('OrderTracking: Mapped order status:', mappedOrder.status);
          setOrder(mappedOrder);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('OrderTracking: Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Set up real-time listener for order status updates
    const unsubscribe = listenToOrderStatus(orderId, (updatedOrder) => {
      console.log('OrderTracking: Real-time order update:', updatedOrder);
      if (updatedOrder) {
        // Store raw order for status logic
        setRawOrder(updatedOrder);
        console.log('OrderTracking: Updated raw order status:', updatedOrder.status);

        // Map the updated order data to UI format
        const mappedOrder = mapOrderForUI(updatedOrder);
        console.log('OrderTracking: Mapped updated order for UI:', mappedOrder);
        setOrder(mappedOrder);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [orderId]);

  const getCurrentStatusIndex = (status: string): number => {
    console.log('OrderTracking: getCurrentStatusIndex called with status:', status);

    // Map database status to progression status
    let progressionStatus = status;
    if (status === 'assigned' || status === 'confirmed') {
      progressionStatus = 'processing';
    } else if (status === 'picked' || status === 'out_for_delivery') {
      progressionStatus = 'shipped';
    } else if (status === 'completed') {
      progressionStatus = 'delivered';
    }

    const index = STATUS_PROGRESSION.indexOf(progressionStatus);
    console.log('OrderTracking: Status progression mapping:', {
      originalStatus: status,
      mappedStatus: progressionStatus,
      statusIndex: index,
      statusProgression: STATUS_PROGRESSION
    });

    return index;
  };

  const getStepStatus = (stepIndex: number, currentStatusIndex: number, isCancelled: boolean) => {
    if (isCancelled) {
      return stepIndex === 0 ? 'completed' : 'cancelled';
    }
    
    if (stepIndex < currentStatusIndex) {
      return 'completed';
    } else if (stepIndex === currentStatusIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const formatDeliveryDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !rawOrder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-white z-10">
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-2xl font-bold text-gray-800">Order Tracking</h1>
          </div>
        </div>
        
        <div className="p-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The order you are looking for could not be found.'}</p>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use raw Firestore status for stepper logic, mapped status for display
  const rawStatus = rawOrder.status;
  const currentStatusIndex = getCurrentStatusIndex(rawStatus);
  const isCancelled = rawStatus === 'cancelled';
  const displayStatus = STATUS_MAPPING[rawStatus] || rawStatus;
  const deliveryDateFormatted = formatDeliveryDate(order.deliveryDate);

  console.log('OrderTracking: Status analysis:', {
    rawStatus,
    mappedOrderStatus: order.status,
    currentStatusIndex,
    isCancelled,
    displayStatus
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10">
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Order Tracking</h1>
            <p className="text-sm text-gray-600">Order #{order.id}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isCancelled ? 'bg-red-50' : 'bg-primary/10'
            }`}>
              {isCancelled ? (
                <AlertCircle className="w-8 h-8 text-red-500" />
              ) : (
                <Package className="w-8 h-8 text-primary" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{displayStatus}</h2>
            {deliveryDateFormatted && !isCancelled && (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Expected delivery: {deliveryDateFormatted}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Order Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Progress</h3>
          
          <div className="space-y-6">
            {STATUS_STEPS.map((step, index) => {
              const stepStatus = getStepStatus(index, currentStatusIndex, isCancelled);
              
              return (
                <div key={step.key} className="flex items-start gap-4">
                  {/* Step Icon */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      stepStatus === 'completed' 
                        ? 'bg-primary border-primary text-white' 
                        : stepStatus === 'current'
                        ? 'bg-primary/10 border-primary text-primary'
                        : stepStatus === 'cancelled'
                        ? 'bg-gray-100 border-gray-300 text-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      {stepStatus === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>
                    
                    {/* Connecting Line */}
                    {index < STATUS_STEPS.length - 1 && (
                      <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-6 ${
                        stepStatus === 'completed' || (stepStatus === 'current' && index < currentStatusIndex)
                          ? 'bg-primary' 
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 pb-6">
                    <h4 className={`font-medium ${
                      stepStatus === 'completed' || stepStatus === 'current'
                        ? 'text-gray-800'
                        : 'text-gray-400'
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      stepStatus === 'completed' || stepStatus === 'current'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h3>

          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {item.quantity} {item.unit} × ₹{item.price}
                    </div>
                    <div className="text-primary font-medium mt-1">
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No items found in this order</p>
            </div>
          )}
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium">
                {order.date ? format(new Date(order.date), 'MMM d, yyyy') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items</span>
              <span className="font-medium">{order.items?.length || 0} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">
                {order.modeOfPayment === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
            {!isCancelled && deliveryDateFormatted && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Delivery</span>
                <span className="font-medium">{deliveryDateFormatted}</span>
              </div>
            )}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total Amount</span>
              <span className="font-semibold text-primary">₹{order.total}</span>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Orders
          </button>
        </motion.div>
      </div>
    </div>
  );
}
