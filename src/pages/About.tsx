import { ArrowLeft, Leaf, Users, Award, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function About() {
  const navigate = useNavigate();

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
          <h1 className="text-xl font-semibold text-gray-800">About Us</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Leaf className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Vrisham Organic</h2>
            <p className="text-gray-600 text-lg">
              Bringing fresh, organic produce directly from farms to your table
            </p>
          </div>

          {/* Mission */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              At Vrisham Organic, we believe in providing the freshest, highest quality organic produce 
              while supporting local farmers and sustainable agriculture practices. Our mission is to 
              make healthy, organic food accessible to everyone while building a stronger connection 
              between consumers and the farmers who grow their food.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800">100% Organic</h4>
              <p className="text-gray-600 text-sm">
                All our products are certified organic and free from harmful chemicals
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Supporting Farmers</h4>
              <p className="text-gray-600 text-sm">
                We work directly with local farmers to ensure fair prices and sustainable practices
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Community First</h4>
              <p className="text-gray-600 text-sm">
                Building stronger communities through healthy food and sustainable practices
              </p>
            </div>
          </div>

          {/* Story */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Our Story</h3>
            <p className="text-gray-600 leading-relaxed">
              Founded with a vision to revolutionize how people access fresh, organic produce, 
              Vrisham Organic started as a small initiative to connect urban consumers with 
              rural farmers. Today, we're proud to serve thousands of families with the 
              freshest organic fruits, vegetables, and farm products.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our commitment to quality, sustainability, and community has made us a trusted 
              name in organic food delivery. We continue to grow our network of partner farms 
              and expand our product range while maintaining our core values of freshness, 
              quality, and sustainability.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
