
import { useEffect } from 'react';
import { Trash2, AlertCircle, ArrowLeft, Plus, Minus, Truck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getDeliveryInfoForItem } from '../firebase/products';
import { formatQuantityDisplay, formatPrice, safeMultiply, ensureSafeNumber } from '../utils/numberUtils';

export function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, subtotal, isCartLoading } = useCart();
  const { isAuthenticated } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Handle proceed to checkout with authentication check
  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login with checkout as the intended destination
      navigate('/login', {
        state: {
          from: { pathname: '/checkout' },
          redirectTo: '/checkout'
        }
      });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 p-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-800"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="pt-16 pb-32 md:pb-24 p-4 md:max-w-2xl md:mx-auto">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>

        {isCartLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-gray-600">Loading cart...</p>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white border border-primary/20 rounded-xl p-4 shadow-sm hover:shadow-primary/10 mb-4"
            >
              <div className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-gray-500 text-sm">{item.nameTamil}</p>
                      {item.selectedSize && (
                        <p className="text-sm text-gray-600 mt-1">
                          Size: {item.selectedSize.label} ({item.selectedSize.weightRange})
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const decrementAmount = ensureSafeNumber(item.incrementalQuantity, 1);
                          updateQuantity(item.id, -decrementAmount);
                        }}
                        className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-12 text-center">
                        {formatQuantityDisplay(item.quantity)} {item.unit}
                      </span>
                      <button
                        onClick={() => {
                          const incrementAmount = ensureSafeNumber(item.incrementalQuantity, 1);
                          updateQuantity(item.id, incrementAmount);
                        }}
                        className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-medium text-primary">
                      {formatPrice(safeMultiply(item.price, item.quantity))}
                    </span>
                  </div>



                  {item.status === 'pending' && (
                    <div className="mt-1.5 flex items-center gap-1 text-secondary text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Pending Confirmation</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate('/categories')}
              className="text-primary font-medium"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* Consolidated Delivery Information */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
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

            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <div className="space-y-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-600">
                  Farm items are confirmed after harvest. If there's limited availability,
                  we'll notify you and adjust the final bill accordingly.
                </p>
              </div>
            </div>
          </>
        )}
        </>
        )}
      </div>

      {!isCartLoading && items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="md:max-w-2xl md:mx-auto">
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              Proceed to Payment • {formatPrice(subtotal)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}