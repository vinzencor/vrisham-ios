// Razorpay service for handling payment operations
// This file contains client-side Razorpay integration

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentOptions {
  amount: number;
  currency?: string;
  receipt: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

// API base URL - adjust based on your deployment
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.vercel.app/api'
  : '/api';

// Feature flag to use Firebase Functions instead of Vercel API
const USE_FIREBASE_FUNCTIONS = import.meta.env.VITE_USE_FIREBASE_FUNCTIONS === 'true';

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order via API or Firebase Functions
 */
export const createRazorpayOrder = async (
  amount: number,
  receipt: string
): Promise<RazorpayOrder> => {
  try {
    if (USE_FIREBASE_FUNCTIONS) {
      // Use Firebase Functions
      const { createRazorpayOrderViaFunction } = await import('./firebaseFunctions');
      const result = await createRazorpayOrderViaFunction({
        amount,
        currency: 'INR',
        receipt,
      });

      if (!result.success) {
        throw new Error(result.error || 'Order creation failed');
      }

      return result.order;
    } else {
      // Use Vercel API
      const response = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      if (!data.success) {
        throw new Error(data.error || 'Order creation failed');
      }

      return data.order;
    }
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify payment via API or Firebase Functions
 */
export const verifyPayment = async (
  paymentResponse: RazorpayPaymentResponse,
  orderId?: string
): Promise<any> => {
  try {
    if (USE_FIREBASE_FUNCTIONS && orderId) {
      // Use Firebase Functions
      const { verifyPaymentViaFunction } = await import('./firebaseFunctions');
      const result = await verifyPaymentViaFunction({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        order_id: orderId,
      });

      return result;
    } else {
      // Use Vercel API
      const response = await fetch(`${API_BASE_URL}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentResponse),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      return data;
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Initialize and open Razorpay checkout
 */
export const initiatePayment = async (
  options: PaymentOptions,
  orderId?: string
): Promise<PaymentResult> => {
  try {
    // Load Razorpay script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Create order
    const order = await createRazorpayOrder(options.amount, options.receipt);

    return new Promise((resolve) => {
      const razorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Vrisham Organic',
        description: options.description || 'Order Payment',
        order_id: order.id,
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            // Verify payment (pass orderId for Firebase Functions)
            await verifyPayment(response, orderId);

            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
          } catch (error) {
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Payment verification failed',
            });
          }
        },
        prefill: {
          name: options.customerName,
          email: options.customerEmail || '',
          contact: options.customerPhone,
        },
        theme: {
          color: '#10B981', // Your primary color
        },
        modal: {
          ondismiss: () => {
            resolve({
              success: false,
              error: 'Payment cancelled by user',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initialization failed',
    };
  }
};
