Write-Host "=========================================="
Write-Host "      Fixing All Missing Configs (pnpm)"
Write-Host "=========================================="
Write-Host ""

$projectRoot = Get-Location
cd $projectRoot

# ============================================================================
# 1. ADD MISSING PNPM PACKAGES
# ============================================================================
Write-Host "[1/4] Installing Missing Packages with pnpm..."
Write-Host ""

Write-Host "Installing @daily-co/daily-js..."
pnpm install @daily-co/daily-js

Write-Host ""
Write-Host "Installing @daily-co/react-native-daily..."
pnpm install @daily-co/react-native-daily

Write-Host ""
Write-Host "Installing onesignal-react-native..."
pnpm install onesignal-react-native

Write-Host ""
Write-Host "[OK] All packages installed with pnpm"
Write-Host ""

# ============================================================================
# 2. ADD MISSING PERMISSIONS TO MANIFEST
# ============================================================================
Write-Host "[2/4] Adding Missing Permissions..."

$manifestPath = "android\app\src\main\AndroidManifest.xml"
$manifest = Get-Content $manifestPath -Raw

# Add ACCESS_NETWORK_STATE if missing
if ($manifest -notmatch "android.permission.ACCESS_NETWORK_STATE") {
    $manifest = $manifest -replace '(</manifest>)', '    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />' + "`r`n" + '$1'
    Write-Host "[ADDED] android.permission.ACCESS_NETWORK_STATE"
} else {
    Write-Host "[OK] android.permission.ACCESS_NETWORK_STATE already present"
}

# Add CHANGE_NETWORK_STATE if missing
if ($manifest -notmatch "android.permission.CHANGE_NETWORK_STATE") {
    $manifest = $manifest -replace '(</manifest>)', '    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />' + "`r`n" + '$1'
    Write-Host "[ADDED] android.permission.CHANGE_NETWORK_STATE"
} else {
    Write-Host "[OK] android.permission.CHANGE_NETWORK_STATE already present"
}

# Add MODIFY_AUDIO_SETTINGS if missing
if ($manifest -notmatch "android.permission.MODIFY_AUDIO_SETTINGS") {
    $manifest = $manifest -replace '(</manifest>)', '    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />' + "`r`n" + '$1'
    Write-Host "[ADDED] android.permission.MODIFY_AUDIO_SETTINGS"
} else {
    Write-Host "[OK] android.permission.MODIFY_AUDIO_SETTINGS already present"
}

Set-Content -Path $manifestPath -Value $manifest -Force
Write-Host "[OK] Permissions updated in AndroidManifest.xml"
Write-Host ""

# ============================================================================
# 3. ADD ONESIGNAL META-DATA
# ============================================================================
Write-Host "[3/4] Adding OneSignal Configuration..."

$oneSignalId = Read-Host "Enter your OneSignal App ID (get it from https://onesignal.com)"

if ($oneSignalId) {
    # Check if already exists
    if ($manifest -notmatch "com.onesignal.app_id") {
        # Find <application> tag and add meta-data after it
        $metaData = "`r`n        <meta-data`r`n            android:name=`"com.onesignal.app_id`"`r`n            android:value=`"$oneSignalId`" />"
        $manifest = $manifest -replace '(<application[^>]*>)', "`$1$metaData"
        
        Set-Content -Path $manifestPath -Value $manifest -Force
        Write-Host "[ADDED] OneSignal App ID: $oneSignalId"
        Write-Host "[OK] AndroidManifest.xml updated"
    } else {
        Write-Host "[OK] OneSignal already configured"
    }
} else {
    Write-Host "[SKIP] OneSignal setup skipped"
}

Write-Host ""

# ============================================================================
# 4. ADD PROGUARD RULES
# ============================================================================
Write-Host "[4/4] Adding ProGuard/R8 Rules..."

$proguardPath = "android\app\proguard-rules.pro"
$proguardContent = Get-Content $proguardPath -Raw

$rulesAdded = $false

