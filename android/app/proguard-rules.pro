# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.debug.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo
-keep class expo.modules.** { *; }
-keep class expo.modules.api.** { *; }
-keep class expo.modules.appauth.** { *; }
-keep class expo.modules.audio.** { *; }
-keep class expo.modules.av.** { *; }
-keep class expo.modules.constants.** { *; }
-keep class expo.modules.core.** { *; }
-keep class expo.modules.errors.** { *; }
-keep class expo.modules.filesystem.** { *; }
-keep class expo.modules.font.** { *; }
-keep class expo.modules.imagepicker.** { *; }
-keep class expo.modules.keepawake.** { *; }
-keep class expo.modules.linking.** { *; }
-keep class expo.modules.locale.** { *; }
-keep class expo.modules.mediapicker.** { *; }
-keep class expo.modules.permissions.** { *; }
-keep class expo.modules.splashscreen.** { *; }
-keep class expo.modules.taskManager.** { *; }
-keep class expo.modules.updates.** { *; }
-keep class expo.modules.webbrowser.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safearcontext.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep custom view classes
-keep public class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable implementations
-keep class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void readObject(java.io.ObjectInputStream);
    private void writeObject(java.io.ObjectOutputStream);
    java.lang.Object writeReplace();
}

# Keep R class
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep BuildConfig
-keep class **.BuildConfig { *; }

# Keep native crash handler
-keep class com.facebook.react.bridge.CatalystInstanceImpl$ReactBridge** { *; }

# Add any project specific keep options here:
