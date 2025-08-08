# Quick Setup Guide - Firebase Functions for Payment Integration

## 🚀 Quick Start (5 minutes)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Deploy Functions

#### On Windows:
```cmd
deploy-functions.bat
```

#### On Mac/Linux:
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### Step 4: Configure Razorpay Webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) > Settings > Webhooks
2. Click "Add New Webhook"
3. Enter URL: `https://us-central1-vrisham-cad24.cloudfunctions.net/razorpayWebhook`
4. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `payment.authorized`
5. Set webhook secret (same as entered during deployment)
6. Save webhook

### Step 5: Test the Integration

1. **Create a test order** in your application
2. **Complete payment** using test card: `4111 1111 1111 1111`
3. **Verify order status** updates to "paid"
4. **Check logs**: `firebase functions:log`

## 🔧 Configuration Details

### Required Razorpay Credentials

You'll need these from your Razorpay Dashboard:

1. **Key ID**: Found in Settings > API Keys
2. **Key Secret**: Found in Settings > API Keys (keep secret!)
3. **Webhook Secret**: Create when setting up webhook

### Environment Variables (Optional)

Add to your `.env` file to use Firebase Functions instead of Vercel API:

```env
VITE_USE_FIREBASE_FUNCTIONS=true
```

## 📊 Monitoring

### View Function Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only razorpayWebhook
```

### Check Function Status
```bash
firebase functions:list
```

### View Configuration
```bash
firebase functions:config:get
```

## 🔍 Testing Checklist

- [ ] Functions deployed successfully
- [ ] Webhook URL configured in Razorpay
- [ ] Test payment completes successfully
- [ ] Order status updates in real-time
- [ ] Payment logs appear in Firestore
- [ ] Failed payments are handled correctly

## 🆘 Troubleshooting

### Common Issues

**❌ "Configuration not found"**
```bash
firebase functions:config:set razorpay.key_id="your_key" razorpay.key_secret="your_secret" razorpay.webhook_secret="your_webhook_secret"
```

**❌ "Webhook not receiving events"**
- Check webhook URL in Razorpay dashboard
- Verify webhook secret matches configuration
- Check Firebase Functions logs

**❌ "Payment verification failed"**
- Verify Razorpay credentials are correct
- Check function logs for detailed error messages
- Ensure order exists in Firestore

### Get Help

1. Check Firebase Functions logs: `firebase functions:log`
2. Review the complete documentation: `PAYMENT_INTEGRATION_COMPLETE.md`
3. Contact development team with specific error messages

## 🎉 Success!

Once everything is working:

1. **Monitor production** payments closely for the first few days
2. **Set up alerts** for function failures
3. **Review payment analytics** in Firestore collections
4. **Consider enabling** additional Razorpay features like EMI, UPI, etc.

---

**Need more details?** See the complete documentation in `PAYMENT_INTEGRATION_COMPLETE.md`
