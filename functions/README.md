# Firebase Functions for Vrisham Organic

This directory contains Firebase Cloud Functions for handling payment processing, order management, and system automation.

## Functions Overview

### Payment Functions

1. **razorpayWebhook** - HTTP function to handle Razorpay webhooks
2. **verifyPayment** - Callable function to verify payment signatures
3. **markPaymentFailed** - Callable function to mark payments as failed
4. **createRazorpayOrder** - Callable function to create Razorpay orders
5. **retryPayment** - Callable function to retry failed payments
6. **getPaymentStatus** - Callable function to get payment status

### Order Management Functions

1. **cleanupExpiredOrders** - Scheduled function to clean up expired orders
2. **manualOrderCleanup** - Callable function for manual order cleanup
3. **getCleanupStats** - Callable function to get cleanup statistics
4. **onOrderStatusUpdate** - Firestore trigger for order status changes

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Set up Firebase Functions configuration:

```bash
# Set Razorpay credentials
firebase functions:config:set razorpay.key_id="your_razorpay_key_id"
firebase functions:config:set razorpay.key_secret="your_razorpay_key_secret"
firebase functions:config:set razorpay.webhook_secret="your_razorpay_webhook_secret"
```

### 3. Build Functions

```bash
npm run build
```

### 4. Deploy Functions

Deploy all functions:
```bash
npm run deploy
```

Deploy specific functions:
```bash
firebase deploy --only functions:razorpayWebhook
firebase deploy --only functions:verifyPayment
```

## Function URLs

After deployment, your functions will be available at:

- **Webhook URL**: `https://us-central1-vrisham-cad24.cloudfunctions.net/razorpayWebhook`
- **Other functions**: Available via Firebase SDK callable functions

## Webhook Configuration

### Razorpay Webhook Setup

1. Go to Razorpay Dashboard > Settings > Webhooks
2. Add new webhook with URL: `https://us-central1-vrisham-cad24.cloudfunctions.net/razorpayWebhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `payment.authorized`
4. Set webhook secret and update Firebase config

## Security Considerations

1. **Webhook Verification**: All webhooks verify signatures using HMAC-SHA256
2. **Authentication**: Callable functions require user authentication
3. **Authorization**: Admin functions check user roles
4. **Input Validation**: All inputs are validated before processing

## Monitoring and Logging

- All functions log important events to Firebase Functions logs
- Payment events are logged to `PaymentLogs` collection
- Order status changes are logged to `OrderStatusLogs` collection
- System events are logged to `SystemLogs` collection

## Testing

### Local Testing

```bash
# Start Firebase emulators
npm run serve

# Test functions locally
npm run shell
```

### Production Testing

Use Firebase Functions logs to monitor function execution:

```bash
npm run logs
```

## Troubleshooting

### Common Issues

1. **Configuration Missing**: Ensure all environment variables are set
2. **Permission Errors**: Check Firebase security rules
3. **Webhook Failures**: Verify webhook URL and secret
4. **Timeout Issues**: Increase function timeout if needed

### Debug Commands

```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only razorpayWebhook

# View configuration
firebase functions:config:get
```

## Function Details

### Payment Webhook Flow

1. Razorpay sends webhook to `razorpayWebhook` function
2. Function verifies webhook signature
3. Function updates order status in Firestore
4. Function logs payment event
5. Firestore trigger (`onOrderStatusUpdate`) handles notifications

### Order Cleanup Flow

1. Scheduled function runs every hour
2. Finds orders pending for more than 2 hours
3. Marks orders as expired
4. Logs cleanup activity

### Payment Verification Flow

1. Client calls `verifyPayment` function
2. Function verifies payment signature
3. Function updates order status
4. Function returns verification result

## Environment Variables

Required configuration:

```
razorpay.key_id - Razorpay API Key ID
razorpay.key_secret - Razorpay API Key Secret
razorpay.webhook_secret - Razorpay Webhook Secret
```

## Support

For issues or questions:
1. Check Firebase Functions logs
2. Review Firestore security rules
3. Verify Razorpay configuration
4. Contact development team
