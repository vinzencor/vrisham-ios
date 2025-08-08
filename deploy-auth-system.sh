#!/bin/bash

echo "========================================"
echo "Deploying Integrated Authentication System"
echo "========================================"

echo ""
echo "1. Deploying Firestore Security Rules..."
echo "----------------------------------------"
firebase deploy --only firestore:rules
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to deploy Firestore rules"
    exit 1
fi
echo "✅ Firestore rules deployed successfully"

echo ""
echo "2. Deploying Firebase Functions..."
echo "----------------------------------"
firebase deploy --only functions
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to deploy Firebase Functions"
    exit 1
fi
echo "✅ Firebase Functions deployed successfully"

echo ""
echo "3. Building and deploying web app..."
echo "------------------------------------"
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build web app"
    exit 1
fi

firebase deploy --only hosting
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to deploy web app"
    exit 1
fi
echo "✅ Web app deployed successfully"

echo ""
echo "========================================"
echo "🎉 Integrated Authentication System Deployed!"
echo "========================================"
echo ""
echo "The system now includes:"
echo "✅ Fast2SMS OTP verification"
echo "✅ Proper Firebase Auth integration"
echo "✅ Phone number uniqueness enforcement"
echo "✅ Payment authentication fix"
echo "✅ Firestore security rules"
echo ""
echo "Next steps:"
echo "1. Test authentication flow with real phone number"
echo "2. Test payment processing"
echo "3. Verify no duplicate profiles can be created"
echo ""
