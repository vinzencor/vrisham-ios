import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export * from "./payment/razorpayWebhook";
export * from "./payment/orderManagement";
export * from "./payment/paymentVerification";
export * from "./orders/orderCleanup";
export * from "./orders/orderStatusUpdates";
