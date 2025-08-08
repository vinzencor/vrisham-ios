"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markPaymentFailed = exports.verifyPayment = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const db = admin.firestore();
/**
 * Verify Razorpay payment signature and update order status
 */
exports.verifyPayment = functions.https.onCall(async (data, context) => {
    var _a;
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to verify payment");
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, } = data;
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required payment verification fields");
    }
    try {
        const razorpayKeySecret = functions.config().razorpay.key_secret;
        if (!razorpayKeySecret) {
            functions.logger.error("Razorpay key secret not configured");
            throw new functions.https.HttpsError("internal", "Payment configuration error");
        }
        // Verify payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", razorpayKeySecret)
            .update(body.toString())
            .digest("hex");
        const isAuthentic = expectedSignature === razorpay_signature;
        if (!isAuthentic) {
            functions.logger.error("Invalid payment signature", {
                orderId: order_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
            });
            throw new functions.https.HttpsError("invalid-argument", "Payment verification failed");
        }
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
        // Update order with payment details
        await orderDoc.ref.update({
            paymentStatus: "paid",
            status: "placed",
            paymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            paymentSignature: razorpay_signature,
            paymentVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info("Payment verified and order updated", {
            orderId: order_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            userId: context.auth.uid,
        });
        // Log successful payment verification
        await db.collection("PaymentLogs").add({
            orderId: order_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            event: "payment.verified",
            status: "success",
            userId: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            verificationMethod: "client_side",
        });
        return {
            success: true,
            message: "Payment verified successfully",
            orderId: order_id,
        };
    }
    catch (error) {
        functions.logger.error("Error verifying payment:", error);
        // Log failed payment verification
        await db.collection("PaymentLogs").add({
            orderId: order_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            event: "payment.verification_failed",
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            userId: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            verificationMethod: "client_side",
        });
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Payment verification failed");
    }
});
/**
 * Mark payment as failed
 */
exports.markPaymentFailed = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { order_id, reason } = data;
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
        // Update order status to failed
        await orderDoc.ref.update({
            paymentStatus: "failed",
            status: "payment_failed",
            paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentFailureReason: reason || "Payment cancelled by user",
        });
        functions.logger.info("Payment marked as failed", {
            orderId: order_id,
            reason: reason,
            userId: context.auth.uid,
        });
        // Log payment failure
        await db.collection("PaymentLogs").add({
            orderId: order_id,
            event: "payment.marked_failed",
            status: "failed",
            reason: reason || "Payment cancelled by user",
            userId: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            message: "Payment marked as failed",
            orderId: order_id,
        };
    }
    catch (error) {
        functions.logger.error("Error marking payment as failed:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Failed to update payment status");
    }
});
//# sourceMappingURL=paymentVerification.js.map