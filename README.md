# Veill

End-to-end encrypted messaging app with real-time chat, voice/video calls, and push notifications.

## Tech Stack

- [Expo Router](https://docs.expo.dev/routing/introduction/) file-based navigation
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) 3 for animations
- [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) for gestures
- [Socket.IO](https://socket.io/) for real-time messaging
- [LiveKit](https://livekit.io/) for WebRTC voice/video calls
- [OneSignal](https://onesignal.com/) for push notifications
- [SQLite](https://www.sqlite.org/) + [MongoDB](https://www.mongodb.com/) for data storage

## Features

- E2E encrypted messaging
- Real-time chat with Socket.IO
- Voice and video calls via LiveKit
- Push notifications via OneSignal
- Contact management
- Media sharing with auto-expiry
- Offline message queue

## Building

### Prerequisites

- Node.js 18+
- pnpm
- EAS CLI (`npm install -g eas-cli`)
- Expo account

### Development

```bash
pnpm install
pnpm start
```

### Production Build

```bash
eas build --profile production --platform android
```

## Environment Variables

Create a `.env` file in the root:

```env
EXPO_PUBLIC_SERVER_URL=https://your-server.com
EXPO_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
```

Server-side environment variables are in `veill_relay/.env`.

## Architecture

```
veill/
├── app/                    # Expo Router screens
├── components/             # Reusable UI components
├── constants/              # Colors, Fonts, Styles
├── utils/                  # Client-side utilities
├── veill_relay/            # Backend server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── services/       # OneSignal, LiveKit, Centrifugo
│   │   └── database/       # SQLite + MongoDB
│   └── .env                # Server environment
└── assets/                 # Images, fonts
```
