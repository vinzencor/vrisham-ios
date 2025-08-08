#!/bin/bash

# ========================================
# Development Startup Script
# Starts SMS Proxy Server and Vite Dev Server
# ========================================

echo ""
echo "========================================"
echo "  Vrisham Customer App - Development"
echo "  Fast2SMS Integration with Proxy"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

print_success "Node.js is available"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

print_status "Starting SMS Proxy Server..."
node sms-proxy-server.cjs &
PROXY_PID=$!

# Wait a moment for proxy server to start
sleep 3

print_status "Starting Vite Development Server..."
echo ""
echo "Available at:"
echo "  📱 Web App: http://localhost:5173/"
echo "  📡 SMS Proxy: http://localhost:3001/"
echo ""
echo "🧪 To test SMS functionality:"
echo "  1. Open http://localhost:5173/"
echo "  2. Try the authentication flow"
echo "  3. Or run: node test-proxy.js"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    print_status "Stopping servers..."
    kill $PROXY_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Vite dev server
npm run dev

# Cleanup when npm run dev exits
cleanup
