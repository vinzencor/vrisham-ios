import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id?: string;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status?: string;
        captured: boolean;
        description: string;
        card_id?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        email: string;
        contact: string;
        notes: Record<string, any>;
        fee: number;
        tax: number;
        error_code?: string;
        error_description?: string;
        error_source?: string;
        error_step?: string;
        error_reason?: string;
        acquirer_data: Record<string, any>;
        created_at: number;
      };
    };
  };
  created_at: number;
}

/**
 * Razorpay Webhook Handler
 * Handles payment status updates from Razorpay
 */
export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-Razorpay-Signature");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const webhookSecret = functions.config().razorpay.webhook_secret;
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!webhookSecret) {
      functions.logger.error("Razorpay webhook secret not configured");
      res.status(500).json({error: "Webhook secret not configured"});
      return;
    }

    if (!signature) {
      functions.logger.error("Missing Razorpay signature");
      res.status(400).json({error: "Missing signature"});
      return;
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      functions.logger.error("Invalid webhook signature");
      res.status(400).json({error: "Invalid signature"});
      return;
    }

    const payload: RazorpayWebhookPayload = req.body;
    functions.logger.info("Received webhook:", payload.event);

    // Handle different webhook events
    switch (payload.event) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload);
        break;
      case "payment.authorized":
        await handlePaymentAuthorized(payload);
        break;
      default:
        functions.logger.info(`Unhandled webhook event: ${payload.event}`);
    }

    res.status(200).json({status: "success"});
  } catch (error) {
    functions.logger.error("Error processing webhook:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = payload.payload.payment.entity;
  const orderId = payment.order_id;

  functions.logger.info(`Payment captured for order: ${orderId}`);

  try {
    // Find the order by razorpayOrderId
    const ordersSnapshot = await db.collection("Orders")
      .where("razorpayOrderId", "==", orderId)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      functions.logger.error(`Order not found for Razorpay order ID: ${orderId}`);
      return;
    }

    const orderDoc = ordersSnapshot.docs[0];

    // Update order status
    await orderDoc.ref.update({
      paymentStatus: "paid",
      status: "placed",
      paymentId: payment.id,
      paymentCapturedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: payment.method,
      paymentAmount: payment.amount / 100, // Convert from paise to rupees
    });

    functions.logger.info(`Order ${orderDoc.id} updated to paid status`);

    // Log payment success
    await db.collection("PaymentLogs").add({
      orderId: orderDoc.id,
      razorpayOrderId: orderId,
      razorpayPaymentId: payment.id,
      event: "payment.captured",
      amount: payment.amount / 100,
      currency: payment.currency,
      method: payment.method,
      status: "success",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      customerEmail: payment.email,
      customerContact: payment.contact,
    });

  } catch (error) {
    functions.logger.error("Error handling payment captured:", error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payload.payment.entity;
  const orderId = payment.order_id;

  functions.logger.info(`Payment failed for order: ${orderId}`);

  try {
    // Find the order by razorpayOrderId
    const ordersSnapshot = await db.collection("Orders")
      .where("razorpayOrderId", "==", orderId)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      functions.logger.error(`Order not found for Razorpay order ID: ${orderId}`);
      return;
    }

    const orderDoc = ordersSnapshot.docs[0];

    // Update order status
    await orderDoc.ref.update({
      paymentStatus: "failed",
      status: "payment_failed",
      paymentId: payment.id,
      paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentErrorCode: payment.error_code,
      paymentErrorDescription: payment.error_description,
    });

    functions.logger.info(`Order ${orderDoc.id} updated to failed status`);

    // Log payment failure
    await db.collection("PaymentLogs").add({
      orderId: orderDoc.id,
      razorpayOrderId: orderId,
      razorpayPaymentId: payment.id,
      event: "payment.failed",
      amount: payment.amount / 100,
      currency: payment.currency,
      method: payment.method,
      status: "failed",
      errorCode: payment.error_code,
      errorDescription: payment.error_description,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      customerEmail: payment.email,
      customerContact: payment.contact,
    });

  } catch (error) {
    functions.logger.error("Error handling payment failed:", error);
    throw error;
  }
}

/**
 * Handle payment authorization (for cards that require capture)
 */
async function handlePaymentAuthorized(payload: RazorpayWebhookPayload) {
  const payment = payload.payload.payment.entity;
  const orderId = payment.order_id;

  functions.logger.info(`Payment authorized for order: ${orderId}`);

  // For auto-capture payments, this will be followed by payment.captured
  // For manual capture, you might want to update order status to "authorized"
  
  // Log the authorization
  await db.collection("PaymentLogs").add({
    razorpayOrderId: orderId,
    razorpayPaymentId: payment.id,
    event: "payment.authorized",
    amount: payment.amount / 100,
    currency: payment.currency,
    method: payment.method,
    status: "authorized",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    customerEmail: payment.email,
    customerContact: payment.contact,
  });
}
