import { ArrowLeft, FileText, Shield, CreditCard, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Terms() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "Privacy & Data Protection",
      content: [
        "We collect and use your personal information only for providing our services",
        "Your data is protected with industry-standard security measures",
        "We do not share your information with third parties without consent",
        "You can request deletion of your data at any time"
      ]
    },
    {
      icon: CreditCard,
      title: "Payment Terms",
      content: [
        "All prices are inclusive of applicable taxes",
        "Payment is required at the time of order placement",
        "Refunds will be processed within 5-7 business days",
        "We accept all major payment methods and digital wallets"
      ]
    },
    {
      icon: Truck,
      title: "Delivery Policy",
      content: [
        "Delivery times are estimates and may vary due to external factors",
        "We deliver fresh products within 24-48 hours of harvest",
        "Delivery charges apply for orders below minimum value",
        "We are not responsible for delays due to weather or traffic conditions"
      ]
    }
  ];

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
          <h1 className="text-xl font-semibold text-gray-800">Terms & Conditions</h1>
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
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Terms & Conditions</h2>
            <p className="text-gray-600 text-lg">
              Please read these terms carefully before using our services
            </p>
          </div>

          {/* Last Updated */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-600">
              <strong>Last Updated:</strong> January 2025
            </p>
          </div>

          {/* Introduction */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Introduction</h3>
            <p className="text-gray-600 leading-relaxed">
              Welcome to Vrisham Organic. By using our services, you agree to comply with and be bound by the following terms and conditions. Please review these terms carefully. If you do not agree to these terms, you should not use our services.
            </p>
          </div>

          {/* Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Additional Terms */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Additional Terms</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Product Quality</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We strive to provide the highest quality organic products. However, as these are natural products, slight variations in appearance, size, and taste are normal and do not constitute a defect.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Order Modifications</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Orders can be modified or cancelled within 2 hours of placement. After this time, orders enter our preparation process and cannot be changed.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Limitation of Liability</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our liability is limited to the value of the products purchased. We are not responsible for any indirect, incidental, or consequential damages.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-primary/5 rounded-2xl p-6 text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Questions about our terms?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about these terms and conditions, please contact us.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
