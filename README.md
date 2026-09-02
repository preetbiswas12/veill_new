# Veill

A WhatsApp-style chat and calling app built with React Native (Expo SDK 54) and a Node.js/Express backend.

## Stack

**Mobile** (this repo):
- Expo SDK 54 + React Native 0.81 + React 19
- React Navigation v7 (stack + bottom-tabs)
- [CometChat](https://www.cometchat.com/) for messaging and group chat
- [Daily.co](https://www.daily.co/) for voice/video calls (`@daily-co/react-native-daily-js`)
- [OneSignal](https://onesignal.com/) for push notifications
- [notifee](https://notifee.app/) for Android fullscreen incoming-call UI
- [react-native-callkeep](https://github.com/react-native-webrtc/react-native-callkeep) + [react-native-voip-push-notification](https://github.com/zo0r/react-native-voip-push-notification) for iOS native call UI (CallKit + PushKit)
- Expo SecureStore for token storage

**Backend** (separate repo: [`preetbiswas12/veill_backend`](https://github.com/preetbiswas12/veill_backend)):
- Node.js 22 + Express
- MongoDB (Atlas)
- Bcrypt auth, JWT tokens
- CometChat REST API integration for user/token generation
- OneSignal REST API for call push (chat push via CometChat, calls via OneSignal)
- Daily.co REST API for room creation
- Tuned for Render free tier (≤400 MB RAM, 0.1 CPU)

## Setup

### 1. Backend

```bash
git clone https://github.com/preetbiswas12/veill_backend.git
cd veill_backend
npm install
cp .env.example .env  # fill in MONGO_URI, COMETCHAT_*, DAILY_KEY, JWT_SECRET, ONESIGNAL_*
npm start
```

Push to your own Render account via the included `render.yaml` blueprint.

### 2. Mobile

```bash
pnpm install
cp .env.example .env  # fill in EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_ONESIGNAL_APP_ID, etc.
pnpm exec expo prebuild --platform android
pnpm android   # or pnpm ios (macOS only)
```

## Environment variables

Mobile (`.env`):
- `EXPO_PUBLIC_API_BASE_URL` — backend URL (e.g. `https://veill-backend.onrender.com`)
- `EXPO_PUBLIC_COMETCHAT_APP_ID` — from CometChat dashboard
- `EXPO_PUBLIC_COMETCHAT_REGION` — CometChat region (e.g. `IN`)
- `EXPO_PUBLIC_DAILY_DOMAIN` — your Daily.co domain (e.g. `veill.daily.co`)
- `EXPO_PUBLIC_ONESIGNAL_APP_ID` — OneSignal app ID for Android
- `EXPO_PUBLIC_PUSH_SERVER_URL` — backend URL (usually same as API_BASE)

Backend (`.env`): see `veill_backend/.env.example`.

## iOS Push Notifications (VoIP)

Requires a separate OneSignal app configured for iOS VoIP with a VoIP Services Certificate from Apple Developer Portal. Push for Android uses the regular OneSignal app.
