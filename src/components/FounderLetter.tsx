import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Leaf, Heart, Users } from 'lucide-react';

export function FounderLetter() {
  return (
    <div className="px-4 py-16 bg-primary/5">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Quote className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Letter from Our Founder
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              We promise top-tier organic products, caring for both you and the planet. From farm to table, expect quality, sustainability, and your happiness.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
              <div className="bg-primary/5 rounded-xl p-6 text-center">
                <Leaf className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800 mb-1">100% Organic</h3>
                <p className="text-gray-600 text-sm">Certified natural farming</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-6 text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800 mb-1">1000+ Customers</h3>
                <p className="text-gray-600 text-sm">Trust our products daily</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800 mb-1">50+ Farmers</h3>
                <p className="text-gray-600 text-sm">In our growing community</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <div className="text-right">
                <h3 className="font-display text-2xl font-bold text-gray-800 mb-1">
                  Jana Sivathanu
                </h3>
                <p className="text-gray-600">Founder and CEO</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}