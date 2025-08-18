#!/bin/bash

# Vrisham Customer App - iOS Production Build Script
# This script prepares the app for App Store submission

echo "🚀 Starting iOS Production Build for Vrisham Customer App"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found. Please create it with your production API keys."
    exit 1
fi

echo "✅ Environment files found"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf ios/App/App/public/
rm -rf node_modules/.vite/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the app with production environment
echo "🔨 Building app for production..."
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully"

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync ios

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed."
    exit 1
fi

echo "✅ Capacitor sync completed"

# Validate iOS configuration
echo "🔍 Validating iOS configuration..."

# Check if Info.plist has required privacy descriptions
if ! grep -q "NSLocationWhenInUseUsageDescription" ios/App/App/Info.plist; then
    echo "❌ Missing NSLocationWhenInUseUsageDescription in Info.plist"
    exit 1
fi

if ! grep -q "NSCameraUsageDescription" ios/App/App/Info.plist; then
    echo "❌ Missing NSCameraUsageDescription in Info.plist"
    exit 1
fi

echo "✅ iOS configuration validated"

# Check for test files that shouldn't be in production
echo "🔍 Checking for test files..."
if find ios/App/App/public -name "*test*" -type f | grep -q .; then
    echo "❌ Test files found in production build. Please remove them."
    find ios/App/App/public -name "*test*" -type f
    exit 1
fi

echo "✅ No test files found"

# Open Xcode for final build and submission
echo "🍎 Opening Xcode for final build and submission..."
npx cap open ios

echo ""
echo "🎉 Production build preparation completed!"
echo ""
echo "Next steps in Xcode:"
echo "1. Select 'Any iOS Device (arm64)' as the build target"
echo "2. Go to Product → Archive"
echo "3. Once archived, click 'Distribute App'"
echo "4. Choose 'App Store Connect'"
echo "5. Follow the upload process"
echo ""
echo "Make sure to:"
echo "- Update version number if needed"
echo "- Test on a physical device before submitting"
echo "- Review App Store Connect for any additional requirements"
echo ""
echo "Good luck with your App Store submission! 🚀"
