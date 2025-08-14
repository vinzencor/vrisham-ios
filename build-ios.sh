#!/bin/bash

# iOS Build Script using Ionic CLI
# This script builds the web app and syncs it to iOS using Ionic CLI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🍎 iOS Build Script - Ionic CLI + Capacitor"
echo "=============================================="
echo ""

# Check if npm is available
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not available"
    exit 1
fi

# Check if Ionic CLI is installed
print_status "Checking Ionic CLI..."
if ! command -v ionic &> /dev/null; then
    print_warning "Ionic CLI not found, installing..."
    npm install -g @ionic/cli
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

# Build the web application using Ionic CLI
print_status "Building web application with Ionic CLI..."
ionic build
if [ $? -ne 0 ]; then
    print_error "Ionic build failed"
    exit 1
fi

print_success "Web build completed"
echo ""

# Sync with Capacitor using Ionic CLI
print_status "Syncing with iOS using Ionic CLI..."
ionic cap sync ios
if [ $? -ne 0 ]; then
    print_error "Ionic Capacitor sync failed"
    exit 1
fi

print_success "iOS sync completed"
echo ""

# Install iOS dependencies
print_status "Installing iOS dependencies..."
cd ios/App
pod install --repo-update
if [ $? -ne 0 ]; then
    print_error "Pod install failed"
    exit 1
fi

print_success "iOS dependencies installed"
echo ""

# Check if Xcode is available
print_status "Checking Xcode environment..."
if ! command -v xcodebuild &> /dev/null; then
    print_warning "Xcode command line tools not found"
    print_warning "You can still open the project in Xcode manually"
    echo ""
    echo "Project location: $(pwd)"
    echo "Open App.xcworkspace in Xcode to build and deploy"
    exit 0
fi

print_success "Build completed successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Open ios/App/App.xcworkspace in Xcode"
echo "2. Select your development team and signing certificate"
echo "3. Build and run on device or simulator"
echo "4. For App Store: Archive → Distribute App → App Store Connect"
echo ""
echo "📱 Or use Ionic CLI:"
echo "   ionic cap run ios --device    # Run on connected device"
echo "   ionic cap open ios           # Open in Xcode"
