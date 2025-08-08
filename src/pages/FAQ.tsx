import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function FAQ() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData = [
    {
      question: "What makes your products organic?",
      answer: "All our products are certified organic by recognized certification bodies. We work directly with farmers who follow strict organic farming practices without the use of synthetic pesticides, fertilizers, or GMOs."
    },
    {
      question: "How fresh are the products when delivered?",
      answer: "Our products are harvested within 24-48 hours before delivery. We maintain a cold chain throughout the process to ensure maximum freshness and nutritional value."
    },
    {
      question: "What are your delivery areas?",
      answer: "We currently deliver across Bangalore and surrounding areas. We're constantly expanding our delivery network to serve more locations."
    },
    {
      question: "How do I track my order?",
      answer: "Once your order is confirmed, you'll receive a tracking link via SMS and email. You can also check your order status in the app under 'My Orders'."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 100% satisfaction guarantee. If you're not happy with the quality of any product, contact us within 24 hours of delivery for a full refund or replacement."
    },
    {
      question: "Do you offer subscription services?",
      answer: "Yes! You can set up weekly or monthly subscriptions for your favorite products. This ensures regular delivery and often comes with discounted prices."
    },
    {
      question: "How do you ensure product quality?",
      answer: "We have a rigorous quality control process. Each batch is inspected by our quality team, and we maintain proper storage conditions throughout the supply chain."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major payment methods including credit/debit cards, UPI, net banking, and cash on delivery (where available)."
    },
    {
      question: "Can I modify or cancel my order?",
      answer: "You can modify or cancel your order within 2 hours of placing it. After that, the order goes into preparation and cannot be changed."
    },
    {
      question: "Do you have minimum order requirements?",
      answer: "We have a minimum order value of ₹299 for free delivery. Orders below this amount will have a small delivery charge."
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">FAQ</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <HelpCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-lg">
              Find answers to common questions about our products and services
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-gray-800 pr-4">{item.question}</span>
                  {openItems.includes(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                
                <AnimatePresence>
                  {openItems.includes(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="bg-primary/5 rounded-2xl p-6 text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
