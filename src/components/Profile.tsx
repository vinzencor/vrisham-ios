import React, { useState, useEffect } from 'react';
import { User as UserIcon, MapPin, ShoppingBag, Settings, LogOut, ChevronRight, Phone, Shield, Edit, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthModal } from './profile/AuthModal';
import { MyOrders } from './profile/MyOrders';
import { AddressBook } from './profile/AddressBook';
import { SettingsPage } from './profile/SettingsPage';
import { LegalPage } from './profile/LegalPage';
import { EditProfile } from './profile/EditProfile';
import { useAuth } from '../contexts/AuthContext';
import { getOrdersByCustomer, getOrdersByPhoneNumber } from '../firebase/orders';

export function Profile() {
  const { isAuthenticated, userData, logout, refreshUserData, isLoading, getUserPhoneNumber } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'orders' | 'addresses' | 'settings' | 'legal' | 'edit-profile'>('main');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real data counts
  const [orderCount, setOrderCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Show auth modal when user is not authenticated OR when authenticated but has no userData (new user)
  useEffect(() => {
    console.log('=== PROFILE: Auth state check ===', {
      isAuthenticated,
      isLoading,
      hasUserData: !!userData,
      userData: userData ? { uid: userData.uid, displayName: userData.displayName } : null
    });

    if (!isAuthenticated && !isLoading) {
      console.log('=== PROFILE: User not authenticated, showing auth modal ===');
      setShowAuthModal(true);
    } else if (isAuthenticated && !isLoading && !userData) {
      // User is authenticated but has no profile data - they need to complete registration
      console.log('=== PROFILE: Authenticated user with no profile data detected - showing auth modal for profile completion ===');
      setShowAuthModal(true);
    } else if (isAuthenticated && userData) {
      console.log('=== PROFILE: User authenticated with profile data, hiding auth modal ===');
      setShowAuthModal(false);
    }
  }, [isAuthenticated, userData, isLoading]);

  // Fetch real counts when user data is available
  useEffect(() => {
    const fetchCounts = async () => {
      if (!userData) {
        setOrderCount(0);
        setActiveOrderCount(0);
        setAddressCount(0);
        return;
      }

      setLoadingCounts(true);

      try {
        // Fetch address count from user data
        const addresses = userData.listOfAddress || [];
        setAddressCount(addresses.length);

        // Fetch orders count
        let orders = [];
        try {
          orders = await getOrdersByCustomer(userData.uid);
        } catch (customerError) {
          console.log('Failed to fetch by customer ID, trying phone number:', customerError);
          const phoneNumber = getUserPhoneNumber();
          if (phoneNumber) {
            orders = await getOrdersByPhoneNumber(phoneNumber);
          }
        }

        setOrderCount(orders.length);

        // Count active orders (not delivered or cancelled)
        const activeOrders = orders.filter(order =>
          order.status &&
          !['delivered', 'cancelled', 'completed'].includes(order.status.toLowerCase())
        );
        setActiveOrderCount(activeOrders.length);

        console.log('Profile counts updated:', {
          totalOrders: orders.length,
          activeOrders: activeOrders.length,
          addresses: addresses.length
        });
      } catch (error) {
        console.error('Error fetching profile counts:', error);
        // Keep existing counts on error
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCounts();
  }, [userData]);

  // Handle manual refresh of user data
  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    setError(null);

    try {
      await refreshUserData();
      console.log('User data refreshed');
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Failed to refresh profile data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowAuthModal(true);
  };

  const menuItems = [
    {
      icon: Edit,
      label: 'Edit Profile',
      action: () => {
        window.scrollTo(0, 0);
        setCurrentView('edit-profile');
      }
    },
    {
      icon: ShoppingBag,
      label: 'My Orders',
      count: orderCount,
      action: () => {
        window.scrollTo(0, 0);
        setCurrentView('orders');
      }
    },
    {
      icon: MapPin,
      label: 'Delivery Addresses',
      count: addressCount,
      action: () => {
        window.scrollTo(0, 0);
        setCurrentView('addresses');
      }
    },
    {
      icon: Settings,
      label: 'Settings',
      action: () => {
        window.scrollTo(0, 0);
        setCurrentView('settings');
      }
    },
    {
      icon: Shield,
      label: 'Legal',
      action: () => {
        window.scrollTo(0, 0);
        setCurrentView('legal');
      }
    }
  ];

  if (currentView === 'orders') return <MyOrders onBack={() => setCurrentView('main')} />;
  if (currentView === 'addresses') return <AddressBook onBack={() => setCurrentView('main')} />;
  if (currentView === 'settings') return <SettingsPage onBack={() => setCurrentView('main')} />;
  if (currentView === 'legal') return <LegalPage onBack={() => setCurrentView('main')} />;
  if (currentView === 'edit-profile') return <EditProfile onBack={() => setCurrentView('main')} />;

  return (
    <div className="min-h-screen bg-background p-4">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={async () => {
          setShowAuthModal(false);
          // Refresh user data after successful authentication/registration
          try {
            await refreshUserData();
          } catch (error) {
            console.error('Error refreshing user data after auth success:', error);
          }
        }}
      />

      {!isAuthenticated ? null : (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-white z-10">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h1 className="font-display text-2xl font-bold text-gray-800">Profile</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                aria-label="Refresh profile data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto p-4 md:py-8">
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
                    onClick={handleRefresh}
                    className="text-sm underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}

            {/* Loading state */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-gray-600">Loading profile data...</p>
              </div>
            ) : !userData ? (
              <div className="bg-yellow-50 p-6 rounded-2xl mb-6">
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">Profile data not available</h3>
                  <p className="text-yellow-700 mb-4">We couldn't load your profile information.</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    Refresh Profile
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary/90 to-primary rounded-2xl p-6 md:p-8 shadow-lg mb-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                      <UserIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>
                    <div>
                      <h2 className="text-white text-2xl md:text-3xl font-semibold mb-2">{userData.displayName || 'User'}</h2>
                      <div className="flex items-center gap-2 text-white/80">
                        <Phone className="w-4 h-4" />
                        <span className="text-lg">{getUserPhoneNumber() || 'No phone number'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
                      <div className="text-3xl font-semibold text-white mb-1">
                        {loadingCounts ? '...' : orderCount}
                      </div>
                      <div className="text-sm text-white/80">Orders Placed</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
                      <div className="text-3xl font-semibold text-white mb-1">
                        {loadingCounts ? '...' : activeOrderCount}
                      </div>
                      <div className="text-sm text-white/80">Active Orders</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoading && userData && (
              <div className="grid gap-4 md:gap-6">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-5 md:p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium text-lg text-gray-800">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {item.count !== undefined && item.count > 0 && (
                        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                          {loadingCounts ? '...' : item.count}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.button>
                ))}

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: menuItems.length * 0.1 }}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 p-5 md:p-6 bg-red-50 rounded-2xl text-red-500 hover:bg-red-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-lg">Logout</span>
                </motion.button>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-8">
              App Version 1.0.0
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
