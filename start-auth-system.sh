#!/bin/bash

echo "========================================"
echo "Starting Fast2SMS + Firebase Auth System"
echo "========================================"

echo ""
echo "Checking prerequisites..."
echo "-------------------------"

# Check if serviceAccountKey.json exists
if [ ! -f "serviceAccountKey.json" ]; then
    echo "❌ serviceAccountKey.json not found!"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to Firebase Console > Project Settings > Service Accounts"
    echo "2. Click 'Generate new private key'"
    echo "3. Save the file as 'serviceAccountKey.json' in this directory"
    echo ""
    echo "See SETUP_SERVICE_ACCOUNT.md for detailed instructions."
    exit 1
fi

echo "✅ Service account key found"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed!"
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Dependencies installed"

echo ""
echo "Starting services..."
echo "-------------------"

# Start SMS proxy server in background
echo "🚀 Starting SMS Proxy Server..."
node sms-proxy-server.cjs &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Test server health
echo "🏥 Testing server health..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ SMS Proxy Server is healthy"
else
    echo "⚠️  Server might not be ready yet, continuing anyway..."
fi

echo ""
echo "🌐 Starting Frontend Development Server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "🎉 Fast2SMS + Firebase Auth System Started!"
echo "========================================"
echo ""
echo "Services running:"
echo "📱 SMS Proxy Server: http://localhost:3001"
echo "🌐 Frontend App: http://localhost:5173"
echo ""
echo "API Endpoints:"
echo "POST /api/send-otp - Send OTP via Fast2SMS"
echo "POST /api/verify-otp - Verify OTP and get Firebase token"
echo "GET /api/health - Server health check"
echo ""
echo "Test the system:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Go to login page"
echo "3. Enter your phone number"
echo "4. Check SMS for OTP"
echo "5. Enter OTP to complete authentication"
echo ""
echo "Or run: node test-auth-server.js"
echo ""

# Try to open browser (works on most systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173
elif command -v open > /dev/null; then
    open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo ""
echo "System is running! Press Ctrl+C to stop all services."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $SERVER_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait
