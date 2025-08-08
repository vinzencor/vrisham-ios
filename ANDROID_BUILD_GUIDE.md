# Android APK Build Guide - Custom SMS OTP

This guide provides comprehensive instructions for building the Android APK with the new custom SMS OTP authentication system.

## Prerequisites

### 1. Development Environment
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Android Studio** (latest version)
- **Java Development Kit (JDK)** 11 or higher

### 2. Android SDK Setup
1. Install Android Studio
2. Open Android Studio → SDK Manager
3. Install required SDK platforms (API 21+)
4. Set `ANDROID_HOME` environment variable
5. Add Android SDK tools to PATH

### 3. Environment Variables
Ensure your `.env` file is configured with SMS provider credentials:
```env
VITE_SMS_PROVIDER=twilio
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

## Quick Build Commands

### Windows
```batch
# Run the automated build script
build-android.bat

# Or manual commands:
npm install
npm run build
npx cap sync android
cd android
gradlew assembleDebug
```

### Linux/Mac
```bash
# Run the automated build script
./build-android.sh

# Or manual commands:
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

## Step-by-Step Build Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Web Application
```bash
npm run build
```
This creates the `dist` folder with the compiled web application.

### 3. Sync with Capacitor
```bash
npx cap sync android
```
This copies the web assets to the Android project and updates native dependencies.

### 4. Open Android Project
```bash
npx cap open android
```
Or manually open `android` folder in Android Studio.

### 5. Build APK

#### Debug APK (for testing)
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK (for production)
```bash
cd android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

## Gradle Commands Reference

### Clean Build
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Build with Logs
```bash
cd android
./gradlew assembleDebug --info
```

### Build Specific Variant
```bash
cd android
./gradlew assembleDebug
./gradlew assembleRelease
```

### Generate Signed APK
1. Create keystore (one-time setup):
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

2. Configure `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword 'your-store-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build signed APK:
```bash
./gradlew assembleRelease
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

#### 2. Capacitor Sync Issues
```bash
# Remove and re-add Android platform
npx cap remove android
npx cap add android
npx cap sync android
```

#### 3. Environment Variable Issues
- Ensure `.env` file is in the root directory
- Rebuild web app after changing environment variables:
```bash
npm run build
npx cap sync android
```

#### 4. SMS Provider Issues
- Test with mock provider first:
```env
VITE_SMS_PROVIDER=mock
```
- Check network permissions in Android manifest
- Verify API credentials

#### 5. Android SDK Issues
```bash
# Check SDK installation
echo $ANDROID_HOME
ls $ANDROID_HOME/platform-tools
```

### Network Configuration

The app requires internet access for SMS API calls. Ensure these permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Testing the APK

#### 1. Install on Device/Emulator
```bash
# Using ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or drag and drop APK file to emulator
```

#### 2. Test SMS OTP Flow
1. Launch app on device
2. Enter phone number
3. Check SMS reception
4. Verify OTP entry
5. Test resend functionality

#### 3. Debug Issues
```bash
# View device logs
adb logcat | grep -i vrisham

# Or use Android Studio's Logcat
```

## Performance Optimization

### 1. Build Optimization
```bash
# Enable R8 code shrinking (in android/app/build.gradle)
android {
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2. APK Size Reduction
- Enable APK splitting by ABI
- Use vector drawables
- Optimize images and assets

### 3. Network Optimization
- Implement request caching
- Use connection pooling
- Handle network errors gracefully

## Deployment

### 1. Google Play Store
1. Generate signed release APK
2. Test thoroughly on multiple devices
3. Upload to Google Play Console
4. Configure store listing
5. Submit for review

### 2. Direct Distribution
1. Build release APK
2. Host on secure server
3. Provide download link
4. Enable "Unknown sources" on target devices

## Continuous Integration

### GitHub Actions Example
```yaml
name: Build Android APK
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - uses: actions/setup-java@v2
        with:
          java-version: '11'
      - run: npx cap sync android
      - run: cd android && ./gradlew assembleDebug
```

## Support and Maintenance

### Regular Updates
1. Update dependencies regularly
2. Test on new Android versions
3. Monitor SMS provider changes
4. Update security configurations

### Monitoring
- Implement crash reporting
- Monitor SMS delivery rates
- Track authentication success rates
- Monitor API usage and costs

## Next Steps

After successful APK build:
1. Test thoroughly on multiple devices
2. Configure production SMS provider
3. Set up monitoring and analytics
4. Plan deployment strategy
5. Prepare user documentation
