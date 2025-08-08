import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { OrderDetails } from './OrderDetails';
import { format } from 'date-fns';
import { getOrdersByPhoneNumber, getOrdersByCustomer, mapOrderForUI } from '../../firebase/orders';
import { useAuth } from '../../contexts/AuthContext';

interface MyOrdersProps {
  onBack: () => void;
  showHeader?: boolean;
}

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'out_for_delivery';
  items: {
    name: string;
    quantity: number;
    unit: string;
    price: number;
    image: string;
  }[];
  total: number;
  deliveryDate?: string;
}

export function MyOrders({ onBack, showHeader = true }: MyOrdersProps) {
  const { userData } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper function to safely format dates
  const safeFormatDate = (dateValue: any, formatString: string = 'MMM d, yyyy'): string => {
    if (!dateValue) return 'Date not available';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, formatString);
    } catch (error) {
      console.warn('Invalid date format:', dateValue);
      return 'Invalid date';
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData) {
        console.log('No user data available, skipping order fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching orders for user:', userData.uid, userData.phoneNumber);

        // Try to fetch by customer ID first (more reliable)
        let firestoreOrders = [];
        try {
          firestoreOrders = await getOrdersByCustomer(userData.uid);
          console.log('Fetched orders by customer ID:', firestoreOrders);
        } catch (customerError) {
          console.log('Failed to fetch by customer ID, trying phone number:', customerError);

          // Fallback to phone number if customer ID fails
          if (userData.phoneNumber) {
            firestoreOrders = await getOrdersByPhoneNumber(userData.phoneNumber);
            console.log('Fetched orders by phone number:', firestoreOrders);
          }
        }

        // Map Firestore orders to UI format
        const mappedOrders = firestoreOrders.map(mapOrderForUI);
        setOrders(mappedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
        setOrders([]); // Clear orders on error instead of showing mock data
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userData]);

  if (selectedOrder) {
    return (
      <OrderDetails
        orderId={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'confirmed':
        return Package;
      case 'shipped':
      case 'out_for_delivery': // Add support for admin app status
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

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return {
          icon: 'bg-blue-50 text-blue-500',
          badge: 'bg-blue-50 text-blue-500'
        };
      case 'shipped':
      case 'out_for_delivery': // Add support for admin app status
        return {
          icon: 'bg-amber-50 text-amber-500',
          badge: 'bg-amber-50 text-amber-500'
        };
      case 'delivered':
        return {
          icon: 'bg-green-50 text-green-500',
          badge: 'bg-green-50 text-green-500'
        };
      case 'payment_pending':
        return {
          icon: 'bg-orange-50 text-orange-500',
          badge: 'bg-orange-50 text-orange-500'
        };
      case 'payment_failed':
        return {
          icon: 'bg-red-50 text-red-500',
          badge: 'bg-red-50 text-red-500'
        };
      default:
        return {
          icon: 'bg-gray-50 text-gray-500',
          badge: 'bg-gray-50 text-gray-500'
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <div className="sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <button
              onClick={() => {
                window.scrollTo(0, 0);
                onBack();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-2xl font-bold text-gray-800">My Orders</h1>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-gray-600">Loading your orders...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {!userData ? 'Please log in to view orders' : 'No orders yet'}
            </h3>
            <p className="text-gray-600">
              {!userData
                ? 'You need to be logged in to see your order history.'
                : 'Your order history will appear here once you place your first order.'
              }
            </p>
          </div>
        )}

        {/* Orders List */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.status);
              const statusStyle = getStatusStyle(order.status);

              return (
                <motion.div
                  key={`${order.firestoreId || order.id}-${index}`} // Use unique key combining ID and index
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedOrder(order.firestoreId || order.id)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
              <div className="p-5">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${statusStyle.icon} rounded-lg flex items-center justify-center`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Order #{order.id}</h3>
                      <p className="text-gray-500 text-sm">
                        {safeFormatDate(order.date, 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyle.badge}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                {/* Delivery Date */}
                {order.deliveryDate && order.status !== 'cancelled' && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
                    <p className="text-green-700 text-sm font-medium">
                      🚚 Expected delivery: {safeFormatDate(order.deliveryDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                )}

                {/* Items Section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {order.items && order.items.length > 0 && order.items.slice(0, 4).map((item, i) => (
                        <div
                          key={`item-${i}`}
                          className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm"
                        >
                          <img
                            src={item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkgyOFYyNEgxMlYxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE0IDE4SDE4VjIySDE0VjE4WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'}
                            alt={item.name || 'Product'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkgyOFYyNEgxMlYxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE0IDE4SDE4VjIySDE0VjE4WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                      ))}
                      {order.items && order.items.length > 4 && (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">+{order.items.length - 4}</span>
                        </div>
                      )}
                      {(!order.items || order.items.length === 0) && (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {order.items && order.items.length > 0
                          ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}`
                          : 'Order items'
                        }
                      </p>
                      <p className="text-gray-500 text-sm">
                        {order.items && order.items.length > 0
                          ? `${order.items.reduce((total, item) => total + item.quantity, 0)} items total`
                          : '0 items'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-bold text-2xl text-primary">₹{order.total}</p>
                    <p className="text-gray-500 text-sm">Total Amount</p>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="text-sm font-medium">View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}