// Test utilities for Razorpay integration
// This file can be used to test the payment flow in development

import { initiatePayment, PaymentOptions, PaymentResult } from '../services/razorpay';

/**
 * Test payment with sample data
 */
export const testPayment = async (): Promise<void> => {
  const testOptions: PaymentOptions = {
    amount: 100, // ₹100 for testing
    receipt: `test_${Date.now()}`,
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '9999999999',
    description: 'Test payment for Razorpay integration',
  };

  try {
    console.log('Starting test payment with options:', testOptions);
    
    const result: PaymentResult = await initiatePayment(testOptions);
    
    if (result.success) {
      console.log('✅ Test payment successful!', {
        paymentId: result.paymentId,
        orderId: result.orderId,
        signature: result.signature,
      });
    } else {
      console.log('❌ Test payment failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test payment error:', error);
  }
};

/**
 * Validate Razorpay configuration
 */
export const validateRazorpayConfig = (): boolean => {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  
  if (!keyId) {
    console.error('❌ VITE_RAZORPAY_KEY_ID is not configured');
    return false;
  }
  
  if (!keyId.startsWith('rzp_')) {
    console.error('❌ Invalid Razorpay Key ID format. Should start with "rzp_"');
    return false;
  }
  
  console.log('✅ Razorpay configuration is valid');
  console.log('Key ID:', keyId);
  
  return true;
};

/**
 * Test API endpoints availability
 */
export const testAPIEndpoints = async (): Promise<void> => {
  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.vercel.app/api' 
    : '/api';

  try {
    // Test create-order endpoint
    console.log('Testing create-order endpoint...');
    const createOrderResponse = await fetch(`${baseURL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1,
        receipt: 'test_receipt',
      }),
    });
    
    if (createOrderResponse.ok) {
      console.log('✅ create-order endpoint is working');
    } else {
      console.log('❌ create-order endpoint failed:', createOrderResponse.status);
    }
  } catch (error) {
    console.error('❌ API endpoint test failed:', error);
  }
};

// Export test functions for use in development
if (process.env.NODE_ENV === 'development') {
  // Make test functions available globally for console testing
  (window as any).testRazorpay = {
    testPayment,
    validateConfig: validateRazorpayConfig,
    testAPI: testAPIEndpoints,
  };
  
  console.log('🧪 Razorpay test utilities loaded. Use window.testRazorpay in console.');
}
