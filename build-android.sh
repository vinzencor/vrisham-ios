#!/bin/bash

# ========================================
# Android APK Build Script for Linux/Mac
# Custom SMS OTP Authentication System
# ========================================

echo ""
echo "========================================"
echo "  Vrisham Customer App - Android Build"
echo "  Custom SMS OTP Authentication"
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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
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

# Check if npm is available
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not available"
    exit 1
fi

# Check if Capacitor CLI is installed
print_status "Checking Capacitor CLI..."
if ! npx @capacitor/cli --version &> /dev/null; then
    print_warning "Capacitor CLI not found, installing..."
    npm install -g @capacitor/cli
fi

print_success "Prerequisites check passed"
echo ""

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Build the web application
print_status "Building web application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Web build failed"
    exit 1
fi

print_success "Web build completed"
echo ""

# Sync with Capacitor
print_status "Syncing with Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    print_error "Capacitor sync failed"
    exit 1
fi

print_success "Capacitor sync completed"
echo ""

# Check if Android SDK is available
print_status "Checking Android environment..."
if [ -z "$ANDROID_HOME" ] || [ ! -f "$ANDROID_HOME/platform-tools/adb" ]; then
    print_warning "Android SDK not found in ANDROID_HOME"
    echo "Please ensure Android Studio is installed and ANDROID_HOME is set"
    echo ""
    echo "You can still continue and open the project in Android Studio manually"
    echo "Project location: $(pwd)/android"
    echo ""
    read -p "Continue anyway? (y/n): " choice
    if [[ ! "$choice" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Make gradlew executable
if [ -f "android/gradlew" ]; then
    chmod +x android/gradlew
fi

echo ""
echo "🚀 Build process completed!"
echo ""
echo "Next steps:"
echo "1. Open Android Studio"
echo "2. Open project: $(pwd)/android"
echo "3. Build APK: Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo ""
echo "Or run the following commands:"
echo "  cd android"
echo "  ./gradlew assembleDebug     (for debug APK)"
echo "  ./gradlew assembleRelease   (for release APK)"
echo ""

read -p "Open Android Studio now? (y/n): " open_studio
if [[ "$open_studio" =~ ^[Yy]$ ]]; then
    echo "Opening Android Studio..."
    if command -v studio &> /dev/null; then
        studio "$(pwd)/android" &
    elif [ -d "/Applications/Android Studio.app" ]; then
        open -a "Android Studio" "$(pwd)/android"
    else
        print_warning "Android Studio command not found. Please open manually:"
        echo "Project location: $(pwd)/android"
    fi
fi

echo ""
print_success "Android build setup completed!"
echo ""
