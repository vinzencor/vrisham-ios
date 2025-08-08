import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Payment verification function
export const verifyPaymentFunction = httpsCallable(functions, 'verifyPayment');

// Mark payment as failed function
export const markPaymentFailedFunction = httpsCallable(functions, 'markPaymentFailed');

// Create Razorpay order function
export const createRazorpayOrderFunction = httpsCallable(functions, 'createRazorpayOrder');

// Retry payment function
export const retryPaymentFunction = httpsCallable(functions, 'retryPayment');

// Get payment status function
export const getPaymentStatusFunction = httpsCallable(functions, 'getPaymentStatus');

// Manual order cleanup function (admin only)
export const manualOrderCleanupFunction = httpsCallable(functions, 'manualOrderCleanup');

// Get cleanup stats function (admin only)
export const getCleanupStatsFunction = httpsCallable(functions, 'getCleanupStats');

/**
 * Verify payment using Firebase Functions
 */
export const verifyPaymentViaFunction = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
}) => {
  try {
    const result = await verifyPaymentFunction(paymentData);
    return result.data;
  } catch (error) {
    console.error('Error verifying payment via function:', error);
    throw error;
  }
};

/**
 * Mark payment as failed using Firebase Functions
 */
export const markPaymentAsFailedViaFunction = async (data: {
  order_id: string;
  reason?: string;
}) => {
  try {
    const result = await markPaymentFailedFunction(data);
    return result.data;
  } catch (error) {
    console.error('Error marking payment as failed via function:', error);
    throw error;
  }
};

/**
 * Create Razorpay order using Firebase Functions
 */
export const createRazorpayOrderViaFunction = async (data: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, any>;
}) => {
  try {
    const result = await createRazorpayOrderFunction(data);
    return result.data;
  } catch (error) {
    console.error('Error creating Razorpay order via function:', error);
    throw error;
  }
};

/**
 * Retry payment using Firebase Functions
 */
export const retryPaymentViaFunction = async (data: {
  order_id: string;
}) => {
  try {
    const result = await retryPaymentFunction(data);
    return result.data;
  } catch (error) {
    console.error('Error retrying payment via function:', error);
    throw error;
  }
};

/**
 * Get payment status using Firebase Functions
 */
export const getPaymentStatusViaFunction = async (data: {
  order_id: string;
}) => {
  try {
    const result = await getPaymentStatusFunction(data);
    return result.data;
  } catch (error) {
    console.error('Error getting payment status via function:', error);
    throw error;
  }
};

/**
 * Manual order cleanup (admin only)
 */
export const performManualOrderCleanup = async (data: {
  hoursOld?: number;
}) => {
  try {
    const result = await manualOrderCleanupFunction(data);
    return result.data;
  } catch (error) {
    console.error('Error performing manual order cleanup:', error);
    throw error;
  }
};

/**
 * Get cleanup statistics (admin only)
 */
export const getCleanupStatistics = async () => {
  try {
    const result = await getCleanupStatsFunction();
    return result.data;
  } catch (error) {
    console.error('Error getting cleanup statistics:', error);
    throw error;
  }
};
