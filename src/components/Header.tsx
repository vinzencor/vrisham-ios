import React, { useState, useEffect } from 'react';
import { Menu, ShoppingBag, Search, User } from 'lucide-react';
import { SideMenu } from './SideMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();

  // Count the number of unique products in cart
  const totalItems = items.length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 will-change-transform ${
        isScrolled ? 'bg-white backdrop-blur-lg shadow-sm' : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-primary/15 hover:shadow-sm rounded-full transition-all"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <motion.img
                src="/image/logo.svg"
                alt="Vrisham Organic"
                className="h-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/categories')}
              className="p-2 hover:bg-primary/15 hover:shadow-sm rounded-full transition-all hidden md:flex"
            >
              <Search className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-primary/15 hover:shadow-sm rounded-full transition-all relative"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 10 }}
              >
                <ShoppingBag className="w-6 h-6 text-gray-800" />
              </motion.div>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-0 right-0 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center shadow-sm"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-primary/10 rounded-full transition-colors"
            >
              <User className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        </div>
      </div>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>
  );
}
