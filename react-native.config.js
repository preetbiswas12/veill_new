/**
 * React Native / Expo autolinking overrides.
 *
 * `@react-native-firebase/app` and `/messaging` are excluded on Android because
 * their Gradle plugin requires `google-services.json`, which this project does
 * not have yet. Without that file the plugin produces an empty resource
 * provider and the build dies at `:app:compileDebugJavaWithJavac` with
 * "Cannot query the value of this provider because it has no value available".
 *
 * Push stays off until a Firebase project exists: the app's `lib/push.ts`
 * requires the messaging module lazily and falls back to the CometChat
 * WebSocket, so chat and calling are unaffected.
 *
 * To re-enable push:
 *   1. create a Firebase Android app (package com.stargazer.veill)
 *   2. put google-services.json at the repo root
 *   3. add "android": { "googleServicesFile": "./google-services.json" } to app.json
 *   4. delete this file (or the three entries below) and rebuild
 *
 * `@solana-mobile/mobile-wallet-adapter-protocol` is unrelated leftover
 * boilerplate (a wallet library in a chat app) and is excluded for the same
 * reason - it ships an Android module that has no business being in the build.
 */
module.exports = {
  dependencies: {
    '@react-native-firebase/app': {
      platforms: { android: null, ios: null },
    },
    '@react-native-firebase/messaging': {
      platforms: { android: null, ios: null },
    },
    '@solana-mobile/mobile-wallet-adapter-protocol': {
      platforms: { android: null, ios: null },
    },
  },
};