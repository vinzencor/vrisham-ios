# SMS OTP Setup Guide

This guide will help you set up the custom SMS OTP authentication system that replaces Firebase phone authentication.

## Overview

The new SMS OTP system:
- ✅ Works in both web and Android APK environments
- ✅ Supports multiple SMS providers (Fast2SMS, Twilio, AWS SNS, Mock)
- ✅ Maintains compatibility with existing authentication flow
- ✅ Provides 6-digit OTP verification
- ✅ Includes rate limiting and security features
- ✅ Optimized for Indian phone numbers with Fast2SMS

## Prerequisites

1. **SMS Provider Account**: Choose one of the following:
   - **Fast2SMS** (Recommended for Indian numbers)
   - **Twilio** (International support)
   - **AWS SNS** (Enterprise option)
   - **Mock Provider** (Development/testing only)

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Configure SMS Provider

#### Option A: Fast2SMS (Recommended for India)

1. **Create Fast2SMS Account**:
   - Go to [Fast2SMS.com](https://www.fast2sms.com/)
   - Sign up for a new account
   - Complete phone number verification
   - Purchase SMS credits

2. **Get Fast2SMS API Key**:
   - Go to Dashboard → API Keys
   - Copy your API key

3. **Update .env file**:
   ```env
   VITE_SMS_PROVIDER=fast2sms
   VITE_FAST2SMS_API_KEY=ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9pYtn4Deg9ky3r67fHjldFibNEQWKSI
   ```

#### Option B: Twilio (International)

1. **Create Twilio Account**:
   - Go to [Twilio Console](https://console.twilio.com/)
   - Sign up for a new account or log in
   - Complete phone number verification

2. **Get Twilio Credentials**:
   - Account SID: Found on your Twilio Console Dashboard
   - Auth Token: Found on your Twilio Console Dashboard
   - Phone Number: Purchase a phone number from Twilio Console

3. **Update .env file**:
   ```env
   VITE_SMS_PROVIDER=twilio
   VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
   VITE_TWILIO_PHONE_NUMBER=+1234567890
   ```

#### Option C: AWS SNS

1. **AWS Account Setup**:
   - Create AWS account or use existing
   - Create IAM user with SNS permissions
   - Get Access Key ID and Secret Access Key

2. **Update .env file**:
   ```env
   VITE_SMS_PROVIDER=aws
   VITE_AWS_ACCESS_KEY_ID=your_access_key_id
   VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key
   VITE_AWS_REGION=us-east-1
   ```

#### Option D: Mock Provider (Development Only)

```env
VITE_SMS_PROVIDER=mock
```

### 3. Install Dependencies

The required dependencies are already included in package.json. If you need to install them manually:

```bash
npm install
```

### 4. Test the Setup

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test OTP Flow**:
   - Open the application
   - Try to log in with a phone number
   - Check console logs for SMS sending confirmation
   - For mock provider, OTP will be logged to console

## SMS Provider Comparison

| Feature | Twilio | AWS SNS | Mock |
|---------|--------|---------|------|
| Production Ready | ✅ | ✅ | ❌ |
| Global Coverage | ✅ | ✅ | N/A |
| Easy Setup | ✅ | ⚠️ | ✅ |
| Cost | $$ | $ | Free |
| Reliability | High | High | N/A |

## Security Features

The SMS OTP system includes:

- **Rate Limiting**: Max 5 OTP requests per phone number per hour
- **OTP Expiry**: OTPs expire after 5 minutes
- **Attempt Limiting**: Max 3 verification attempts per OTP
- **Resend Cooldown**: 30-second cooldown between resend requests
- **Phone Number Validation**: E.164 format validation

## Troubleshooting

### Common Issues

1. **SMS Not Received**:
   - Check SMS provider credentials
   - Verify phone number format (+91xxxxxxxxxx for India)
   - Check SMS provider account balance/limits

2. **OTP Verification Fails**:
   - Ensure OTP is entered within 5 minutes
   - Check for typos in OTP entry
   - Verify OTP hasn't exceeded 3 attempts

3. **Rate Limiting**:
   - Wait for cooldown period to expire
   - Check rate limiting logs in console

### Debug Mode

Enable debug logging by setting:
```env
VITE_NODE_ENV=development
```

This will show detailed logs in the browser console.

## Production Deployment

### Environment Variables for Production

1. **Vercel/Netlify**:
   - Add environment variables in dashboard
   - Ensure all VITE_ prefixed variables are set

2. **Android APK**:
   - Environment variables are bundled during build
   - Rebuild APK after changing environment variables

### Security Considerations

1. **API Keys**:
   - Never commit .env files to version control
   - Use different credentials for development/production
   - Rotate API keys regularly

2. **Rate Limiting**:
   - Consider implementing server-side rate limiting
   - Monitor SMS usage and costs

3. **Phone Number Verification**:
   - Implement additional verification for sensitive operations
   - Consider two-factor authentication for admin users

## Migration from Firebase Auth

The system maintains compatibility with existing Firebase Auth flow:

1. **User Data**: Existing user data in Firestore remains unchanged
2. **Authentication State**: Managed through custom auth service
3. **API Compatibility**: Same function signatures as Firebase Auth

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify environment variable configuration
3. Test with mock provider first
4. Check SMS provider documentation

## Next Steps

After setup:
1. Test authentication flow thoroughly
2. Configure production SMS provider
3. Update Android build configuration
4. Deploy and test APK build
