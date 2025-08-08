#!/bin/bash

# Firebase Functions Deployment Script for Vrisham Organic
# This script helps deploy Firebase Functions with proper configuration

echo "🚀 Firebase Functions Deployment Script"
echo "========================================"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo "❌ functions directory not found."
    exit 1
fi

echo "✅ Environment checks passed"

# Login to Firebase (if not already logged in)
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase:"
    firebase login
fi

# Set the project
echo "📋 Setting Firebase project..."
firebase use vrisham-cad24

# Install dependencies
echo "📦 Installing function dependencies..."
cd functions
npm install

# Build functions
echo "🔨 Building functions..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

cd ..

# Check if configuration is set
echo "⚙️  Checking Firebase Functions configuration..."
CONFIG_CHECK=$(firebase functions:config:get 2>/dev/null)

if [[ $CONFIG_CHECK == *"razorpay"* ]]; then
    echo "✅ Razorpay configuration found"
else
    echo "⚠️  Razorpay configuration not found. Setting up..."
    echo "Please enter your Razorpay credentials:"
    
    read -p "Razorpay Key ID: " RAZORPAY_KEY_ID
    read -s -p "Razorpay Key Secret: " RAZORPAY_KEY_SECRET
    echo
    read -s -p "Razorpay Webhook Secret: " RAZORPAY_WEBHOOK_SECRET
    echo
    
    firebase functions:config:set \
        razorpay.key_id="$RAZORPAY_KEY_ID" \
        razorpay.key_secret="$RAZORPAY_KEY_SECRET" \
        razorpay.webhook_secret="$RAZORPAY_WEBHOOK_SECRET"
    
    echo "✅ Configuration set successfully"
fi

# Ask for deployment confirmation
echo
echo "🚀 Ready to deploy functions to Firebase project: vrisham-cad24"
echo
echo "Functions to be deployed:"
echo "  - razorpayWebhook (HTTP)"
echo "  - verifyPayment (Callable)"
echo "  - markPaymentFailed (Callable)"
echo "  - createRazorpayOrder (Callable)"
echo "  - retryPayment (Callable)"
echo "  - getPaymentStatus (Callable)"
echo "  - cleanupExpiredOrders (Scheduled)"
echo "  - manualOrderCleanup (Callable)"
echo "  - getCleanupStats (Callable)"
echo "  - onOrderStatusUpdate (Firestore Trigger)"
echo

read -p "Do you want to proceed with deployment? (y/N): " CONFIRM

if [[ $CONFIRM =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying functions..."
    firebase deploy --only functions
    
    if [ $? -eq 0 ]; then
        echo
        echo "✅ Deployment successful!"
        echo
        echo "📋 Important URLs:"
        echo "Webhook URL: https://us-central1-vrisham-cad24.cloudfunctions.net/razorpayWebhook"
        echo
        echo "📝 Next steps:"
        echo "1. Configure the webhook URL in your Razorpay dashboard"
        echo "2. Update your client-side code to use the new callable functions"
        echo "3. Test the payment flow end-to-end"
        echo
        echo "🔍 Monitor function logs:"
        echo "firebase functions:log"
    else
        echo "❌ Deployment failed. Please check the errors above."
        exit 1
    fi
else
    echo "❌ Deployment cancelled."
    exit 0
fi
