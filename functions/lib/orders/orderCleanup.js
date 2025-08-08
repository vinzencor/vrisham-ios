"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCleanupStats = exports.manualOrderCleanup = exports.cleanupExpiredOrders = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
/**
 * Scheduled function to clean up expired pending orders
 * Runs every hour to check for orders that have been pending for more than 2 hours
 */
exports.cleanupExpiredOrders = functions.pubsub
    .schedule("0 * * * *") // Run every hour at minute 0
    .timeZone("Asia/Kolkata") // Indian timezone
    .onRun(async (context) => {
    functions.logger.info("Starting cleanup of expired pending orders");
    try {
        // Calculate cutoff time (2 hours ago)
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 2);
        // Query for orders that are pending and older than cutoff time
        const expiredOrdersQuery = db.collection("Orders")
            .where("paymentStatus", "==", "pending")
            .where("status", "==", "payment_pending")
            .where("orderedTime", "<", admin.firestore.Timestamp.fromDate(cutoffTime));
        const expiredOrdersSnapshot = await expiredOrdersQuery.get();
        if (expiredOrdersSnapshot.empty) {
            functions.logger.info("No expired orders found");
            return null;
        }
        functions.logger.info(`Found ${expiredOrdersSnapshot.size} expired orders`);
        // Batch update expired orders
        const batch = db.batch();
        const expiredOrderIds = [];
        expiredOrdersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            expiredOrderIds.push(doc.id);
            // Update order status to expired
            batch.update(doc.ref, {
                paymentStatus: "expired",
                status: "payment_expired",
                expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`Marking order ${doc.id} as expired`, {
                orderId: doc.id,
                customerID: orderData.customerID,
                grandTotal: orderData.grandTotal,
                orderedTime: orderData.orderedTime,
            });
        });
        // Commit the batch update
        await batch.commit();
        // Log cleanup activity
        await db.collection("SystemLogs").add({
            event: "order_cleanup",
            action: "expired_orders_marked",
            orderCount: expiredOrdersSnapshot.size,
            expiredOrderIds: expiredOrderIds,
            cutoffTime: admin.firestore.Timestamp.fromDate(cutoffTime),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Successfully marked ${expiredOrdersSnapshot.size} orders as expired`);
        return {
            success: true,
            expiredOrderCount: expiredOrdersSnapshot.size,
            expiredOrderIds: expiredOrderIds,
        };
    }
    catch (error) {
        functions.logger.error("Error during order cleanup:", error);
        // Log cleanup error
        await db.collection("SystemLogs").add({
            event: "order_cleanup",
            action: "cleanup_failed",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw error;
    }
});
/**
 * Manual cleanup function that can be called via HTTP
 * Useful for testing or manual cleanup
 */
exports.manualOrderCleanup = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated and has admin role
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    // Get user data to check role
    const userDoc = await db.collection("Users").doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only admin users can perform manual cleanup");
    }
    const { hoursOld = 2 } = data;
    try {
        functions.logger.info(`Manual cleanup initiated by admin ${context.auth.uid}`);
        // Calculate cutoff time
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hoursOld);
        // Query for orders that are pending and older than cutoff time
        const expiredOrdersQuery = db.collection("Orders")
            .where("paymentStatus", "==", "pending")
            .where("status", "==", "payment_pending")
            .where("orderedTime", "<", admin.firestore.Timestamp.fromDate(cutoffTime));
        const expiredOrdersSnapshot = await expiredOrdersQuery.get();
        if (expiredOrdersSnapshot.empty) {
            return {
                success: true,
                message: "No expired orders found",
                expiredOrderCount: 0,
            };
        }
        // Batch update expired orders
        const batch = db.batch();
        const expiredOrderIds = [];
        expiredOrdersSnapshot.forEach((doc) => {
            expiredOrderIds.push(doc.id);
            batch.update(doc.ref, {
                paymentStatus: "expired",
                status: "payment_expired",
                expiredAt: admin.firestore.FieldValue.serverTimestamp(),
                expiredBy: context.auth.uid,
            });
        });
        // Commit the batch update
        await batch.commit();
        // Log manual cleanup activity
        await db.collection("SystemLogs").add({
            event: "manual_order_cleanup",
            action: "expired_orders_marked",
            orderCount: expiredOrdersSnapshot.size,
            expiredOrderIds: expiredOrderIds,
            cutoffTime: admin.firestore.Timestamp.fromDate(cutoffTime),
            hoursOld: hoursOld,
            adminUserId: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`Manual cleanup completed: ${expiredOrdersSnapshot.size} orders marked as expired`);
        return {
            success: true,
            message: `Successfully marked ${expiredOrdersSnapshot.size} orders as expired`,
            expiredOrderCount: expiredOrdersSnapshot.size,
            expiredOrderIds: expiredOrderIds,
        };
    }
    catch (error) {
        functions.logger.error("Error during manual order cleanup:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "Manual cleanup failed");
    }
});
/**
 * Get cleanup statistics
 */
exports.getCleanupStats = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated and has admin role
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    // Get user data to check role
    const userDoc = await db.collection("Users").doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only admin users can view cleanup statistics");
    }
    try {
        // Get current pending orders count
        const pendingOrdersSnapshot = await db.collection("Orders")
            .where("paymentStatus", "==", "pending")
            .where("status", "==", "payment_pending")
            .get();
        // Get expired orders count
        const expiredOrdersSnapshot = await db.collection("Orders")
            .where("paymentStatus", "==", "expired")
            .where("status", "==", "payment_expired")
            .get();
        // Get recent cleanup logs
        const cleanupLogsSnapshot = await db.collection("SystemLogs")
            .where("event", "in", ["order_cleanup", "manual_order_cleanup"])
            .orderBy("timestamp", "desc")
            .limit(10)
            .get();
        const cleanupLogs = cleanupLogsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return {
            success: true,
            stats: {
                currentPendingOrders: pendingOrdersSnapshot.size,
                totalExpiredOrders: expiredOrdersSnapshot.size,
                recentCleanupLogs: cleanupLogs,
            },
        };
    }
    catch (error) {
        functions.logger.error("Error getting cleanup stats:", error);
        throw new functions.https.HttpsError("internal", "Failed to get cleanup statistics");
    }
});
//# sourceMappingURL=orderCleanup.js.map