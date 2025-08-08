import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Truck, Calendar, MapPin, ArrowRight, Clock, Package, Ticket, MessageCircle, Printer } from 'lucide-react';
import { getDeliveryInfoForItem } from '../firebase/products';
import { formatPrice, safeMultiply, ensureSafeNumber } from '../utils/numberUtils';

export function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    orderId,
    orderNumber,
    total,
    deliveryPreference,
    paymentMethod,
    address,
    items,
    coupon,
    couponDiscount,
    deliveryDate,
    deliveryLabel
  } = location.state || {};

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }
  }, [location.state, navigate]);

  if (!location.state) return null;

  // Use delivery date passed from checkout or fallback to calculation
  const getDeliveryInfo = () => {
    if (deliveryDate && deliveryLabel) {
      // Use the delivery date and label passed from checkout
      return {
        date: new Date(deliveryDate),
        label: deliveryLabel
      };
    } else {
      // Fallback to calculation (for backward compatibility)
      console.warn('No delivery date passed from checkout, falling back to calculation');
      return getDeliveryInfoForItem('in-stock');
    }
  };

  const deliveryInfo = getDeliveryInfo();
  const deliveryDateFormatted = deliveryInfo.date && deliveryInfo.date instanceof Date && !isNaN(deliveryInfo.date.getTime())
    ? deliveryInfo.date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Date not available';

  console.log('Success page delivery info:', {
    label: deliveryInfo.label,
    date: deliveryInfo.date,
    formatted: deliveryDateFormatted,
    source: deliveryDate ? 'passed from checkout' : 'calculated fallback'
  });

  // Generate invoice HTML for printing
  const generateInvoiceHTML = () => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - Order ${orderNumber || orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 5px; }
          .company-info { font-size: 12px; color: #666; margin: 10px 0; }
          .invoice-title { font-size: 20px; margin-top: 15px; }
          .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .order-info div { flex: 1; }
          .customer-info { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; table-layout: fixed; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; word-wrap: break-word; }
          .items-table th { background-color: #f8f9fa; font-weight: bold; }
          .items-table .item-col { width: 40%; }
          .items-table .unit-col { width: 15%; }
          .items-table .qty-col { width: 15%; }
          .items-table .price-col { width: 15%; }
          .items-table .total-col { width: 15%; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 8px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { margin: 0; } }
          @media (max-width: 768px) {
            .order-info { flex-direction: column; gap: 15px; }
            .items-table th, .items-table td { padding: 6px; font-size: 12px; }
            .company-name { font-size: 20px; }
            .invoice-title { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Vrisham</div>
          <div class="company-info">
            10a, 200 Feet Radial Rd, S. Kolathur, to, Thoraipakkam, Chennai, Tamil Nadu 600129<br>
            Phone: +91 98840 58834 | Email: tech.vrisham@gmail.com
          </div>
          <div class="invoice-title">INVOICE</div>
        </div>

        <div class="order-info">
          <div>
            <strong>Order ID:</strong> ${orderNumber || orderId}<br>
            <strong>Date:</strong> ${formatDate(new Date().toISOString())}<br>
            <strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'CASH ON DELIVERY' : paymentMethod?.toUpperCase() || 'ONLINE'}<br>
            <strong>Delivery:</strong> ${deliveryInfo.label || 'Standard Delivery'}
          </div>
        </div>

        ${address ? `
        <div class="customer-info">
          <strong>Delivery Address:</strong><br>
          ${address.name}<br>
          ${address.address}<br>
          ${address.pincode}<br>
          ${address.phone ? 'Phone: ' + address.phone : ''}
        </div>
        ` : ''}

        ${items && items.length > 0 ? `
        <table class="items-table">
          <thead>
            <tr>
              <th class="item-col">Item</th>
              <th class="unit-col">Unit</th>
              <th class="qty-col">Qty</th>
              <th class="price-col">Price</th>
              <th class="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="item-col">
                  <strong>${item.name}</strong><br>
                  <small style="color: #666;">${item.nameTamil || ''}</small>
                </td>
                <td class="unit-col">${item.unit}</td>
                <td class="qty-col">${item.quantity}</td>
                <td class="price-col">₹${ensureSafeNumber(item.price).toFixed(2)}</td>
                <td class="total-col">₹${safeMultiply(ensureSafeNumber(item.price), ensureSafeNumber(item.quantity)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="total-section">
          ${coupon && couponDiscount > 0 ? `
          <div class="total-row">
            <span>Coupon Discount (${coupon.code}):</span>
            <span>-₹${ensureSafeNumber(couponDiscount).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row final">
            <span>Total Amount:</span>
            <span>₹${ensureSafeNumber(total).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Vrisham Organic!</p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </body>
      </html>
    `;
    return invoiceHTML;
  };

  // Print invoice function
  const handlePrintInvoice = () => {
    try {
      const invoiceHTML = generateInvoiceHTML();
      const printWindow = window.open('', '_blank', 'width=800,height=600');

      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
          // Close the window after printing (optional)
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        };
      } else {
        alert('Please allow popups to print the invoice.');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Failed to print invoice. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-2">
            Thank you for shopping with Vrisham Organic
          </p>
          {orderNumber && !isNaN(orderNumber) && (
            <p className="text-sm text-gray-500">
              Order #{ensureSafeNumber(orderNumber)}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-lg">Order Status</h2>
              <p className="text-gray-600">
                {paymentMethod === 'cod' ? 'Order placed successfully' : 'Payment received'}
              </p>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">{deliveryInfo.label || 'Delivery scheduled'}</span>
            </div>
            <p className="text-sm text-green-600">
              Expected delivery: {deliveryDateFormatted}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-t border-dashed">
              <span className="text-gray-600">Order Amount</span>
              <span className="font-medium">{formatPrice(ensureSafeNumber(total))}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-dashed">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">
                {paymentMethod === 'cod' ? 'Cash on Delivery' :
                 paymentMethod === 'upi' ? 'UPI Payment' :
                 paymentMethod === 'card' ? 'Card Payment' : 'Online Payment'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Ordered Items */}
        {items && items.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-medium text-lg">Items Ordered</h2>
                <p className="text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} in your order</p>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 ${
                    index !== items.length - 1 ? 'mb-2' : ''
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                    <p className="text-gray-500 text-xs">{item.nameTamil}</p>
                    <p className="text-gray-600 text-sm">
                      {item.quantity} {item.unit} × {formatPrice(ensureSafeNumber(item.price))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      {formatPrice(safeMultiply(ensureSafeNumber(item.price), ensureSafeNumber(item.quantity)))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Coupon Information */}
        {coupon && couponDiscount > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-medium text-lg text-green-800">Coupon Applied</h2>
                <p className="text-green-600">You saved {formatPrice(ensureSafeNumber(couponDiscount))} on this order!</p>
              </div>
            </div>

            <div className="p-3 bg-green-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">{coupon.code}</p>
                  {coupon.description && (
                    <p className="text-sm text-green-600">{coupon.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-800">-{formatPrice(ensureSafeNumber(couponDiscount))}</p>
                  <p className="text-xs text-green-600">
                    {coupon.type === 'FLAT' ? 'Flat discount' : `${coupon.percent}% off`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-lg">Delivery Address</h2>
              <p className="text-gray-600">{address.name}</p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600">{address.address}</p>
            <p className="text-gray-600">{address.pincode}</p>
            <p className="text-gray-600">{address.phone}</p>
          </div>
        </motion.div>

        {/* WhatsApp Confirmation Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <div>
              <span className="font-medium text-green-800">WhatsApp Confirmation Sent</span>
              <p className="text-sm text-green-700 mt-1">
                We've sent you order updates on WhatsApp for easy tracking.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="flex-1 py-4 bg-white border-2 border-primary text-primary rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handlePrintInvoice}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              View All Orders
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}