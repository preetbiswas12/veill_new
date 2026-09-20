
# 📱 Signal Clone (React Native + Stream)

A privacy-first messaging app built with **React Native**, powered by **Stream Chat** and **Stream Video SDK**. Inspired by the core features of Signal, this project supports 1-on-1 messaging, media sharing, and real-time audio/video calling.

<p align="center">
    <a href="https://dev.to/tropicolx/build-a-signal-clone-with-react-native-and-stream-part-one-5a47" style="display: block;" align="center">
    <img width="1288" height="728" alt="Signal clone YT thumbnail" src="https://github.com/user-attachments/assets/2623e159-a81e-425c-864b-5070854de18c" />
    </a>
</p>
<p align="center"><a href="https://dev.to/tropicolx/build-a-signal-clone-with-react-native-and-stream-part-one-5a47" align="center">Click to read!</a></p>

## 🔧 Features

- ✅ Secure 1-on-1 real-time messaging  
- 🧵 Message reactions, typing indicators, read receipts  
- 📎 Media attachments (images, files, etc.)  
- 📞 Audio & video calling powered by Stream Video SDK  
- 🎨 Clean, Signal-style mobile UI built with React Native  
- 🔐 Privacy-conscious design

## 🚀 Preview

| Platform   | File                      | Link              |
| ---------- | ------------------------- | ----------------- |
| 🤖 Android | `signal-clone-v1.0.0.apk` | [Download APK](https://github.com/TropicolX/signal-clone/releases/download/v1.0/signal-clone-v1.0.0.apk) |
| 🍏 iOS     | `signal-clone-v1.0.0.ipa` | [Download IPA](https://github.com/TropicolX/signal-clone/releases/download/v1.0/signal-clone-v1.0.0.ipa) |

## 🎬 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/signal-clone.git
cd signal-clone
````

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Add Environment Variables

Create a `.env.local` file in the root and add your keys:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

> 🔑 You can manage your Clerk and Stream API keys from their respective dashboards.

### 4. Run the App

```bash
npx expo run:ios
# or
npx expo run:android
```

## 📸 Screenshots

|         *Chat Screen*         |         *Call Screen*         |
| :---------------------------: | :---------------------------: |
| <img width="1440" height="1200" alt="image" src="https://github.com/user-attachments/assets/405ed51d-15be-4895-b272-f33ba8266e47" /> | <img width="1440" height="1200" alt="image" src="https://github.com/user-attachments/assets/328bead4-dcbe-42fd-a97c-f5749c96f5f2" /> |

## 📹 Video Demo

[Watch the Full Walkthrough (Coming Soon) →](link-to-your-video)

## 🛠️ Tech Stack

- **React Native**
- **Stream Chat SDK**
- **Stream Video SDK**
- **Expo**
- **Clerk**
- **TypeScript**

## 💬 Acknowledgments

* [Stream](https://getstream.io/chat/sdk/react-native/) for the amazing Chat & Video SDKs
* [Signal](https://signal.org) for the inspiration
