# Veill — OneSignal + iOS VoIP setup checklist

OneSignal is already wired into the code. This file lists what you need to do
on the OneSignal dashboard so push for chat (Android heads-up + iOS standard
push) and VoIP push for iOS calls work in production.

You need **TWO** OneSignal apps: a regular one for chat + Android calls, and a
second one for iOS VoIP push only.

---

## 1. Create the regular OneSignal app

1. Go to https://app.onesignal.com and click **New App/Website**.
2. Name it `Veill` (or whatever you like). Select **Google Android (FCM)** as
   the platform.
3. **Android (FCM):**
   - You need a Firebase project. Create one at https://console.firebase.google.com
     if you don't have one already.
   - In Firebase, go to **Project Settings → Cloud Messaging**, copy the
     **Server key** and **Sender ID**.
   - Paste them into OneSignal's Android config step.
   - OneSignal will then ask you to download `google-services.json` and put it
     at `android/app/google-services.json`. This is required for Android push.
4. **iOS (APNs):**
   - In the same OneSignal app, add the iOS platform.
   - You need an **Apple Push Notification Authentication Key** (.p8 file).
     Get one from https://developer.apple.com → Certificates, Identifiers &
     Profiles → Keys → Add a new key → check **Apple Push Notifications
     service (APNs)**.
   - Upload the .p8 to OneSignal, plus your 10-character Key ID and your Team
     ID (from Apple Developer membership page).
   - Set the **APNs environment** to **Production** when you build a release
     build; keep it on **Sandbox** for development.
5. After both platforms are set up, go to **Settings → Keys & IDs** and copy
   the **OneSignal App ID** and **REST API Key**.

Put them in:

- `backend/.env`:
  ```
  ONESIGNAL_APP_ID=...
  ONESIGNAL_REST_API_KEY=...
  ```
- mobile `.env`:
  ```
  EXPO_PUBLIC_ONESIGNAL_APP_ID=...
  ```

---

## 2. Create the iOS VoIP OneSignal app (iOS only)

iOS won't reliably wake a killed app on a regular push for a phone call — you
need a separate OneSignal app configured for VoIP push, plus a **VoIP
Services Certificate** from Apple.

1. **Apple: create a VoIP Services Certificate**
   - Go to https://developer.apple.com → Certificates, Identifiers & Profiles.
   - Identifiers → select your App ID (`com.stargazer.veill`) → enable
     **Push Notifications** if not already, then **Edit** → check
     **VoIP Services** under Application Services → Save.
   - Certificates → create a new certificate of type **VoIP Services
     Certificate** for that App ID.
   - Download and double-click to install it in Keychain Access, then export
     as a .p12 file (with a password).

2. **OneSignal: create a second app**
   - In OneSignal, create another app called `Veill VoIP` (or similar).
   - Platform: **Apple iOS (APNs)** only.
   - When asked for the .p8/.p12, choose **Apple Push Notification
     Authentication Key — .p8** is *not* enough; for VoIP you must use the
     **VoIP Services Certificate** you exported as .p12.
   - In OneSignal iOS settings, set **APNs environment** to match your build.
   - Go to **Settings → Keys & IDs** and copy the **OneSignal App ID** and
     **REST API Key**.

Put them in:

- `backend/.env`:
  ```
  ONESIGNAL_VOIP_APP_ID=...
  ONESIGNAL_VOIP_REST_API_KEY=...
  ```
- mobile `.env`:
  ```
  EXPO_PUBLIC_ONESIGNAL_VOIP_APP_ID=...
  ```

> **Why two apps?** The main OneSignal app is configured for FCM (Android) and
> standard APNs (iOS background fetch). iOS treats VoIP pushes as a different
> channel — they wake the app immediately, bypass Doze mode, and survive when
> the app has been force-killed. You can only configure ONE APNs environment
> per OneSignal app, so a VoIP-only second app is the simplest setup.

---

## 3. Run `expo prebuild` after filling the IDs

`onesignal-expo-plugin` bakes the App ID into `AndroidManifest.xml` and
`Info.plist` at prebuild time. After you've set `EXPO_PUBLIC_ONESIGNAL_APP_ID`
in `.env`, re-run:

```sh
pnpm exec expo prebuild --clean
```

This regenerates `android/` and `ios/` with the correct config.

---

## 4. Verify on a real device

- **Android emulator (with Google Play):** the regular app ID is enough.
  `pnpm exec expo run:android` builds a debug APK and installs.
- **iOS Simulator:** push doesn't work. Test on a real device.
- **iOS device:** needs both apps configured plus a real provisioning profile
  that includes the `voip` entitlement. Add this to `app.json` if you need it
  (it's a config-only entitlement; Expo handles it):

  ```json
  "ios": {
    "entitlements": {
      "aps-environment": "development",
      "com.apple.developer.voip-services": ["com.stargazer.veill"]
    }
  }
  ```

---

## Quick reference: env vars summary

| File | Variable | Purpose |
|------|----------|---------|
| `backend/.env` | `ONESIGNAL_APP_ID` | Main app (chat + Android calls) |
| `backend/.env` | `ONESIGNAL_REST_API_KEY` | Server-side push sender |
| `backend/.env` | `ONESIGNAL_VOIP_APP_ID` | iOS VoIP app |
| `backend/.env` | `ONESIGNAL_VOIP_REST_API_KEY` | Server-side VoIP sender |
| mobile `.env` | `EXPO_PUBLIC_ONESIGNAL_APP_ID` | Runtime init of OneSignal SDK |
| mobile `.env` | `EXPO_PUBLIC_ONESIGNAL_VOIP_APP_ID` | Runtime init of VoIP app (iOS) |

The backend already has all the wiring — once these env vars are set, calls
between two devices will ring the callee's full-screen UI on Android (notifee
fullscreen intent) and the system Phone-app UI on iOS (CallKeep + PushKit).
