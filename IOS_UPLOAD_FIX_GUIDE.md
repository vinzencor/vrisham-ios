# iOS App Store Upload Fix Guide

## Problem
The altool completed with a non-zero exit status: 1, indicating a failure during App Store upload.

## Root Causes Identified

1. **Incomplete Export Options**: Missing required keys in exportOptions.plist
2. **Code Signing Issues**: Improper provisioning profile configuration
3. **Build Configuration Problems**: Incorrect workspace path and build settings
4. **Authentication Issues**: App Store Connect API key configuration

## Solutions Implemented

### 1. Updated exportOptions.plist
Added the following required keys:
- `destination`: Set to "upload" for App Store uploads
- `signingStyle`: Set to "automatic" 
- `stripSwiftSymbols`: Set to true for App Store builds
- `thinning`: Set to "<none>" to avoid thinning issues
- `provisioningProfiles`: Mapped bundle ID to provisioning profile
- `signingCertificate`: Set to "Apple Distribution"
- `manageAppVersionAndBuildNumber`: Set to false

### 2. Fixed CodeMagic Configuration
- **Corrected workspace path**: Changed from "ios/App.xcworkspace" to "ios/App/App.xcworkspace"
- **Added proper code signing setup**: Implemented automatic provisioning profile fetching
- **Improved build process**: Added proper clean and archive steps
- **Extended build timeout**: Increased from 60 to 120 minutes
- **Enhanced error logging**: Added build logs to artifacts

### 3. Code Signing Setup
The updated configuration now:
- Initializes keychain properly
- Fetches signing files from App Store Connect
- Adds certificates to keychain
- Uses profiles automatically

## Additional Steps to Take

### 1. Verify App Store Connect Setup
Ensure the following in your Apple Developer account:
- App ID exists for `com.vrisham.customerapp`
- Distribution certificate is valid and not expired
- App Store provisioning profile exists and is active
- App Store Connect API key has proper permissions

### 2. Check Bundle ID and Version
Verify in Xcode:
- Bundle Identifier matches exactly: `com.vrisham.customerapp`
- Version number is incremented from previous uploads
- Build number is unique and higher than previous builds

### 3. Validate API Key Permissions
Your App Store Connect API key should have:
- Developer role or higher
- Access to the specific app
- Valid expiration date

### 4. Test Build Locally (Optional)
Before using CodeMagic, test locally:
```bash
cd ios/App
xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Release
xcodebuild archive -workspace App.xcworkspace -scheme App -configuration Release -destination generic/platform=iOS -archivePath App.xcarchive
xcodebuild -exportArchive -archivePath App.xcarchive -exportPath build -exportOptionsPlist exportOptions.plist
```

## Common Upload Errors and Solutions

### Error: "No suitable application records were found"
- **Solution**: Ensure the app exists in App Store Connect with the correct bundle ID

### Error: "Invalid provisioning profile"
- **Solution**: Regenerate provisioning profiles in Apple Developer portal

### Error: "Code signing identity not found"
- **Solution**: Ensure distribution certificate is installed and valid

### Error: "Version already exists"
- **Solution**: Increment build number in Xcode project settings

### Error: "Missing compliance information"
- **Solution**: Add export compliance information in App Store Connect

## Verification Steps

1. **Check CodeMagic Build Logs**: Look for specific error messages in the build output
2. **Verify Certificates**: Ensure distribution certificate is valid in Apple Developer portal
3. **Check Provisioning Profiles**: Verify App Store provisioning profile exists and is active
4. **Validate App Store Connect**: Ensure app record exists with correct bundle ID
5. **Test API Key**: Verify API key has proper permissions and is not expired

## Latest Fix Applied (2025-08-14)

### Critical Issue Resolved: CODE_SIGNING_ALLOWED=NO
**Problem**: The codemagic.yaml had `CODE_SIGNING_ALLOWED=NO` in the archive command, which prevented proper code signing and caused altool upload failures.

