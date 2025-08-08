# Complete Build and Android Module Fix

## 🚨 Issues Identified

1. **Firebase Import Error**: `setDocument` is not exported by Firebase Firestore
2. **Android Module Error**: "Module not specified" in Android Studio
3. **Build Hanging**: Vite build process getting stuck

## 🔧 Complete Fix

### Step 1: Fix Firebase Imports (Already Done)

The Firebase import issues in `src/firebase/customTokenAuth.ts` have been fixed:
- ✅ Replaced `setDocument` with `setDoc`
- ✅ Replaced `updateDocument` with `updateDoc`  
- ✅ Replaced `getDocument` with `getDoc`
- ✅ Updated all Firestore function calls

### Step 2: Quick Android Fix (Bypass Build Issues)

Since the build is hanging, let's fix the Android module error directly:

```bash
# Clean Capacitor cache
npx cap sync android --force

# Clean Android build
cd android
gradlew clean
cd ..

# Update Capacitor
npx cap update android

# Open Android Studio
npx cap open android
```

### Step 3: Alternative - Use Existing Authentication

If the custom token approach is causing issues, you can temporarily revert to the working authentication system:

1. **Revert AuthContext import**:
   ```typescript
   // In src/contexts/AuthContext.tsx
   // Change from:
   import { ... } from '../firebase/customTokenAuth';
   // Back to:
   import { ... } from '../firebase/integratedAuth';
   ```

2. **Revert component imports**:
   ```typescript
   // In src/components/profile/AuthModal.tsx and src/components/Login.tsx
   // Change from:
   import { sendOTP, verifyOTPAndAuthenticate } from '../../firebase/customTokenAuth';
   // Back to:
   import { sendOTP, verifyOTPAndAuthenticate } from '../../firebase/integratedAuth';
   ```

### Step 4: Test Build

```bash
# Try building again
npm run build

# If successful, sync with Android
npx cap sync android
npx cap open android
```

## 🚀 Quick Android Studio Fix

If you just want to fix the "Module not specified" error in Android Studio:

### Method 1: Force Sync
1. Open Android Studio
2. **File → Invalidate Caches and Restart**
3. Choose **Invalidate and Restart**
4. After restart: **File → Sync Project with Gradle Files**

### Method 2: Clean Project
1. In Android Studio: **Build → Clean Project**
2. Wait for completion
3. **Build → Rebuild Project**

### Method 3: Check Module Selection
1. In the top toolbar, check the module dropdown
2. Should show "app" - if not, select it
3. Device dropdown should then show available devices

## 🔄 Complete Reset (If Nothing Works)

```bash
# Remove problematic files
rm -rf android
rm -rf node_modules
rm -rf dist
rm package-lock.json

# Reinstall everything
npm install

# Add Android platform
npx cap add android

# Try to build (skip if still failing)
npm run build || echo "Build failed, using existing dist"

# Sync with Android
npx cap sync android

# Open Android Studio
npx cap open android
```

## 📱 Expected Android Studio Behavior

After the fix, you should see:

1. **Project Structure**:
   ```
   Project
   ├── app (main module)
   ├── capacitor-android
   └── capacitor-cordova-android-plugins
   ```

2. **Module Dropdown**: Shows "app" as selected module

3. **Device Dropdown**: Shows available devices/emulators

4. **No Errors**: No "Module not specified" error

## 🧪 Test the App

Once Android Studio is working:

1. **Select Device**: Choose a device or emulator
2. **Run App**: Click the green play button
3. **Test Authentication**: 
   - Enter phone number
   - Should receive OTP via Fast2SMS
   - Enter OTP to complete login
4. **Test Payment**: Try making a purchase

## 🔍 Troubleshooting

### Build Still Hanging
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall
- Check for circular imports in TypeScript files

### Android Studio Still Shows Error
- Ensure Gradle sync completed (check bottom status bar)
- Try opening the project folder directly in Android Studio
- Check that `capacitor.config.ts` has correct `webDir: 'dist'`

### Authentication Not Working
- Revert to the working `integratedAuth.ts` temporarily
- Test with the SMS proxy server running
- Check browser console for specific errors

## 📞 Priority Actions

**For immediate Android testing**:
1. Run the Android fix script: `fix-android-module-error.bat`
2. Open Android Studio and wait for Gradle sync
3. Select "app" module and run the app

**For authentication fixes**:
1. The Firebase import issues are already fixed
2. Test the build: `npm run build`
3. If build works, the authentication should work
4. If not, temporarily revert to `integratedAuth.ts`

The Android module error should be resolved with the fix script, allowing you to test the app while we resolve any remaining build issues.
