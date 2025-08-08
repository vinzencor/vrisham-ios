import { ArrowLeft, Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Contact() {
  const navigate = useNavigate();

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      value: '+91 98840 58834',
      description: 'Call us for immediate assistance'
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'tech.vrisham@gmail.com',
      description: 'Send us your queries anytime'
    },
    {
      icon: MapPin,
      title: 'Address',
      value: '10a, 200 Feet Radial Rd, S. Kolathur, to, Thoraipakkam, Chennai, Tamil Nadu 600129',
      description: 'Our main distribution center'
    },
    {
      icon: Clock,
      title: 'Hours',
      value: '9 AM to 6 PM',
      description: 'Monday to Sunday'
    }
  ];

  const handleCallSupport = () => {
    window.location.href = 'tel:9884058834';
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:tech.vrisham@gmail.com';
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
          <h1 className="text-xl font-semibold text-gray-800">Contact Us</h1>
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
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Get in Touch</h2>
            <p className="text-gray-600 text-lg">
              We're here to help! Reach out to us for any questions or support.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 space-y-4"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-lg font-medium text-gray-900 mb-1">{item.value}</p>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {/* Add clickable functionality for phone and email */}
                {item.title === 'Phone' && (
                  <button
                    onClick={handleCallSupport}
                    className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Call Now
                  </button>
                )}
                {item.title === 'Email' && (
                  <button
                    onClick={handleEmailSupport}
                    className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Send Email
                  </button>
                )}
              </motion.div>
            ))}
          </div>



          {/* FAQ Link */}
          <div className="bg-blue-50 rounded-2xl p-6 text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Looking for quick answers?</h3>
            <p className="text-gray-600 mb-4">
              Check out our frequently asked questions for instant help.
            </p>
            <button
              onClick={() => navigate('/faq')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View FAQ
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
