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

# OneSignal SDK (react-native-onesignal v5.x bundles OneSignal SDK v5.9.9)
-keep class com.onesignal.** { *; }
-dontwarn com.onesignal.**

# CometChat SDK
-keep class com.cometchat.** { *; }
-dontwarn com.cometchat.**

# Notifee
-keep class com.notifee.** { *; }
-dontwarn com.notifee.**

# Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }
