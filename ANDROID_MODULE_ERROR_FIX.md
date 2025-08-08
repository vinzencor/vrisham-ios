# Android "Module not specified" Error Fix

## 🚨 Problem
When opening the project in Android Studio, you see "Module not specified" error and cannot run the app.

## 🔧 Solution

### **Quick Fix (Automated)**
Run the fix script:
```bash
fix-android-module-error.bat
```

### **Manual Fix Steps**

#### Step 1: Clean and Rebuild
```bash
# Build the web app
npm run build

# Sync Capacitor
npx cap sync android

# Clean Android build
cd android
gradlew clean
cd ..

# Update Capacitor
npx cap update android
```

#### Step 2: Open Android Studio
```bash
npx cap open android
```

#### Step 3: In Android Studio
1. **Wait for Gradle sync** to complete (bottom status bar)
2. If still showing error:
   - Go to **File → Invalidate Caches and Restart**
   - Choose **Invalidate and Restart**
3. After restart:
   - Go to **File → Sync Project with Gradle Files**
   - Wait for sync to complete

#### Step 4: If Error Persists
1. **Clean Project**: Build → Clean Project
2. **Rebuild Project**: Build → Rebuild Project
3. **Check Module Structure**:
   - In Project view, ensure you see:
     - `app` module
     - `capacitor-android` module
     - `capacitor-cordova-android-plugins` module

## 🔍 Common Causes & Solutions

### **Cause 1: Outdated Capacitor Dependencies**
**Solution**: Update Capacitor
```bash
npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest
npx cap sync android
```

### **Cause 2: Corrupted Android Build Cache**
**Solution**: Clear all caches
```bash
cd android
gradlew clean
cd ..
rm -rf android/build
rm -rf android/app/build
npx cap sync android
```

### **Cause 3: Missing Capacitor Configuration**
**Solution**: Check `capacitor.config.ts`:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vrisham.customerapp',
  appName: 'Vrisham Customer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

### **Cause 4: Gradle Sync Issues**
**Solution**: Force Gradle sync
1. In Android Studio: File → Sync Project with Gradle Files
2. If fails, check `android/gradle.properties` for correct settings
3. Ensure Java/Gradle versions are compatible

### **Cause 5: Node Modules Issues**
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules
rm package-lock.json
npm install
npx cap sync android
```

## 🎯 Verification Steps

After applying the fix:

1. **Check Project Structure** in Android Studio:
   ```
   Project
   ├── app
   ├── capacitor-android
   └── capacitor-cordova-android-plugins
   ```

2. **Verify Gradle Sync**: Bottom status bar should show "Gradle sync finished"

3. **Check Build Configuration**: 
   - Select "app" from the module dropdown (top toolbar)
   - Should show device/emulator options

4. **Test Run**: Click the green play button to run the app

## 🚀 Alternative: Complete Reset

If nothing works, do a complete reset:

```bash
# Remove Android folder
rm -rf android

# Remove node modules
rm -rf node_modules
rm package-lock.json

# Reinstall everything
npm install

# Add Android platform
npx cap add android

# Build and sync
npm run build
npx cap sync android

# Open Android Studio
npx cap open android
```

## 📱 Expected Result

After the fix:
- ✅ Android Studio opens without "Module not specified" error
- ✅ Project structure shows all modules correctly
- ✅ Gradle sync completes successfully
- ✅ App can be built and run on device/emulator
- ✅ All Capacitor plugins work correctly

## 🆘 If Still Not Working

1. **Check Android Studio Version**: Ensure you're using a recent version (2023.1+)
2. **Check Java Version**: Ensure Java 17 is installed and configured
3. **Check Gradle Version**: Should be compatible with your Android Studio version
4. **Check Capacitor Version**: Ensure all Capacitor packages are the same version
5. **Check Logs**: Look at Android Studio's Event Log for specific errors

## 📞 Additional Help

If the error persists:
1. Check the exact error message in Android Studio's Event Log
2. Look for Gradle sync errors in the Build tab
3. Verify that `dist` folder exists and contains built web assets
4. Ensure `capacitor.config.ts` has correct `webDir: 'dist'`

The fix script should resolve the issue in most cases. If you continue having problems, the complete reset option will definitely work.
