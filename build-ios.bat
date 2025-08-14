@echo off
setlocal enabledelayedexpansion

REM iOS Build Script using Ionic CLI
REM This script builds the web app and syncs it to iOS using Ionic CLI

echo 🍎 iOS Build Script - Ionic CLI + Capacitor
echo ==============================================
echo.

REM Check if npm is available
echo 📋 Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

REM Check if Ionic CLI is installed
echo 📋 Checking Ionic CLI...
ionic --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ionic CLI not found, installing...
    npm install -g @ionic/cli
)

echo ✅ Prerequisites check passed
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Build the web application using Ionic CLI
echo 🔨 Building web application with Ionic CLI...
call ionic build
if %errorlevel% neq 0 (
    echo ❌ Ionic build failed
    pause
    exit /b 1
)

echo ✅ Web build completed
echo.

REM Sync with Capacitor using Ionic CLI
echo 🔄 Syncing with iOS using Ionic CLI...
ionic cap sync ios
if %errorlevel% neq 0 (
    echo ❌ Ionic Capacitor sync failed
    pause
    exit /b 1
)

echo ✅ iOS sync completed
echo.

REM Install iOS dependencies (requires macOS)
echo 📋 Checking for macOS environment...
if not exist "ios\App\Podfile" (
    echo ❌ iOS project not found or not on macOS
    echo This script needs to run on macOS for iOS development
    pause
    exit /b 1
)

echo 📦 Installing iOS dependencies...
cd ios\App
pod install --repo-update
if %errorlevel% neq 0 (
    echo ❌ Pod install failed
    echo Make sure you're running this on macOS with CocoaPods installed
    pause
    exit /b 1
)

echo ✅ iOS dependencies installed
echo.

echo ✅ Build completed successfully!
echo.
echo 🎯 Next Steps:
echo 1. Open ios/App/App.xcworkspace in Xcode
echo 2. Select your development team and signing certificate
echo 3. Build and run on device or simulator
echo 4. For App Store: Archive → Distribute App → App Store Connect
echo.
echo 📱 Or use Ionic CLI:
echo    ionic cap run ios --device    # Run on connected device
echo    ionic cap open ios           # Open in Xcode
echo.
pause
