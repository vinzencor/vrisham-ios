@echo off
echo ========================================
echo Deploying Integrated Authentication System
echo ========================================

echo.
echo 1. Deploying Firestore Security Rules...
echo ----------------------------------------
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy Firestore rules
    pause
    exit /b 1
)
echo ✅ Firestore rules deployed successfully

echo.
echo 2. Deploying Firebase Functions...
echo ----------------------------------
firebase deploy --only functions
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy Firebase Functions
    pause
    exit /b 1
)
echo ✅ Firebase Functions deployed successfully

echo.
echo 3. Building and deploying web app...
echo ------------------------------------
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build web app
    pause
    exit /b 1
)

firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy web app
    pause
    exit /b 1
)
echo ✅ Web app deployed successfully

echo.
echo ========================================
echo 🎉 Integrated Authentication System Deployed!
echo ========================================
echo.
echo The system now includes:
echo ✅ Fast2SMS OTP verification
echo ✅ Proper Firebase Auth integration
echo ✅ Phone number uniqueness enforcement
echo ✅ Payment authentication fix
echo ✅ Firestore security rules
echo.
echo Next steps:
echo 1. Test authentication flow with real phone number
echo 2. Test payment processing
echo 3. Verify no duplicate profiles can be created
echo.
pause
