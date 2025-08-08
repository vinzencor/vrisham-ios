import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
}

export function LegalPage({ onBack }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <h1 className="font-display text-2xl font-bold text-gray-800">Legal</h1>
        </div>

        <div className="p-4 flex gap-2">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'terms'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Terms & Conditions
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'privacy' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Privacy Policy</h2>
                <p className="text-gray-600">Last updated: March 15, 2024</p>
              </div>
            </div>

            <div className="space-y-6 text-gray-600">
              <section>
                <h3 className="font-medium text-gray-800 mb-2">Information We Collect</h3>
                <p>
                  We collect information you provide directly to us, including your name, contact
                  information, delivery addresses, and order history. We also automatically collect
                  certain information about your device when you use our services.
                </p>
              </section>

              <section>
                <h3 className="font-medium text-gray-800 mb-2">How We Use Your Information</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>To process and deliver your orders</li>
                  <li>To communicate with you about your orders and our services</li>
                  <li>To personalize your shopping experience</li>
                  <li>To improve our services and develop new features</li>
                </ul>
              </section>

              <section>
                <h3 className="font-medium text-gray-800 mb-2">Information Sharing</h3>
                <p>
                  We do not sell your personal information. We share your information only with
                  service providers who assist us in operating our business and delivering your orders.
                </p>
              </section>

              <section>
                <h3 className="font-medium text-gray-800 mb-2">Data Security</h3>
                <p>
                  We implement appropriate technical and organizational measures to protect your
                  personal information against unauthorized access, alteration, or destruction.
                </p>
              </section>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Terms & Conditions</h2>
                <p className="text-gray-600">Last updated: March 15, 2024</p>
              </div>
            </div>

            <div className="space-y-6 text-gray-600">
              <section>
                <h3 className="font-medium text-gray-800 mb-2">Acceptance of Terms</h3>
                <p>
                  By accessing and using Vrisham Organic's services, you agree to be bound by these
                  Terms and Conditions and all applicable laws and regulations.
                </p>
              </section>

              <section>
                <h3 className="font-medium text-gray-800 mb-2">Order Acceptance and Pricing</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>All orders are subject to availability and confirmation of the order price</li>
                  <li>Prices for products are as quoted on our website</li>
                  <li>We reserve the right to refuse any order you place with us</li>
                </ul>
              </section>

              <section>
                <h3 className="font-medium text-gray-800 mb-2">Delivery</h3>
                <p>
                  Delivery times may vary depending on your location and product availability. We aim
                  to deliver pre-ordered farm produce within the specified harvest schedule.
                </p>
              </section>

              <section>
                <h3 className="font-medium text-gray-800 mb-2">Cancellation & Refunds</h3>
                <p>
                  Orders can be cancelled before confirmation. For confirmed orders, refund policies
                  vary based on the product type and delivery status.
                </p>
              </section>

              <section>
                <h3 className="font-medium text-gray-800 mb-2">User Accounts</h3>
                <p>
                  You are responsible for maintaining the confidentiality of your account information
                  and for all activities that occur under your account.
                </p>
              </section>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}