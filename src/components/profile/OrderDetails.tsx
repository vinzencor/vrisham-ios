import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, AlertCircle, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getOrderById, mapOrderForUI } from '../../firebase/orders';
import { useCart } from '../../contexts/CartContext';

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

export function OrderDetails({ orderId, onBack }: OrderDetailsProps) {
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingAgain, setBuyingAgain] = useState(false);

  // Helper function to safely format dates
  const safeFormatDate = (dateValue: any, formatString: string = 'PPP'): string | null => {
    if (!dateValue) return null;

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return format(date, formatString);
    } catch (error) {
      console.warn('Invalid date format:', dateValue);
      return null;
    }
  };

  // Fetch order data on component mount
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching order with ID:', orderId);
        const firestoreOrder = await getOrderById(orderId);

        if (firestoreOrder) {
          console.log('Fetched order from Firestore:', firestoreOrder);
          const mappedOrder = mapOrderForUI(firestoreOrder);
          console.log('Mapped order for UI:', mappedOrder);
          setOrder(mappedOrder);
        } else {
          // Fallback to mock data if order not found
          console.log('Order not found, using mock data');
          setOrder({
            id: orderId,
            date: '2024-03-15T10:30:00',
            status: 'confirmed' as const,
            items: [
              {
                id: '1',
                name: 'Organic Roma Tomatoes',
                quantity: 2,
                unit: 'kg',
                price: 60,
                image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'
              }
            ],
            total: 160,
            deliveryDate: '2024-03-18T14:00:00',
            address: {
              name: 'Home',
              lines: '123, Green Valley Apartments, Baner Road, Pune',
              pincode: '411045',
              phone: '+91 98765 43210'
            }
          });
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-white z-10">
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-2xl font-bold text-gray-800">Order Details</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-gray-600">Loading order details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-white z-10">
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-2xl font-bold text-gray-800">Order Details</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-white z-10">
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-2xl font-bold text-gray-800">Order Details</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Order not found</h3>
          <p className="text-gray-600">The order you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-orange-500 bg-orange-50';
      case 'confirmed':
        return 'text-blue-500 bg-blue-50';
      case 'shipped':
        return 'text-purple-500 bg-purple-50';
      case 'delivered':
        return 'text-green-500 bg-green-50';
      case 'cancelled':
        return 'text-red-500 bg-red-50';
      case 'payment_pending':
        return 'text-orange-500 bg-orange-50';
      case 'payment_failed':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'confirmed':
        return Package;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle2;
      case 'cancelled':
        return AlertCircle;
      case 'payment_pending':
        return Clock;
      case 'payment_failed':
        return AlertCircle;
      default:
        return Package;
    }
  };



  const handleBuyAgain = async () => {
    if (!order || !order.items || order.items.length === 0) {
      return;
    }

    try {
      setBuyingAgain(true);

      // Add all items from the order to the cart
      for (const item of order.items) {
        const cartItem = {
          id: item.id,
          name: item.name,
          nameTamil: '', // Not available in order data
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          status: 'pending' as const,
          type: 'product' as const, // Default type
          // Handle variants if they exist
          selectedSize: item.variantID ? {
            id: item.variantID,
            label: item.variationValues ? Object.values(item.variationValues).join(', ') : '',
            weightRange: '',
            price: item.price
          } : undefined
        };

        addToCart(cartItem);
      }

      // Navigate to cart page
      navigate('/cart');
    } catch (error) {
      console.error('Error adding items to cart:', error);
    } finally {
      setBuyingAgain(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-white z-10">
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Order Details</h1>
            <p className="text-sm text-gray-600">Order ID: {order.id}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(order.status)}`}>
              {React.createElement(getStatusIcon(order.status), { className: 'w-6 h-6' })}
            </div>
            <div>
              <h2 className="font-medium text-lg capitalize">{order.status}</h2>
              {safeFormatDate(order.deliveryDate) && order.status !== 'cancelled' && (
                <p className="text-gray-600">
                  Expected delivery: {safeFormatDate(order.deliveryDate)}
                </p>
              )}
            </div>
          </div>

          <div className="text-center py-4">
            {safeFormatDate(order.date) && (
              <p className="text-gray-600">
                Ordered on {safeFormatDate(order.date)}
              </p>
            )}
            {safeFormatDate(order.deliveryDate) && order.status !== 'cancelled' && (
              <p className="text-gray-600 mt-1">
                Expected delivery: {safeFormatDate(order.deliveryDate)}
              </p>
            )}
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="font-medium text-lg mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{item.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.quantity} {item.unit} × ₹{item.price}
                  </div>
                  <div className="text-primary font-medium mt-1">
                    ₹{item.quantity * item.price}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal || (order.total - (order.deliveryCharge || 40))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryCharge || 40}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">₹{order.total}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delivery Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="font-medium text-lg mb-4">Delivery Details</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Delivery Address</div>
              <div className="font-medium">{order.address?.name || 'Home'}</div>
              <div className="text-gray-600">{order.address?.lines || 'Address not available'}</div>
              <div className="text-gray-600">{order.address?.pincode || ''}</div>
              <div className="text-gray-600">{order.address?.phone || order.phoneNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Payment Method</div>
              <div className="font-medium">{order.modeOfPayment === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Track Order Button */}
          <button
            onClick={() => navigate(`/orders/${order.firestoreId || order.id}`)}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Truck className="w-5 h-5" />
            Track Order
          </button>

          {/* Buy Again Button */}
          <button
            onClick={handleBuyAgain}
            disabled={buyingAgain || !order?.items?.length}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buyingAgain ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding to Cart...
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                Buy Again
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}