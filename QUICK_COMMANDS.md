# Quick Commands Reference - SMS OTP Android Build

## Essential Commands

### 🚀 Quick Build (Windows)
```batch
build-android.bat
```

### 🚀 Quick Build (Linux/Mac)
```bash
./build-android.sh
```

### 📱 Manual Build Process
```bash
# 1. Install dependencies
npm install

# 2. Build web app
npm run build

# 3. Sync with Android
npx cap sync android

# 4. Build APK
cd android
./gradlew assembleDebug        # Debug APK
./gradlew assembleRelease      # Release APK
```

## Development Commands

### 🔧 Development Server
```bash
npm run dev
```

### 🧹 Clean Build
```bash
# Clean web build
rm -rf dist
npm run build

# Clean Android build
cd android
./gradlew clean
./gradlew assembleDebug
```

### 🔄 Reset Capacitor
```bash
npx cap remove android
npx cap add android
npx cap sync android
```

## Testing Commands

### 📱 Install APK
```bash
# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 🔍 Debug Logs
```bash
# View all logs
adb logcat

# Filter app logs
adb logcat | grep -i vrisham

# Clear logs
adb logcat -c
```

### 🌐 Test SMS Providers
```bash
# Test with mock provider
echo "VITE_SMS_PROVIDER=mock" >> .env
npm run build && npx cap sync android

# Test with Twilio
echo "VITE_SMS_PROVIDER=twilio" >> .env
npm run build && npx cap sync android
```

## Environment Setup

### 📋 Check Prerequisites
```bash
# Check Node.js
node --version

# Check npm
npm --version

# Check Android SDK
echo $ANDROID_HOME
adb version

# Check Java
java -version
```

### 🔑 Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

## Gradle Commands

### 🏗️ Build Variants
```bash
cd android

# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# All variants
./gradlew assemble
```

### 📊 Build Information
```bash
cd android

# List tasks
./gradlew tasks

# Build with info
./gradlew assembleDebug --info

# Build with debug output
./gradlew assembleDebug --debug
```

### 🧹 Gradle Maintenance
```bash
cd android

# Clean build
./gradlew clean

# Refresh dependencies
./gradlew --refresh-dependencies

# Build cache info
./gradlew --build-cache
```

## Capacitor Commands

### 🔄 Sync and Update
```bash
# Sync web assets to native
npx cap sync

# Sync specific platform
npx cap sync android

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap sync
```

### 📱 Platform Management
```bash
# Add Android platform
npx cap add android

# Remove Android platform
npx cap remove android

# Open in Android Studio
npx cap open android
```

### ℹ️ Capacitor Info
```bash
# Check Capacitor status
npx cap doctor

# List installed plugins
npx cap ls

# Check configuration
npx cap config
```

## Troubleshooting Commands

### 🔧 Fix Common Issues
```bash
# Fix npm issues
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Fix Capacitor issues
npx cap doctor
npx cap sync android

# Fix Gradle issues
cd android
./gradlew clean
./gradlew --stop
./gradlew assembleDebug
```

### 🔍 Debug Information
```bash
# Check build environment
npx cap doctor

# Check Android environment
adb devices
adb shell getprop ro.build.version.release

# Check app permissions
adb shell dumpsys package com.vrisham.customerapp | grep permission
```

## File Locations

### 📁 Important Paths
```
Web Build Output:     dist/
Android Project:      android/
APK Output (Debug):   android/app/build/outputs/apk/debug/
APK Output (Release): android/app/build/outputs/apk/release/
Environment File:     .env
Capacitor Config:     capacitor.config.ts
```

### 📝 Configuration Files
```
Package Config:       package.json
Capacitor Config:     capacitor.config.ts
Android Manifest:     android/app/src/main/AndroidManifest.xml
Gradle Build:         android/app/build.gradle
Environment:          .env
```

## Emergency Commands

### 🚨 Complete Reset
```bash
# Nuclear option - reset everything
rm -rf node_modules package-lock.json dist android
npm install
npx cap add android
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### 🔄 Quick Rebuild
```bash
# Quick rebuild after code changes
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```

### 📱 Quick Test Deploy
```bash
# Build and install in one command
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && adb install app/build/outputs/apk/debug/app-debug.apk
```
