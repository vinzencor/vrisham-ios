import React from 'react';
import { Home, Layers, ShoppingCart, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();

  // Count the number of unique products in cart
  const totalItems = items.length;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/categories', icon: Layers, label: 'Categories' },
    { path: '/cart', icon: ShoppingCart, label: 'Cart', badge: totalItems > 0 ? totalItems : null },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 py-2 bg-white backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]">
      <nav className="w-full max-w-lg mx-auto">
        <div className="flex justify-around items-center relative">
          {/* Background Indicator */}
          <div className="absolute inset-x-0 h-full">
            {navItems.map((item, index) => (
              isActive(item.path) && (
                <motion.div
                  key={item.path}
                  layoutId="navBackground"
                  className="absolute w-1/4 h-full flex items-center justify-center"
                  style={{ left: `${index * 25}%` }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className="w-12 h-12 bg-primary/15 rounded-full shadow-md" />
                </motion.div>
              )
            ))}
          </div>

          {/* Nav Items */}
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex-1 flex flex-col items-center py-2"
              >
                <div className="relative">
                  <item.icon
                    className={`w-6 h-6 relative z-10 transition-colors ${
                      active ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  />
                  {item.badge && (
                    <motion.span
                      key={item.badge}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center z-20 shadow-sm"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </div>
                <span className={`text-xs mt-1 transition-colors ${
                  active ? 'text-primary font-medium' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>

                {/* Underline Indicator */}
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute bottom-0 w-8 h-1 bg-primary rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}