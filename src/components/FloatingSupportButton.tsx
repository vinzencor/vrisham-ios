import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCallSupport = () => {
    window.location.href = 'tel:9884058834';
    setIsOpen(false);
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:tech.vrisham@gmail.com';
    setIsOpen(false);
  };

  const handleContactPage = () => {
    navigate('/contact');
    setIsOpen(false);
  };

  const supportOptions = [
    {
      icon: Phone,
      label: 'Call Support',
      description: 'Get immediate help',
      action: handleCallSupport,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Mail,
      label: 'Email Support',
      description: 'Send us a message',
      action: handleEmailSupport,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: MessageCircle,
      label: 'Contact Page',
      description: 'View all options',
      action: handleContactPage,
      color: 'bg-primary hover:bg-primary/90'
    }
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotate: isOpen ? 180 : 0,
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <HelpCircle className="w-6 h-6" />
        )}
      </motion.button>

      {/* Support Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-40 right-4 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-3 min-w-[200px]">
              <div className="text-center mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">Need Help?</h3>
                <p className="text-xs text-gray-600">Choose how to contact us</p>
              </div>
              
              {supportOptions.map((option, index) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={option.action}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-white transition-colors ${option.color}`}
                >
                  <option.icon className="w-4 h-4 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-90">{option.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-20"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
