pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
    includeBuild("../node_modules/@react-native/gradle-plugin")
}

plugins {
    id("com.facebook.react.settings") version "0.73.6"
}

rootProject.name = "veill"

include(":app")

// Disable autolinking for problematic packages
project(":app").projectDir = file("app")