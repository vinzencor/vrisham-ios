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
