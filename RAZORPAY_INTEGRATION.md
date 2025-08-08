# Razorpay Payment Gateway Integration

This document explains the Razorpay payment gateway integration implemented in the Vrisham Organic application.

## Overview

The integration replaces the previous payment method selection with a secure Razorpay-powered payment flow that supports:
- UPI payments
- Credit/Debit cards
- Net banking
- Wallets
- EMI options

## Architecture

### Client-Side (React)
- **Cart Component**: Updated to show "Proceed to Payment" instead of checkout
- **Checkout Component**: Removed payment method selection, integrated Razorpay checkout
- **Razorpay Service**: Handles payment initialization and verification

### Server-Side (Serverless Functions)
- **create-order.js**: Creates Razorpay orders securely
- **verify-payment.js**: Verifies payment signatures server-side

## Security Implementation

### ✅ Secure Practices Implemented
1. **Server-side Order Creation**: Orders are created on the server using secret keys
2. **Payment Verification**: All payments are verified server-side using cryptographic signatures
3. **Environment Variables**: Sensitive keys are stored as environment variables
4. **Client-side Key Exposure**: Only the public key ID is exposed to the client

### 🔒 Key Security Features
- Payment signatures are verified using HMAC-SHA256
- Razorpay secret key is never exposed to client-side code
- Order creation happens server-side to prevent tampering
- Payment verification is mandatory before order confirmation

## Files Modified/Created

### New Files
- `src/services/razorpay.ts` - Razorpay service utilities
- `api/create-order.js` - Serverless function for order creation
- `api/verify-payment.js` - Serverless function for payment verification
- `.env` - Environment variables (with sample keys)
- `vercel.json` - Vercel deployment configuration

### Modified Files
- `src/components/Cart.tsx` - Updated button text
- `src/components/Checkout.tsx` - Integrated Razorpay, removed payment method selection
- `src/firebase/orders.ts` - Added payment fields to order creation
- `package.json` - Added Razorpay dependency

## Environment Variables

### Required Variables
```env
# Client-side (safe to expose)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id

# Server-side (keep secret)
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Deployment Instructions

### 1. Get Razorpay Credentials
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get your Key ID and Key Secret from API Keys section
3. For testing, use test keys (rzp_test_...)
4. For production, use live keys (rzp_live_...)

### 2. Configure Environment Variables

#### For Vercel Deployment:
```bash
# Set environment variables in Vercel dashboard or CLI
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
```

#### For Local Development:
Update `.env` file with your actual Razorpay credentials.

### 3. Deploy Serverless Functions
The API functions will be automatically deployed with your Vercel deployment.

### 4. Update API Base URL
In `src/services/razorpay.ts`, update the `API_BASE_URL` to match your deployment:
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.vercel.app/api' 
  : '/api';
```

## Payment Flow

### 1. User Journey
1. User adds items to cart
2. User clicks "Proceed to Payment" in cart
3. User fills delivery address in checkout
4. User clicks "Pay Now" button
5. Razorpay checkout modal opens
6. User completes payment
7. Payment is verified server-side
8. Order is created in database
9. User sees success page

### 2. Technical Flow
1. **Order Creation**: Client calls `/api/create-order` with amount and receipt
2. **Payment Initialization**: Razorpay checkout opens with order details
3. **Payment Completion**: User completes payment in Razorpay interface
4. **Payment Verification**: Client sends payment details to `/api/verify-payment`
5. **Order Confirmation**: If verification succeeds, order is saved to database

## Error Handling

### Payment Errors
- **Payment Cancelled**: User cancels payment in Razorpay interface
- **Payment Failed**: Network issues or payment method failures
- **Verification Failed**: Server-side signature verification fails

### Order Errors
- **Address Missing**: User hasn't selected delivery address
- **Cart Empty**: No items in cart
- **Coupon Issues**: Coupon validation or application failures

## Testing

### Test Credentials
Use Razorpay test credentials for development:
- Test Key ID: `rzp_test_1234567890abcdef`
- Test Key Secret: `your_test_secret_here`

### Test Cards
Razorpay provides test card numbers for different scenarios:
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

## Data Storage

### Order Fields Added
The following fields are now stored with each order:
- `paymentId`: Razorpay payment ID
- `razorpayOrderId`: Razorpay order ID
- `paymentSignature`: Payment verification signature

### Payment Status
- Online payments: `paymentStatus: 'paid'`
- COD orders: `paymentStatus: 'unpaid'`

## Monitoring and Logs

### Client-side Logging
- Payment initialization logs
- Payment success/failure logs
- Order creation logs

### Server-side Logging
- Order creation requests
- Payment verification attempts
- Error details for debugging

## Support and Troubleshooting

### Common Issues
1. **"Failed to load Razorpay SDK"**: Check internet connection and Razorpay script loading
2. **"Payment verification failed"**: Check server-side signature verification
3. **"Order creation failed"**: Check Firebase permissions and order data structure

### Debug Steps
1. Check browser console for client-side errors
2. Check Vercel function logs for server-side errors
3. Verify environment variables are set correctly
4. Test with Razorpay test credentials first

## Next Steps

### Recommended Enhancements
1. **Webhook Integration**: Implement Razorpay webhooks for payment status updates
2. **Refund Support**: Add refund functionality for cancelled orders
3. **Payment Analytics**: Track payment success rates and failure reasons
4. **Multiple Payment Methods**: Add support for EMI, Pay Later options
5. **Subscription Support**: For recurring orders (if needed)

### Production Checklist
- [ ] Replace test keys with live Razorpay keys
- [ ] Update API base URL to production domain
- [ ] Test payment flow end-to-end
- [ ] Set up payment monitoring and alerts
- [ ] Configure webhook endpoints (optional)
- [ ] Update terms and privacy policy for payment processing
