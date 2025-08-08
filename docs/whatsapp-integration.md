# WhatsApp Integration Documentation

## Overview

The WhatsApp integration uses the Interakt API to send order confirmation messages to customers automatically when orders are placed or payment is confirmed.

## Features

- ✅ Automatic WhatsApp messages for COD orders
- ✅ Automatic WhatsApp messages for successful online payments
- ✅ Retry logic with exponential backoff
- ✅ Message status tracking in order documents
- ✅ Manual message sending capability
- ✅ Admin utility for testing and manual sends
- ✅ Proper error handling and logging

## API Configuration

- **Provider**: Interakt API
- **Endpoint**: `https://api.interakt.ai/v1/public/message/`
- **API Key**: `V2VrZ3BrVGc4S2Q0ekRoeWpyeU1QS1R2MXU2Nl9GZEliQXdTWFdBWnNvRTo=`
- **Authentication**: HTTP Basic Auth (`Authorization: Basic <API_KEY>`)
- **Template Name**: `order_confirmation`
- **Language**: `en`

## Template Message

```
Hi {{1}}, thank you for your order! 🧾 Order ID: {{2}} 📦 Items: {{3}} 💳 Payment Method: {{4}} 💰 Total Amount: ₹{{5}} We'll keep you posted on your order status!
```

### Template Variables

1. `{{1}}` - Customer Name
2. `{{2}}` - Order Number
3. `{{3}}` - Items List (formatted as "Product Name x Quantity")
4. `{{4}}` - Payment Method ("Cash on Delivery" or "Online Payment")
5. `{{5}}` - Total Amount

## Implementation Details

### Files Created/Modified

1. **`src/services/whatsapp.ts`** - Main WhatsApp service
2. **`src/firebase/orders.ts`** - Integrated WhatsApp calls into order flow
3. **`src/firebase/schema.ts`** - Added WhatsApp tracking fields to Order interface
4. **`src/components/Success.tsx`** - Added manual WhatsApp resend option
5. **`src/components/admin/WhatsAppManager.tsx`** - Admin utility for manual sends
6. **`src/utils/test-whatsapp.ts`** - Testing utilities

### Order Schema Updates

Added the following fields to the `Order` interface:

```typescript
whatsappMessageSent?: boolean;
whatsappMessageId?: string;
whatsappMessageError?: string;
whatsappMessageSentAt?: Timestamp;
```

### Integration Points

#### 1. COD Orders
- Triggered in `createOrder()` function after order is saved to Firestore
- Sends WhatsApp message immediately after order creation
- Updates order document with message status

#### 2. Online Orders
- Triggered in `updateOrderPaymentStatus()` function when payment status becomes 'paid'
- Fetches updated order data and sends WhatsApp message
- Updates order document with message status

#### 3. Manual Triggers
- Admin utility allows sending messages by order ID for testing/resending
- Updates the order document with message status

## Usage

### Automatic Sending

WhatsApp messages are sent automatically:
- When a COD order is placed
- When an online payment is confirmed

### Manual Sending

#### From Success Page
- Displays an informational message that WhatsApp confirmation has been sent automatically
- No manual interaction required from customers

#### From Admin Panel
1. Use the `WhatsAppManager` component
2. Enter the Firestore order document ID
3. Click "Send WhatsApp Message"
4. View the result and message ID

### Testing

```typescript
// In browser console
testWhatsApp.testFormatting(); // Test formatting functions
testWhatsApp.testMessage();    // Send test message (use carefully)
testWhatsApp.runAllTests();    // Run all tests
```

## Error Handling

### Retry Logic
- 3 retry attempts with exponential backoff (2s, 4s, 8s)
- Logs each attempt and final result
- Updates order document with success/failure status

### Error Scenarios
1. **Invalid phone number** - Logged and stored in order document
2. **API failure** - Retried up to 3 times, then marked as failed
3. **Network issues** - Handled with proper error messages
4. **Missing order data** - Validation prevents sending incomplete messages

### Graceful Degradation
- Order creation/payment processing continues even if WhatsApp fails
- WhatsApp failures are logged but don't affect core order flow
- Manual resend options available for failed messages

## Phone Number Formatting

The system automatically formats phone numbers:
- Removes non-digit characters
- Handles Indian country code (91) removal
- Validates 10-digit format
- Throws errors for invalid formats

Examples:
- `9876543210` → `9876543210`
- `919876543210` → `9876543210`
- `+919876543210` → `9876543210`

## Monitoring and Logs

### Console Logs
- Order creation with WhatsApp status
- API request/response details
- Retry attempts and failures
- Success confirmations with message IDs

### Database Tracking
- `whatsappMessageSent` - Boolean success flag
- `whatsappMessageId` - Interakt message ID for tracking
- `whatsappMessageError` - Error message if failed
- `whatsappMessageSentAt` - Timestamp of successful send

## Security Considerations

- API key is hardcoded (consider moving to environment variables)
- Phone numbers are validated before sending
- No sensitive data in WhatsApp messages beyond order details
- Error messages don't expose internal system details

## Future Enhancements

1. **Environment Variables** - Move API key to env vars
2. **Message Templates** - Support multiple templates
3. **Delivery Status** - Track message delivery status
4. **Bulk Messaging** - Send messages to multiple orders
5. **Message History** - Store message history in separate collection
6. **Customer Preferences** - Allow customers to opt-out of WhatsApp messages

## Troubleshooting

### Common Issues

1. **Phone number format errors**
   - Check phone number in order document
   - Ensure 10-digit Indian mobile number

2. **API authentication errors**
   - Verify API key is correct
   - Check Interakt account status

3. **Template not found**
   - Ensure template 'order_confirmation' exists in Interakt
   - Verify template is approved

4. **Message not received**
   - Check WhatsApp message status in order document
   - Verify customer's WhatsApp number is active
   - Check Interakt dashboard for delivery status

### Debug Steps

1. Check browser console for error logs
2. Verify order document has correct phone number
3. Test with WhatsApp admin utility
4. Check Interakt API dashboard for message status
5. Verify template configuration in Interakt

## Support

For issues with the WhatsApp integration:
1. Check the console logs for detailed error messages
2. Use the admin WhatsApp manager for manual testing
3. Verify order data completeness
4. Contact Interakt support for API-related issues
