"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatus = exports.retryPayment = exports.createRazorpayOrder = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
/**
 * Create Razorpay order for payment
 */
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
    var _a;
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to create payment order");
    }
    const { amount, currency = "INR", receipt, notes } = data;
    // Validate required fields
    if (!amount || !receipt) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: amount and receipt");
    }
    try {
        const Razorpay = require("razorpay");
        const razorpayKeyId = functions.config().razorpay.key_id;
        const razorpayKeySecret = functions.config().razorpay.key_secret;
        if (!razorpayKeyId || !razorpayKeySecret) {
            functions.logger.error("Razorpay credentials not configured");
            throw new functions.https.HttpsError("internal", "Payment configuration error");
        }
        const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret,
        });
        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt,
            payment_capture: 1,
            notes: notes || {},
        };
        const order = await razorpay.orders.create(options);
        functions.logger.info("Razorpay order created", {
            orderId: order.id,
            amount: order.amount,
            receipt: order.receipt,
            userId: context.auth.uid,
        });
        // Log order creation
        await db.collection("PaymentLogs").add({
            razorpayOrderId: order.id,
            event: "razorpay_order.created",
            amount: order.amount / 100,
            currency: order.currency,
            receipt: order.receipt,
            status: "created",
            userId: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
            },
        };
    }
    catch (error) {
        functions.logger.error("Error creating Razorpay order:", error);
        // Log order creation failure
        await db.collection("PaymentLogs").add({
            event: "razorpay_order.creation_failed",
            amount: amount,
            currency: currency,
            receipt: receipt,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            userId: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError("internal", "Failed to create payment order");
    }
});
/**
 * Retry payment for an existing order
 */
exports.retryPayment = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { order_id } = data;
    if (!order_id) {
        throw new functions.https.HttpsError("invalid-argument", "Order ID is required");
    }
    try {
        // Get the order document
        const orderDoc = await db.collection("Orders").doc(order_id).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Order not found");
        }
        const orderData = orderDoc.data();
        // Verify that the order belongs to the authenticated user
        if ((orderData === null || orderData === void 0 ? void 0 : orderData.customerID) !== context.auth.uid) {
            throw new functions.https.HttpsError("permission-denied", "Order does not belong to authenticated user");
        }
        // Check if order is in a retryable state
        if ((orderData === null || orderData === void 0 ? void 0 : orderData.paymentStatus) !== "failed" && (orderData === null || orderData === void 0 ? void 0 : orderData.paymentStatus) !== "pending") {
            throw new functions.https.HttpsError("failed-precondition", "Order is not in a retryable state");
        }
        // Reset order status for retry
        await orderDoc.ref.update({
            paymentStatus: "pending",
            status: "payment_pending",
            paymentRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentRetryCount: admin.firestore.FieldValue.increment(1),
        });
        functions.logger.info("Payment retry initiated", {
            orderId: order_id,
            userId: context.auth.uid,
        });
        // Log payment retry
        await db.collection("PaymentLogs").add({
            orderId: order_id,
            event: "payment.retry_initiated",
            status: "pending",
            userId: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            message: "Payment retry initiated",
            orderId: order_id,
        };
    }
    catch (error) {
        functions.logger.error("Error initiating payment retry:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to initiate payment retry");
    }
});
/**
 * Get payment status for an order
 */
exports.getPaymentStatus = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { order_id } = data;
    if (!order_id) {
        throw new functions.https.HttpsError("invalid-argument", "Order ID is required");
    }
    try {
        // Get the order document
        const orderDoc = await db.collection("Orders").doc(order_id).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Order not found");
        }
        const orderData = orderDoc.data();
        // Verify that the order belongs to the authenticated user
        if ((orderData === null || orderData === void 0 ? void 0 : orderData.customerID) !== context.auth.uid) {
            throw new functions.https.HttpsError("permission-denied", "Order does not belong to authenticated user");
        }
        return {
            success: true,
            paymentStatus: orderData === null || orderData === void 0 ? void 0 : orderData.paymentStatus,
            orderStatus: orderData === null || orderData === void 0 ? void 0 : orderData.status,
            paymentId: orderData === null || orderData === void 0 ? void 0 : orderData.paymentId,
            razorpayOrderId: orderData === null || orderData === void 0 ? void 0 : orderData.razorpayOrderId,
            grandTotal: orderData === null || orderData === void 0 ? void 0 : orderData.grandTotal,
        };
    }
    catch (error) {
        functions.logger.error("Error getting payment status:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to get payment status");
    }
});
//# sourceMappingURL=orderManagement.js.map