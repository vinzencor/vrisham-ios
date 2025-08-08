import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  Star,
  Clock
} from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  month: string;
  revenue: number;
  orders: number;
}

export function BusinessOverview() {
  const metrics: Metric[] = [
    {
      label: 'Total Revenue',
      value: '₹1,25,000',
      change: 12.5,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600'
    },
    {
      label: 'Total Orders',
      value: '256',
      change: 8.2,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      label: 'Active Customers',
      value: '1,205',
      change: 15.3,
      icon: Users,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      label: 'Pending Deliveries',
      value: '48',
      change: -5.4,
      icon: Truck,
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  const recentOrders = [
    {
      id: 'ORD001',
      customer: 'John Doe',
      items: 3,
      total: '₹450',
      status: 'Processing',
      time: '10 mins ago'
    },
    {
      id: 'ORD002',
      customer: 'Jane Smith',
      items: 2,
      total: '₹280',
      status: 'Confirmed',
      time: '25 mins ago'
    },
    {
      id: 'ORD003',
      customer: 'Mike Johnson',
      items: 5,
      total: '₹890',
      status: 'Pending',
      time: '45 mins ago'
    }
  ];

  const topProducts = [
    {
      name: 'Organic Tomatoes',
      sales: '125 kg',
      revenue: '₹7,500',
      rating: 4.8
    },
    {
      name: 'Fresh Spinach',
      sales: '98 kg',
      revenue: '₹3,920',
      rating: 4.7
    },
    {
      name: 'Organic Toor Dal',
      sales: '156 kg',
      revenue: '₹18,720',
      rating: 4.9
    }
  ];

  const chartData: ChartData[] = [
    { month: 'Jan', revenue: 85000, orders: 180 },
    { month: 'Feb', revenue: 92000, orders: 195 },
    { month: 'Mar', revenue: 125000, orders: 256 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Business Overview</h1>
        <select className="px-4 py-2 border border-gray-200 rounded-lg bg-white">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${metric.color} rounded-xl flex items-center justify-center`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 ${
                metric.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{Math.abs(metric.change)}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-1">{metric.value}</h3>
            <p className="text-gray-600">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((data, index) => (
              <div key={data.month} className="flex-1">
                <div className="relative h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.revenue / 125000) * 100}%` }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                    className="absolute bottom-0 left-0 right-0 bg-primary/20 rounded-t-lg"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.orders / 256) * 100}%` }}
                    transition={{ delay: index * 0.2 + 0.2, duration: 0.5 }}
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                    style={{ width: '60%', marginLeft: '20%' }}
                  />
                </div>
                <div className="text-center mt-2">
                  <div className="text-sm font-medium text-gray-800">{data.month}</div>
                  <div className="text-xs text-gray-600">₹{(data.revenue / 1000).toFixed(1)}k</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 rounded-full" />
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-sm text-gray-600">Orders</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            <button className="text-primary font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-medium text-gray-800">{order.id}</span>
                  </div>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                  <p className="text-xs text-gray-500">{order.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">{order.total}</p>
                  <p className="text-sm text-gray-600">{order.items} items</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'Confirmed' ? 'bg-green-100 text-green-600' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Top Products</h2>
          <button className="text-primary font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Sales</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Revenue</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-800">{product.name}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{product.sales}</td>
                  <td className="py-3 px-4 text-gray-600">{product.revenue}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-gray-800">{product.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <Package className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-medium text-gray-800 mb-1">Add New Product</h3>
          <p className="text-sm text-gray-600">List a new product for sale</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <Users className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-medium text-gray-800 mb-1">Manage Farmers</h3>
          <p className="text-sm text-gray-600">Update farmer information</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <Clock className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-medium text-gray-800 mb-1">Schedule Harvest</h3>
          <p className="text-sm text-gray-600">Plan upcoming harvests</p>
        </motion.button>
      </div>
    </div>
  );
}