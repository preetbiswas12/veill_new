plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}

react {
    entryFile = file("../../index.js")
}

val enableMinifyInReleaseBuilds = (findProperty("android.enableMinifyInReleaseBuilds") ?: false).toString().toBoolean()

val jscFlavor = "io.github.react-native-community:jsc-android:2026004.0"

android {
    ndkVersion = rootProject.extra["ndkVersion"] as String
    buildToolsVersion = rootProject.extra["buildToolsVersion"] as String
    compileSdk = (rootProject.extra["compileSdkVersion"] as Int)

    namespace = "com.stargazer.veill"
    defaultConfig {
        applicationId = "com.stargazer.veill"
        minSdk = (rootProject.extra["minSdkVersion"] as Int)
        targetSdk = (rootProject.extra["targetSdkVersion"] as Int)
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "REACT_NATIVE_RELEASE_LEVEL", "\"${findProperty("reactNativeReleaseLevel") ?: "stable"}\"")
    }
    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }
    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("debug")
        }
        getByName("release") {
            signingConfig = signingConfigs.getByName("debug")
            val enableShrinkResources = findProperty("android.enableShrinkResourcesInReleaseBuilds") ?: "false"
            isShrinkResources = enableShrinkResources.toString().toBoolean()
            isMinifyEnabled = enableMinifyInReleaseBuilds
            proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
            val enablePngCrunchInRelease = findProperty("android.enablePngCrunchInReleaseBuilds") ?: "true"
            isCrunchPngs = enablePngCrunchInRelease.toString().toBoolean()
        }
    }
    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }
    androidResources {
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~"
    }
}

dependencies {
    implementation("com.facebook.react:react-android")
    val hermesEnabled = (project.findProperty("hermesEnabled") ?: "true").toString().toBoolean()
    if (hermesEnabled) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation(jscFlavor)
    }
}
