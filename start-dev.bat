@echo off
REM ========================================
REM Development Startup Script
REM Starts SMS Proxy Server and Vite Dev Server
REM ========================================

echo.
echo ========================================
echo   Vrisham Customer App - Development
echo   Fast2SMS Integration with Proxy
echo ========================================
echo.

REM Check if Node.js is installed
echo 📋 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is available
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo 📡 Starting SMS Proxy Server...
start "SMS Proxy Server" cmd /k "node sms-proxy-server.cjs"

REM Wait a moment for proxy server to start
timeout /t 3 /nobreak >nul

echo 🚀 Starting Vite Development Server...
echo.
echo Available at:
echo   📱 Web App: http://localhost:5173/
echo   📡 SMS Proxy: http://localhost:3001/
echo.
echo 🧪 To test SMS functionality:
echo   1. Open http://localhost:5173/
echo   2. Try the authentication flow
echo   3. Or run: node test-proxy.js
echo.

REM Start Vite dev server
call npm run dev

echo.
echo 👋 Development servers stopped.
pause
