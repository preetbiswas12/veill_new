plugins {
    id("com.android.application") version "8.11.0" apply false
    id("org.jetbrains.kotlin.android") version "2.1.20" apply false
}

ext {
    set("buildToolsVersion", "34.0.0")
    set("minSdkVersion", 24)
    set("compileSdkVersion", 34)
    set("targetSdkVersion", 34)
    set("ndkVersion", "27.1.12297006")
}
