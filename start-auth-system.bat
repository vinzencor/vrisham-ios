@echo off
echo ========================================
echo Starting Fast2SMS + Firebase Auth System
echo ========================================

echo.
echo Checking prerequisites...
echo -------------------------

REM Check if serviceAccountKey.json exists
if not exist "serviceAccountKey.json" (
    echo ❌ serviceAccountKey.json not found!
    echo.
    echo Please follow these steps:
    echo 1. Go to Firebase Console ^> Project Settings ^> Service Accounts
    echo 2. Click "Generate new private key"
    echo 3. Save the file as "serviceAccountKey.json" in this directory
    echo.
    echo See SETUP_SERVICE_ACCOUNT.md for detailed instructions.
    pause
    exit /b 1
)

echo ✅ Service account key found

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ Dependencies not installed!
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Dependencies installed

echo.
echo Starting services...
echo -------------------

REM Start SMS proxy server in background
echo 🚀 Starting SMS Proxy Server...
start "SMS Proxy Server" cmd /k "node sms-proxy-server.cjs"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Test server health
echo 🏥 Testing server health...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Server might not be ready yet, continuing anyway...
) else (
    echo ✅ SMS Proxy Server is healthy
)

echo.
echo 🌐 Starting Frontend Development Server...
start "Frontend Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo 🎉 Fast2SMS + Firebase Auth System Started!
echo ========================================
echo.
echo Services running:
echo 📱 SMS Proxy Server: http://localhost:3001
echo 🌐 Frontend App: http://localhost:5173
echo.
echo API Endpoints:
echo POST /api/send-otp - Send OTP via Fast2SMS
echo POST /api/verify-otp - Verify OTP and get Firebase token
echo GET /api/health - Server health check
echo.
echo Test the system:
echo 1. Open http://localhost:5173 in your browser
echo 2. Go to login page
echo 3. Enter your phone number
echo 4. Check SMS for OTP
echo 5. Enter OTP to complete authentication
echo.
echo Or run: node test-auth-server.js
echo.
echo Press any key to open browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo System is running! Check the opened browser window.
echo Close this window to stop all services.
echo.
pause
