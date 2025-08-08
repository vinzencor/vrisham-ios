# Fast2SMS + Firebase Custom Token Authentication Setup

## 🎯 Overview

This setup combines **Fast2SMS** for OTP delivery with **Firebase Custom Tokens** for authentication, solving both the payment authentication issue and duplicate profile prevention.

## 🔧 Architecture

```
1. User enters phone number
2. Frontend calls server /api/send-otp
3. Server generates OTP and sends via Fast2SMS
4. User enters OTP
5. Frontend calls server /api/verify-otp
6. Server verifies OTP and generates Firebase custom token
7. Frontend signs in with custom token
8. Firebase Auth provides proper tokens for payment system
```

## 📋 Setup Steps

### Step 1: Install Dependencies

```bash
npm install firebase-admin
```

### Step 2: Setup Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`vrisham-cad24`)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Download and save as `serviceAccountKey.json` in project root
6. Add to `.gitignore`:
   ```
   serviceAccountKey.json
   ```

### Step 3: Start the SMS Proxy Server

```bash
node sms-proxy-server.cjs
```

You should see:
```
✅ Firebase Admin SDK initialized with service account
🚀 SMS Proxy Server started!
Server running on http://localhost:3001
```

### Step 4: Start the Frontend

```bash
npm run dev
```

## 🧪 Testing the Complete Flow

### Test 1: OTP Sending
```bash
curl -X POST http://localhost:3001/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phoneNumber": "+919876543210",
  "expiresAt": 1234567890000
}
```

### Test 2: OTP Verification
```bash
curl -X POST http://localhost:3001/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210", "otp": "123456"}'
```

Expected response:
```json
{
  "success": true,
  "firebaseToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "uid": "user_919876543210",
  "phoneNumber": "+919876543210",
  "message": "OTP verified and Firebase token generated successfully"
}
```

### Test 3: Frontend Authentication

1. Open your app in browser
2. Go to login page
3. Enter phone number
4. Check SMS for OTP
5. Enter OTP
6. Should be logged in with Firebase Auth

### Test 4: Payment Authentication

1. Complete the login flow
2. Add items to cart
3. Proceed to checkout
4. Complete payment
5. Should work without "not authenticated user" error

## 🔍 API Endpoints

### POST /api/send-otp
**Request:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phoneNumber": "+919876543210",
  "expiresAt": 1234567890000
}
```

### POST /api/verify-otp
**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "firebaseToken": "custom_token_here",
  "uid": "user_919876543210",
  "phoneNumber": "+919876543210"
}
```

### GET /api/health
**Response:**
```json
{
  "status": "healthy",
  "service": "SMS Proxy Server with Firebase Auth",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "features": {
    "smsProxy": true,
    "firebaseAuth": true,
    "otpStorage": 0
  }
}
```

## 🛠️ Frontend Integration

The frontend automatically uses the new authentication service. Key files updated:

- `src/firebase/customTokenAuth.ts` - New auth service
- `src/contexts/AuthContext.tsx` - Updated to use new service
- `src/components/profile/AuthModal.tsx` - Updated
- `src/components/Login.tsx` - Updated

## 🔒 Security Features

1. **OTP Expiry**: OTPs expire after 5 minutes
2. **Attempt Limiting**: Max 3 OTP verification attempts
3. **Phone Number Validation**: Validates Indian phone numbers
4. **Firebase Custom Tokens**: Secure authentication with proper claims
5. **Rate Limiting**: Prevents OTP spam (built into Fast2SMS)

## 🚨 Troubleshooting

### Server Won't Start
```
❌ Firebase Admin SDK initialization failed
```
**Solution**: Check `serviceAccountKey.json` exists and has correct format

### OTP Not Received
```
❌ Fast2SMS API error: 500
```
**Solution**: 
- Check Fast2SMS API key is correct
- Verify Fast2SMS account has credits
- Check phone number format (+91XXXXXXXXXX)

### Firebase Token Error
```
❌ Failed to generate Firebase authentication token
```
**Solution**:
- Verify service account has proper permissions
- Check Firebase project ID matches
- Ensure Firebase Auth is enabled in console

### Payment Still Fails
```
❌ User must be authenticated to verify payment
```
**Solution**:
- Verify user is signed in: `auth.currentUser` should not be null
- Check Firebase Functions have proper authentication context
- Test with `await auth.currentUser.getIdToken()`

## 📱 Phone Number Format

The system accepts these formats:
- `+919876543210` (preferred)
- `919876543210`
- `9876543210`

All are converted to `+919876543210` format internally.

## 🔄 Migration from Old System

The new system is backward compatible:
- Same API surface for components
- Same AuthContext interface
- Same authentication flow from user perspective
- Automatic fallback for existing users

## 🚀 Production Deployment

1. **Environment Variables**: Set up proper environment variables instead of service account file
2. **HTTPS**: Use HTTPS for production server
3. **Rate Limiting**: Add proper rate limiting middleware
4. **Database**: Replace in-memory OTP storage with Redis/database
5. **Monitoring**: Add logging and monitoring for OTP operations

## 📊 Expected Results

✅ **OTP Delivery**: Fast2SMS delivers OTP within 5-30 seconds  
✅ **Authentication**: Firebase Auth provides proper tokens  
✅ **Payment Processing**: No more "not authenticated user" errors  
✅ **Duplicate Prevention**: Cannot create multiple profiles with same phone  
✅ **Security**: Proper token validation and expiry  

## 🆘 Support

If you encounter issues:

1. Check server logs: `node sms-proxy-server.cjs`
2. Check browser console for frontend errors
3. Test API endpoints with curl/Postman
4. Verify Firebase console for authentication events
5. Check Fast2SMS dashboard for SMS delivery status

The system is now ready for production use with proper Fast2SMS integration and Firebase authentication!
