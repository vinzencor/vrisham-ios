"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOrderStatusUpdate = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
/**
 * Firestore trigger that runs when an order document is updated
 * Handles order status change notifications and logging
 */
exports.onOrderStatusUpdate = functions.firestore
    .document("Orders/{orderId}")
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const orderId = context.params.orderId;
    // Check if payment status or order status changed
    const paymentStatusChanged = beforeData.paymentStatus !== afterData.paymentStatus;
    const orderStatusChanged = beforeData.status !== afterData.status;
    if (!paymentStatusChanged && !orderStatusChanged) {
        // No relevant status changes
        return null;
    }
    functions.logger.info("Order status updated", {
        orderId: orderId,
        customerID: afterData.customerID,
        oldPaymentStatus: beforeData.paymentStatus,
        newPaymentStatus: afterData.paymentStatus,
        oldOrderStatus: beforeData.status,
        newOrderStatus: afterData.status,
    });
    try {
        // Log the status change
        await db.collection("OrderStatusLogs").add({
            orderId: orderId,
            customerID: afterData.customerID,
            orderNumber: afterData.orderID,
            changes: {
                paymentStatus: {
                    from: beforeData.paymentStatus,
                    to: afterData.paymentStatus,
                    changed: paymentStatusChanged,
                },
                orderStatus: {
                    from: beforeData.status,
                    to: afterData.status,
                    changed: orderStatusChanged,
                },
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            grandTotal: afterData.grandTotal,
            modeOfPayment: afterData.modeOfPayment,
        });
        // Handle specific status transitions
        if (paymentStatusChanged) {
            await handlePaymentStatusChange(orderId, beforeData, afterData);
        }
        if (orderStatusChanged) {
            await handleOrderStatusChange(orderId, beforeData, afterData);
        }
        return null;
    }
    catch (error) {
        functions.logger.error("Error handling order status update:", error);
        throw error;
    }
});
/**
 * Handle payment status changes
 */
async function handlePaymentStatusChange(orderId, beforeData, afterData) {
    const oldStatus = beforeData.paymentStatus;
    const newStatus = afterData.paymentStatus;
    functions.logger.info(`Payment status changed: ${oldStatus} -> ${newStatus}`, {
        orderId: orderId,
    });
    switch (newStatus) {
        case "paid":
            await handlePaymentSuccess(orderId, afterData);
            break;
        case "failed":
            await handlePaymentFailure(orderId, afterData);
            break;
        case "expired":
            await handlePaymentExpiry(orderId, afterData);
            break;
    }
}
/**
 * Handle order status changes
 */
async function handleOrderStatusChange(orderId, beforeData, afterData) {
    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    functions.logger.info(`Order status changed: ${oldStatus} -> ${newStatus}`, {
        orderId: orderId,
    });
    // Add any order status specific handling here
    // For example, sending notifications, updating inventory, etc.
}
/**
 * Handle successful payment
 */
async function handlePaymentSuccess(orderId, orderData) {
    functions.logger.info("Handling payment success", { orderId });
    try {
        // Create a success notification record
        await db.collection("Notifications").add({
            type: "payment_success",
            orderId: orderId,
            customerID: orderData.customerID,
            orderNumber: orderData.orderID,
            amount: orderData.grandTotal,
            title: "Payment Successful",
            message: `Your payment of ₹${orderData.grandTotal} for order #${orderData.orderID} has been processed successfully.`,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update customer's order statistics
        await updateCustomerStats(orderData.customerID, "payment_success");
        functions.logger.info("Payment success handled successfully", { orderId });
    }
    catch (error) {
        functions.logger.error("Error handling payment success:", error);
        throw error;
    }
}
/**
 * Handle payment failure
 */
async function handlePaymentFailure(orderId, orderData) {
    functions.logger.info("Handling payment failure", { orderId });
    try {
        // Create a failure notification record
        await db.collection("Notifications").add({
            type: "payment_failed",
            orderId: orderId,
            customerID: orderData.customerID,
            orderNumber: orderData.orderID,
            amount: orderData.grandTotal,
            title: "Payment Failed",
            message: `Your payment for order #${orderData.orderID} could not be processed. You can retry the payment from your orders page.`,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update customer's order statistics
        await updateCustomerStats(orderData.customerID, "payment_failed");
        functions.logger.info("Payment failure handled successfully", { orderId });
    }
    catch (error) {
        functions.logger.error("Error handling payment failure:", error);
        throw error;
    }
}
/**
 * Handle payment expiry
 */
async function handlePaymentExpiry(orderId, orderData) {
    functions.logger.info("Handling payment expiry", { orderId });
    try {
        // Create an expiry notification record
        await db.collection("Notifications").add({
            type: "payment_expired",
            orderId: orderId,
            customerID: orderData.customerID,
            orderNumber: orderData.orderID,
            amount: orderData.grandTotal,
            title: "Order Expired",
            message: `Order #${orderData.orderID} has expired due to pending payment. Please place a new order.`,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update customer's order statistics
        await updateCustomerStats(orderData.customerID, "payment_expired");
        functions.logger.info("Payment expiry handled successfully", { orderId });
    }
    catch (error) {
        functions.logger.error("Error handling payment expiry:", error);
        throw error;
    }
}
/**
 * Update customer statistics
 */
async function updateCustomerStats(customerID, eventType) {
    try {
        const customerStatsRef = db.collection("CustomerStats").doc(customerID);
        // Use a transaction to safely update stats
        await db.runTransaction(async (transaction) => {
            const statsDoc = await transaction.get(customerStatsRef);
            if (!statsDoc.exists) {
                // Create new stats document
                transaction.set(customerStatsRef, {
                    customerID: customerID,
                    totalOrders: 0,
                    successfulPayments: 0,
                    failedPayments: 0,
                    expiredOrders: 0,
                    lastOrderAt: null,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            // Update stats based on event type
            const updateData = {
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            switch (eventType) {
                case "payment_success":
                    updateData.successfulPayments = admin.firestore.FieldValue.increment(1);
                    updateData.lastOrderAt = admin.firestore.FieldValue.serverTimestamp();
                    break;
                case "payment_failed":
                    updateData.failedPayments = admin.firestore.FieldValue.increment(1);
                    break;
                case "payment_expired":
                    updateData.expiredOrders = admin.firestore.FieldValue.increment(1);
                    break;
            }
            transaction.update(customerStatsRef, updateData);
        });
        functions.logger.info("Customer stats updated", {
            customerID: customerID,
            eventType: eventType,
        });
    }
    catch (error) {
        functions.logger.error("Error updating customer stats:", error);
        // Don't throw error here as it's not critical
    }
}
//# sourceMappingURL=orderStatusUpdates.js.map