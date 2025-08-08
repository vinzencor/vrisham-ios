# Netlify Deployment Guide - SMS OTP System

This guide shows how to deploy your Vrisham Customer App with SMS OTP functionality to Netlify.

## 🚀 Solution Overview

**Problem**: Netlify is a static hosting service and can't run Node.js servers like `sms-proxy-simple.cjs`

**Solution**: Convert the SMS proxy to Netlify Functions (serverless functions)

## ✅ What's Been Set Up

### **1. Netlify Function Created**
- **File**: `netlify/functions/send-sms.js`
- **Purpose**: Handles SMS OTP requests serverlessly
- **Endpoint**: `/.netlify/functions/send-sms`

### **2. Netlify Configuration**
- **File**: `netlify.toml`
- **Redirects**: `/api/send-sms` → `/.netlify/functions/send-sms`
- **Build Settings**: Configured for Vite build process

### **3. Code Updated**
- **SMS Service**: Already configured to use `/api/send-sms`
- **Environment Variables**: Set up for both development and production

## 🔧 Deployment Steps

### **Step 1: Prepare Your Repository**

1. **Commit all changes** to your Git repository:
   ```bash
   git add .
   git commit -m "Add Netlify Functions for SMS OTP"
   git push origin main
   ```

### **Step 2: Deploy to Netlify**

#### **Option A: Connect GitHub Repository (Recommended)**

1. **Go to Netlify**: [netlify.com](https://netlify.com)
2. **Sign up/Login** with your GitHub account
3. **New site from Git** → Choose your repository
4. **Build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

#### **Option B: Manual Deploy**

1. **Build locally**:
   ```bash
   npm run build
   ```
2. **Drag and drop** the `dist` folder to Netlify
3. **Upload functions** separately (not recommended)

### **Step 3: Configure Environment Variables**

In Netlify Dashboard → Site Settings → Environment Variables:

```
FAST2SMS_API_KEY = ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9pYtn4Deg9ky3r67fHjldFibNEQWKSI
```

### **Step 4: Update Fast2SMS Domain Verification**

1. **Get your Netlify domain** (e.g., `amazing-app-123.netlify.app`)
2. **Add domain to Fast2SMS** dashboard for verification
3. **Meta tag is already included** in your HTML

## 🧪 Testing Deployment

### **After Deployment:**

1. **Open your Netlify URL**
2. **Test SMS OTP flow**:
   - Click Login/Profile
   - Enter phone number
   - Click "Send OTP"
   - Check phone for SMS
   - Enter OTP to complete authentication

### **Function Logs:**
- **Netlify Dashboard** → Functions → View logs
- **Real-time monitoring** of SMS requests

## 🔄 Development vs Production

### **Local Development:**
```
Web App → Vite Proxy → SMS Proxy Server (Node.js) → Fast2SMS
```

### **Netlify Production:**
```
Web App → Netlify Functions → Fast2SMS
```

## 📱 Android APK Build

The Android APK will work with the deployed Netlify site:

### **Update Capacitor Config:**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.vrisham.customerapp',
  appName: 'Vrisham Customer',
  webDir: 'dist',
  server: {
    url: 'https://your-app.netlify.app', // Your Netlify URL
    cleartext: true
  }
};
```

### **Build APK:**
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

## 🔧 Troubleshooting

### **If SMS doesn't work on Netlify:**

1. **Check Function Logs**:
   - Netlify Dashboard → Functions → send-sms → View logs

2. **Verify Environment Variables**:
   - Site Settings → Environment Variables
   - Ensure `FAST2SMS_API_KEY` is set

3. **Test Function Directly**:
   ```bash
   curl -X POST https://your-app.netlify.app/.netlify/functions/send-sms \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+919876543210", "message": "Test OTP: 123456"}'
   ```

4. **Check Fast2SMS Dashboard**:
   - Verify account balance
   - Check delivery reports

### **Common Issues:**

- **Function timeout**: Increase timeout in `netlify.toml`
- **CORS errors**: Check headers in function
- **Environment variables**: Ensure they're set in Netlify dashboard

## 🎯 Benefits of Netlify Functions

### **Advantages:**
- ✅ **No server management**: Serverless architecture
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Cost-effective**: Pay per request
- ✅ **Global CDN**: Fast worldwide access
- ✅ **HTTPS by default**: Secure connections
- ✅ **Easy deployment**: Git-based workflow

### **vs Traditional Server:**
- ❌ No need to manage `sms-proxy-simple.cjs`
- ❌ No need to keep server running 24/7
- ❌ No server costs or maintenance

## 🚀 Next Steps

1. **Deploy to Netlify** using the steps above
2. **Test SMS functionality** on the live site
3. **Update Android APK** to use Netlify URL
4. **Monitor function usage** in Netlify dashboard

## 📋 Quick Checklist

- [ ] Repository pushed to GitHub
- [ ] Netlify site connected to repository
- [ ] Environment variables configured
- [ ] SMS OTP tested on live site
- [ ] Fast2SMS domain verification updated
- [ ] Android APK updated with Netlify URL

**Your SMS OTP system is now ready for production deployment on Netlify!** 🎉