**Solution Applied**:
1. **Removed CODE_SIGNING_ALLOWED=NO**: This was preventing the app from being properly signed during archive
2. **Fixed workspace path**: Changed from using variable `$XCODE_WORKSPACE` to direct path `App.xcworkspace` in build commands
3. **Added automatic build number increment**: Added script to automatically increment build number to avoid "Version already exists" errors

### Updated Build Process (Ionic CLI + Capacitor + iOS):
```yaml
- name: Install dependencies
  script: |
    npm install
    npm install -g @ionic/cli         # Install Ionic CLI globally
- name: Build web app and sync with Capacitor
  script: |
    ionic build                      # Build using Ionic CLI (calls vite build)
    ionic cap sync ios               # Sync web assets to iOS native project using Ionic CLI
    cd ios/App
    pod install --repo-update        # Install iOS dependencies
- name: Set up code signing
  script: |
    keychain initialize
    app-store-connect fetch-signing-files $BUNDLE_ID --type IOS_APP_STORE --create
    keychain add-certificates
    xcode-project use-profiles
- name: Increment build number
  script: |
    cd ios/App
    BUILD_NUMBER=$(($(xcodebuild -showBuildSettings -workspace App.xcworkspace -scheme $XCODE_SCHEME | grep CURRENT_PROJECT_VERSION | tr -d 'CURRENT_PROJECT_VERSION =') + 1))
    agvtool new-version -all $BUILD_NUMBER
- name: Build iOS
  script: |
    cd ios/App
    xcodebuild clean -workspace App.xcworkspace -scheme $XCODE_SCHEME -configuration Release
    xcodebuild archive -workspace App.xcworkspace -scheme $XCODE_SCHEME -configuration Release -destination generic/platform=iOS -archivePath $CM_BUILD_DIR/App.xcarchive
    xcodebuild -exportArchive -archivePath $CM_BUILD_DIR/App.xcarchive -exportPath $CM_BUILD_DIR/build/ios -exportOptionsPlist exportOptions.plist
```

### 🔋 **Capacitor Integration Explained**

Your app is a **Capacitor hybrid app**, which means:

1. **Web App**: Your frontend code (HTML/CSS/JS) built with `npm run build`
2. **Capacitor Sync**: `npx cap sync ios` copies the web app into the iOS native container
3. **Native iOS Build**: Standard Xcode build process creates the final iOS app
4. **App Store Upload**: The native iOS app gets uploaded to TestFlight/App Store

**Why Ionic CLI + Capacitor works better**:
- **Ionic CLI** provides enhanced build tooling and better error handling
- **Better iOS integration**: `ionic cap sync ios` handles iOS-specific optimizations
- **Improved debugging**: Better error messages and build diagnostics
- **Capacitor integration**: Seamless integration between web build and native sync
- **Native container**: Creates a fully native iOS app that can be distributed through the App Store

### 🔧 **Ionic CLI Commands Available**:
```bash
# Development
ionic serve                    # Start development server
ionic build                    # Build web app
ionic cap sync ios            # Sync to iOS with optimizations
ionic cap build ios           # Build and sync in one command
ionic cap run ios             # Build, sync, and run on iOS device/simulator

# Debugging
ionic cap doctor              # Check setup and diagnose issues
ionic info                    # Show environment information
```

## Next Steps

1. Commit the updated configuration files
2. Trigger a new build in CodeMagic
3. Monitor the build logs for any remaining issues
4. If upload still fails, check the specific error message in the logs

## Files Modified

- `ios/App/exportOptions.plist`: Updated with complete export configuration
- `codemagic.yaml`: Fixed workspace path and added proper code signing setup

## Support

If issues persist:
1. Check CodeMagic build logs for specific error messages
2. Verify all certificates and provisioning profiles in Apple Developer portal
3. Ensure App Store Connect API key has proper permissions
4. Contact Apple Developer Support if certificate/provisioning issues persist
