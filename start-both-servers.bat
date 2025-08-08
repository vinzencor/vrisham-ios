@echo off
REM ========================================
REM Start Both SMS Proxy and Web Dev Server
REM ========================================

echo.
echo ========================================
echo   Starting Vrisham Development Servers
echo ========================================
echo.

REM Start SMS Proxy Server in background
echo 📡 Starting SMS Proxy Server...
start "SMS Proxy Server" /min cmd /k "cd /d %~dp0 && node sms-proxy-simple.cjs"

REM Wait a moment for proxy to start
timeout /t 3 /nobreak >nul

REM Start Vite Development Server
echo 🚀 Starting Web Development Server...
echo.
echo Available at:
echo   📱 Web App: http://localhost:5173/ (or next available port)
echo   📡 SMS Proxy: http://localhost:3001/
echo.

call npm run dev

echo.
echo 👋 Development servers stopped.
pause
