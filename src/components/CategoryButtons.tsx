import React from 'react';
import { Carrot, Apple, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CategoryButtons() {
  const navigate = useNavigate();

  // Map homepage category labels to database category names/patterns
  const categoryMappings = {
    'vegetables': 'Vegetable', // Maps to "Vegetable" category in database
    'fruits': 'Fresh Fruits', // Maps to "Fresh Fruits" category in database
    'staples': 'Organic Staples' // Maps to "Organic Staples" category in database
  };

  const categories = [
    {
      id: 'vegetables',
      name: 'Farm-Fresh Vegetables',
      icon: Carrot,
      description: 'Organic vegetables harvested daily',
      color: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      id: 'fruits',
      name: 'Farm-Fresh Fruits',
      icon: Apple,
      description: 'Sweet and juicy seasonal fruits',
      color: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      id: 'staples',
      name: 'Organic Staples',
      icon: Coffee,
      description: 'Essential groceries and spices',
      color: 'bg-amber-50',
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="px-4 pt-4 pb-8 md:pt-6 md:pb-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of organic products, from farm-fresh produce to daily essentials
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              onClick={() => navigate(`/categories?categoryFilter=${category.id}`)}
              className={`group relative overflow-hidden rounded-2xl ${category.color} p-6 text-left transition-all hover:shadow-lg`}
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-white/20 blur-2xl transform group-hover:scale-150 transition-transform" />

              <div className="relative">
                <div className={`w-16 h-16 rounded-xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className={`w-8 h-8 ${category.iconColor}`} />
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600">
                  {category.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}