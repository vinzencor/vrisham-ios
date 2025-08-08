import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MyOrders } from '../components/profile/MyOrders';

export function Orders() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Navigate back to the previous page or home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Custom header for standalone orders page */}
      <div className="sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display text-2xl font-bold text-gray-800">My Orders</h1>
        </div>
      </div>

      {/* Use the existing MyOrders component without its own header */}
      <div className="pt-0">
        <MyOrders onBack={handleBack} showHeader={false} />
      </div>
    </div>
  );
}
