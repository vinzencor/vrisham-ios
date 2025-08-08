@echo off
REM Firebase Functions Deployment Script for Vrisham Organic (Windows)
REM This script helps deploy Firebase Functions with proper configuration

echo 🚀 Firebase Functions Deployment Script
echo ========================================

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed. Please install it first:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist firebase.json (
    echo ❌ firebase.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if functions directory exists
if not exist functions (
    echo ❌ functions directory not found.
    pause
    exit /b 1
)

echo ✅ Environment checks passed

REM Login to Firebase (if not already logged in)
echo 🔐 Checking Firebase authentication...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Firebase:
    firebase login
)

REM Set the project
echo 📋 Setting Firebase project...
firebase use vrisham-cad24

REM Install dependencies
echo 📦 Installing function dependencies...
cd functions
call npm install

REM Build functions
echo 🔨 Building functions...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors and try again.
    pause
    exit /b 1
)

cd ..

REM Check if configuration is set
echo ⚙️  Checking Firebase Functions configuration...
firebase functions:config:get >config_check.tmp 2>nul
findstr "razorpay" config_check.tmp >nul
if %errorlevel% neq 0 (
    echo ⚠️  Razorpay configuration not found. Setting up...
    echo Please enter your Razorpay credentials:
    
    set /p RAZORPAY_KEY_ID="Razorpay Key ID: "
    set /p RAZORPAY_KEY_SECRET="Razorpay Key Secret: "
    set /p RAZORPAY_WEBHOOK_SECRET="Razorpay Webhook Secret: "
    
    firebase functions:config:set razorpay.key_id="%RAZORPAY_KEY_ID%" razorpay.key_secret="%RAZORPAY_KEY_SECRET%" razorpay.webhook_secret="%RAZORPAY_WEBHOOK_SECRET%"
    
    echo ✅ Configuration set successfully
) else (
    echo ✅ Razorpay configuration found
)
del config_check.tmp >nul 2>&1

REM Ask for deployment confirmation
echo.
echo 🚀 Ready to deploy functions to Firebase project: vrisham-cad24
echo.
echo Functions to be deployed:
echo   - razorpayWebhook (HTTP)
echo   - verifyPayment (Callable)
echo   - markPaymentFailed (Callable)
echo   - createRazorpayOrder (Callable)
echo   - retryPayment (Callable)
echo   - getPaymentStatus (Callable)
echo   - cleanupExpiredOrders (Scheduled)
echo   - manualOrderCleanup (Callable)
echo   - getCleanupStats (Callable)
echo   - onOrderStatusUpdate (Firestore Trigger)
echo.

set /p CONFIRM="Do you want to proceed with deployment? (y/N): "
if /i "%CONFIRM%"=="y" (
    echo 🚀 Deploying functions...
    firebase deploy --only functions
    
    if %errorlevel% equ 0 (
        echo.
        echo ✅ Deployment successful!
        echo.
        echo 📋 Important URLs:
        echo Webhook URL: https://us-central1-vrisham-cad24.cloudfunctions.net/razorpayWebhook
        echo.
        echo 📝 Next steps:
        echo 1. Configure the webhook URL in your Razorpay dashboard
        echo 2. Update your client-side code to use the new callable functions
        echo 3. Test the payment flow end-to-end
        echo.
        echo 🔍 Monitor function logs:
        echo firebase functions:log
    ) else (
        echo ❌ Deployment failed. Please check the errors above.
        pause
        exit /b 1
    )
) else (
    echo ❌ Deployment cancelled.
    exit /b 0
)

pause
