import React from 'react';
import { ClipboardCheck, Truck, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';

export function HowItWorks() {
  const steps = [
    {
      icon: ClipboardCheck,
      title: "1. Pre-order Your Produce",
      description: "Select your fresh produce & secure your slot for the next harvest"
    },
    {
      icon: Sprout,
      title: "2. We Harvest for You",
      description: "Our farmers harvest your order fresh from the fields"
    },
    {
      icon: Truck,
      title: "3. Farm to Door Delivery",
      description: "Receive farm-fresh produce at your doorstep"
    }
  ];

  return (
    <div id="how-it-works" className="px-4 py-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From farm to your table in three simple steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline Line - Hidden on mobile, visible on desktop */}
          <div className="absolute hidden md:block left-1/2 top-0 bottom-0 w-0.5 bg-primary/20" />

          <div className="space-y-10 md:space-y-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30, x: 0 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`flex flex-col md:flex-row ${
                  index % 2 ? 'md:flex-row-reverse' : ''
                } items-center md:gap-8 bg-white rounded-xl p-4 md:p-0 shadow-sm md:shadow-none`}
              >
                {/* Mobile layout - Icon on top, text below */}
                <div className="md:hidden w-full flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center z-10 relative">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-xl mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>

                {/* Desktop layout - Text and icon in a row */}
                <div className="hidden md:block flex-1 text-left">
                  <h3 className="font-medium text-xl mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>

                <div className="hidden md:block relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center z-10 relative">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
                </div>

                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}