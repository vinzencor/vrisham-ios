import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Clock,
  Leaf,
  CircleDollarSign,
  Heart,
  ArrowRight,
  Star,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BusinessOverview() {
  const navigate = useNavigate();

  const metrics = [
    {
      label: 'Total Orders',
      value: '12',
      icon: ShoppingBag,
      color: 'bg-primary/10 text-primary'
    },
    {
      label: 'Active Orders',
      value: '2',
      icon: Clock,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      label: 'Total Savings',
      value: '₹450',
      icon: CircleDollarSign,
      color: 'bg-green-50 text-green-600'
    },
    {
      label: 'Organic Impact',
      value: '24 kg',
      icon: Leaf,
      color: 'bg-secondary/10 text-secondary'
    }
  ];

  const recentOrders = [
    {
      id: 'ORD001',
      date: 'March 15, 2024',
      items: [
        {
          name: 'Organic Tomatoes',
          quantity: '2 kg',
          image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'
        },
        {
          name: 'Fresh Spinach',
          quantity: '1 kg',
          image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800'
        }
      ],
      total: '₹160',
      status: 'Confirmed'
    },
    {
      id: 'ORD002',
      date: 'March 10, 2024',
      items: [
        {
          name: 'Organic Toor Dal',
          quantity: '2 kg',
          image: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=800'
        }
      ],
      total: '₹240',
      status: 'Delivered'
    }
  ];

  const favoriteProducts = [
    {
      name: 'Organic Tomatoes',
      purchaseCount: 5,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Fresh Spinach',
      purchaseCount: 4,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800'
    },
    {
      name: 'Organic Toor Dal',
      purchaseCount: 3,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <div className={`w-10 h-10 ${metric.color} rounded-xl flex items-center justify-center mb-3`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">{metric.value}</h3>
            <p className="text-sm text-gray-600">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-primary font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-medium text-gray-800">{order.id}</span>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  order.status === 'Delivered'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex -space-x-3">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    {order.items.map(item => item.name).join(', ')}
                  </p>
                  <p className="text-xs text-gray-500">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">{order.total}</p>
                  <p className="text-sm text-gray-600">{order.items.length} items</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Favorite Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Frequently Bought</h2>
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favoriteProducts.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative group cursor-pointer"
              onClick={() => navigate(`/product/${index + 1}`)}
            >
              <div className="aspect-square rounded-xl overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-white font-medium mb-1">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-sm">{product.rating}</span>
                  </div>
                  <span className="text-white/90 text-sm">
                    Bought {product.purchaseCount} times
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Impact Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 rounded-xl p-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Your Organic Impact</h2>
            <p className="text-gray-600">Supporting sustainable farming</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-primary/20 rounded-xl p-3 text-center shadow-sm hover:shadow-primary/10">
            <div className="text-xl font-semibold text-primary mb-1">24 kg</div>
            <div className="text-sm text-gray-600">Organic Produce</div>
          </div>
          <div className="bg-white border border-primary/20 rounded-xl p-3 text-center shadow-sm hover:shadow-primary/10">
            <div className="text-xl font-semibold text-primary mb-1">12</div>
            <div className="text-sm text-gray-600">Orders</div>
          </div>
          <div className="bg-white border border-primary/20 rounded-xl p-3 text-center shadow-sm hover:shadow-primary/10">
            <div className="text-xl font-semibold text-primary mb-1">5</div>
            <div className="text-sm text-gray-600">Farmers Supported</div>
          </div>
          <div className="bg-white border border-primary/20 rounded-xl p-3 text-center shadow-sm hover:shadow-primary/10">
            <div className="text-xl font-semibold text-primary mb-1">₹450</div>
            <div className="text-sm text-gray-600">Total Savings</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}