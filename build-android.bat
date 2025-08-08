@echo off
REM ========================================
REM Android APK Build Script for Windows
REM Custom SMS OTP Authentication System
REM ========================================

echo.
echo ========================================
echo   Vrisham Customer App - Android Build
echo   Custom SMS OTP Authentication
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

REM Check if npm is available
echo 📋 Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

REM Check if Capacitor CLI is installed
echo 📋 Checking Capacitor CLI...
npx @capacitor/cli --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Capacitor CLI not found, installing...
    npm install -g @capacitor/cli
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

REM Build the web application
echo 🔨 Building web application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Web build failed
    pause
    exit /b 1
)

echo ✅ Web build completed
echo.

REM Sync with Capacitor
echo 🔄 Syncing with Capacitor...
npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed
    pause
    exit /b 1
)

echo ✅ Capacitor sync completed
echo.

REM Check if Android Studio/SDK is available
echo 📋 Checking Android environment...
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ⚠️  Android SDK not found in ANDROID_HOME
    echo Please ensure Android Studio is installed and ANDROID_HOME is set
    echo.
    echo You can still continue and open the project in Android Studio manually
    echo Project location: %CD%\android
    echo.
    set /p choice="Continue anyway? (y/n): "
    if /i not "%choice%"=="y" (
        pause
        exit /b 1
    )
)

REM Open Android project (optional)
echo.
echo 🚀 Build process completed!
echo.
echo Next steps:
echo 1. Open Android Studio
echo 2. Open project: %CD%\android
echo 3. Build APK: Build → Build Bundle(s) / APK(s) → Build APK(s)
echo.
echo Or run the following commands:
echo   cd android
echo   ./gradlew assembleDebug     (for debug APK)
echo   ./gradlew assembleRelease   (for release APK)
echo.

set /p open_studio="Open Android Studio now? (y/n): "
if /i "%open_studio%"=="y" (
    echo Opening Android Studio...
    start "" "studio" "%CD%\android"
)

echo.
echo ✅ Android build setup completed!
echo.
pause
