import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, MessageSquare, HelpCircle, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deactivateUserAccount } from '../../firebase/customAuth';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { currentUser, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    setIsDeactivating(true);

    try {
      // Deactivate the user account
      await deactivateUserAccount(currentUser.uid);

      // Sign out the user after deactivation
      await logout();

      // Close the confirmation dialog
      setShowDeleteConfirm(false);

      // Navigate back or show success message
      onBack();
    } catch (error) {
      console.error('Error deactivating account:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle feedback submission
    setShowFeedbackForm(false);
    setFeedback('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-white z-10">
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <button
            onClick={() => {
              window.scrollTo(0, 0);
              onBack();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-2xl font-bold text-gray-800">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowFeedbackForm(true)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-gray-800">Support & Feedback</span>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <span className="font-medium text-red-500">Deactivate Account</span>
          </div>
        </motion.button>

        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div className="text-sm text-gray-600">
              <p className="mb-2">Need help? Contact our support team:</p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => window.location.href = 'mailto:tech.vrisham@gmail.com'}
                  className="text-primary hover:underline text-left"
                >
                  tech.vrisham@gmail.com
                </button>
                <button
                  onClick={() => window.location.href = 'tel:9884058834'}
                  className="text-primary hover:underline text-left"
                >
                  +91 98840 58834
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Deactivate Account</h3>
                <p className="text-gray-600">
                  Your account will be deactivated. You can reactivate it by logging in again in the future.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeactivating}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    'Deactivate Account'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Form Modal */}
      <AnimatePresence>
        {showFeedbackForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Support & Feedback</h3>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How can we help you?
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your feedback or ask for support..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}