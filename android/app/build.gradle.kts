import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}

react {
    entryFile = file("../../index.js")
}

/*
 * ------------------------------------------------------------
 * Release signing configuration
 * ------------------------------------------------------------
 *
 * Locally:
 *   android/keystore.properties
 *
 * GitHub Actions:
 *   This file will be created automatically from GitHub Secrets.
 *
 * IMPORTANT:
 * Do NOT commit keystore.properties to Git.
 */
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()

if (keystorePropertiesFile.exists()) {
    FileInputStream(keystorePropertiesFile).use {
        keystoreProperties.load(it)
    }
}

val enableMinifyInReleaseBuilds =
    (findProperty("android.enableMinifyInReleaseBuilds") ?: false)
        .toString()
        .toBoolean()

val jscFlavor =
    "io.github.react-native-community:jsc-android:2026004.0"

android {
    kotlinOptions {
        allWarningsAsErrors = false
        suppressWarnings = true
    }

    ndkVersion =
        rootProject.extra["ndkVersion"] as String

    buildToolsVersion =
        rootProject.extra["buildToolsVersion"] as String

    compileSdk =
        rootProject.extra["compileSdkVersion"] as Int

    namespace = "com.stargazer.veill"

    defaultConfig {
        applicationId = "com.stargazer.veill"

        minSdk =
            rootProject.extra["minSdkVersion"] as Int

        targetSdk =
            rootProject.extra["targetSdkVersion"] as Int

        versionCode = 1
        versionName = "1.0.0"

        buildConfigField(
            "String",
            "REACT_NATIVE_RELEASE_LEVEL",
            "\"${findProperty("reactNativeReleaseLevel") ?: "stable"}\""
        )
    }

    /*
     * --------------------------------------------------------
     * Signing configurations
     * --------------------------------------------------------
     */
    signingConfigs {

        // Existing debug signing
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }

        /*
         * Real release signing
         *
         * Expected keystore.properties:
         *
         * MYAPP_UPLOAD_STORE_FILE=../keystore/release.keystore
         * MYAPP_UPLOAD_STORE_PASSWORD=...
         * MYAPP_UPLOAD_KEY_ALIAS=...
         * MYAPP_UPLOAD_KEY_PASSWORD=...
         */
        create("release") {
            if (keystorePropertiesFile.exists()) {

                val storeFilePath =
                    keystoreProperties.getProperty(
                        "MYAPP_UPLOAD_STORE_FILE"
                    )

                val storePasswordValue =
                    keystoreProperties.getProperty(
                        "MYAPP_UPLOAD_STORE_PASSWORD"
                    )

                val keyAliasValue =
                    keystoreProperties.getProperty(
                        "MYAPP_UPLOAD_KEY_ALIAS"
                    )

                val keyPasswordValue =
                    keystoreProperties.getProperty(
                        "MYAPP_UPLOAD_KEY_PASSWORD"
                    )

                if (
                    !storeFilePath.isNullOrBlank() &&
                    !storePasswordValue.isNullOrBlank() &&
                    !keyAliasValue.isNullOrBlank() &&
                    !keyPasswordValue.isNullOrBlank()
                ) {
                    storeFile = file(storeFilePath)
                    storePassword = storePasswordValue
                    keyAlias = keyAliasValue
                    keyPassword = keyPasswordValue
                } else {
                    throw GradleException(
                        "Release keystore.properties is incomplete."
                    )
                }
            }
        }
    }

    /*
     * --------------------------------------------------------
     * Build types
     * --------------------------------------------------------
     */
    buildTypes {

        getByName("debug") {
            signingConfig =
                signingConfigs.getByName("debug")
        }

        getByName("release") {

            /*
             * IMPORTANT:
             * Release is now signed with the real release keystore,
             * NOT the debug keystore.
             */
            signingConfig =
                signingConfigs.getByName("release")

            val enableShrinkResources =
                findProperty(
                    "android.enableShrinkResourcesInReleaseBuilds"
                ) ?: "false"

            isShrinkResources =
                enableShrinkResources.toString().toBoolean()

            isMinifyEnabled =
                enableMinifyInReleaseBuilds

            proguardFiles(
                getDefaultProguardFile(
                    "proguard-android.txt"
                ),
                "proguard-rules.pro"
            )

            val enablePngCrunchInRelease =
                findProperty(
                    "android.enablePngCrunchInReleaseBuilds"
                ) ?: "true"

            isCrunchPngs =
                enablePngCrunchInRelease
                    .toString()
                    .toBoolean()
        }
    }

    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }

    androidResources {
        ignoreAssetsPattern =
            "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~"
    }
}

dependencies {

    implementation("com.facebook.react:react-android")

    val hermesEnabled =
        (
            project.findProperty("hermesEnabled")
                ?: "true"
        )
            .toString()
            .toBoolean()

    if (hermesEnabled) {
        implementation(
            "com.facebook.react:hermes-android"
        )
    } else {
        implementation(jscFlavor)
    }
}