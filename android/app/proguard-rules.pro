# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Daily.co
-keep class com.daily.** { *; }
-keep class com.daily.react.** { *; }

# OneSignal
-keep class com.onesignal.** { *; }

# React Native
-keep class com.reactnative.** { *; }
-keep interface com.reactnative.** { *; }

# Socket.io
-keep class io.socket.** { *; }
-keep interface io.socket.** { *; }

# Keep BuildConfig
-keep class **.BuildConfig { *; }

# Preserve line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

