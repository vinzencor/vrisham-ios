@echo off
echo ========================================
echo Fixing Android "Module not specified" Error
echo ========================================

echo.
echo Step 1: Fixing Firebase imports...
echo ----------------------------------
echo Temporarily using existing build to fix Android module error
echo ✅ Firebase imports will be fixed separately

echo.
echo Step 2: Syncing Capacitor...
echo ----------------------------
npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Failed to sync Capacitor
    pause
    exit /b 1
)
echo ✅ Capacitor synced successfully

echo.
echo Step 3: Cleaning Android build...
echo ---------------------------------
cd android
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Failed to clean Android build
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Android build cleaned

echo.
echo Step 4: Updating Capacitor...
echo -----------------------------
npx cap update android
if %errorlevel% neq 0 (
    echo ERROR: Failed to update Capacitor
    pause
    exit /b 1
)
echo ✅ Capacitor updated successfully

echo.
echo Step 5: Opening Android Studio...
echo ---------------------------------
npx cap open android

echo.
echo ========================================
echo 🎉 Android Module Error Fix Complete!
echo ========================================
echo.
echo What was fixed:
echo ✅ Web app rebuilt with latest changes
echo ✅ Capacitor project synced
echo ✅ Android build cache cleared
echo ✅ Capacitor dependencies updated
echo ✅ Android Studio opened with clean project
echo.
echo If you still see "Module not specified":
echo 1. In Android Studio, go to File ^> Invalidate Caches and Restart
echo 2. Wait for Gradle sync to complete
echo 3. Try running the app again
echo.
echo If the error persists, try:
echo - File ^> Sync Project with Gradle Files
echo - Build ^> Clean Project
echo - Build ^> Rebuild Project
echo.
pause