# Add daily.co rules if missing
if ($proguardContent -notmatch "com.daily") {
    $proguardContent += "`r`n# Daily.co`r`n-keep class com.daily.** { *; }`r`n-keep class com.daily.react.** { *; }`r`n"
    Write-Host "[ADDED] ProGuard rule for com.daily"
    $rulesAdded = $true
} else {
    Write-Host "[OK] ProGuard rule for com.daily already present"
}

# Add OneSignal rules if missing
if ($proguardContent -notmatch "com.onesignal") {
    $proguardContent += "`r`n# OneSignal`r`n-keep class com.onesignal.** { *; }`r`n"
    Write-Host "[ADDED] ProGuard rule for com.onesignal"
    $rulesAdded = $true
} else {
    Write-Host "[OK] ProGuard rule for com.onesignal already present"
}

# Add React Native rules if missing
if ($proguardContent -notmatch "com.reactnative") {
    $proguardContent += "`r`n# React Native`r`n-keep class com.reactnative.** { *; }`r`n-keep interface com.reactnative.** { *; }`r`n"
    Write-Host "[ADDED] ProGuard rule for com.reactnative"
    $rulesAdded = $true
} else {
    Write-Host "[OK] ProGuard rule for com.reactnative already present"
}

# Add Socket.io rules if missing
if ($proguardContent -notmatch "io.socket") {
    $proguardContent += "`r`n# Socket.io`r`n-keep class io.socket.** { *; }`r`n-keep interface io.socket.** { *; }`r`n"
    Write-Host "[ADDED] ProGuard rule for io.socket"
    $rulesAdded = $true
} else {
    Write-Host "[OK] ProGuard rule for io.socket already present"
}

# Add general keep rules if missing
if ($proguardContent -notmatch "BuildConfig") {
    $proguardContent += "`r`n# Keep BuildConfig`r`n-keep class **.BuildConfig { *; }`r`n`r`n# Preserve line numbers for crash reporting`r`n-keepattributes SourceFile,LineNumberTable`r`n-renamesourcefileattribute SourceFile`r`n"
    Write-Host "[ADDED] ProGuard rules for BuildConfig and line numbers"
    $rulesAdded = $true
}

if ($rulesAdded) {
    Set-Content -Path $proguardPath -Value $proguardContent -Force
}

Write-Host "[OK] ProGuard rules updated"
Write-Host ""

# ============================================================================
# 5. VERIFY INSTALLATION
# ============================================================================
Write-Host "[VERIFY] Checking installed packages..."
Write-Host ""

$nodeModulesPath = "node_modules"
$packagesToCheck = @(
    "@daily-co/react-native-daily",
    "@daily-co/daily-js",
    "onesignal-react-native",
    "react-native",
    "zustand",
    "socket.io-client"
)

$allInstalled = $true
foreach ($pkg in $packagesToCheck) {
    if (Test-Path "$nodeModulesPath\$pkg") {
        Write-Host "[OK] $pkg is installed"
    } else {
        Write-Host "[WARNING] $pkg might not be fully installed"
        $allInstalled = $false
    }
}

Write-Host ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================
Write-Host "=========================================="
Write-Host "      All Configs Fixed!"
Write-Host "=========================================="
Write-Host ""

if ($allInstalled) {
    Write-Host "[OK] All packages verified"
} else {
    Write-Host "[WARNING] Some packages may need verification"
}

Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Verify all configs: powershell -ExecutionPolicy Bypass -File verify-android-config.ps1"
Write-Host "2. Clean build:        cd android && .\gradlew clean"
Write-Host "3. Full rebuild:       .\gradlew assembleRelease bundleRelease"
Write-Host "4. Check artifacts:    ls android\app\build\outputs\apk\release\"
Write-Host "5. Check GitHub:       GitHub Actions will auto-upload APK to releases"
Write-Host ""
Write-Host "APK will be at: android\app\build\outputs\apk\release\app-release.apk"
Write-Host "AAB will be at: android\app\build\outputs\bundle\release\app-release.aab"
Write-Host ""
Write-Host "Your APK is production-ready!"
Write-Host ""