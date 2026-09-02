# CometChat Migration + Remove expo-router

## Goal
Replace Stream Chat with CometChat SDK + UI Kit, and remove expo-router in favor of React Navigation. Keep Expo SDK for development tooling only. Leave all voice/video call code untouched.

---

## 1. Package Changes (`package.json`)

**Remove:**
- `stream-chat` (^9.51.0)
- `stream-chat-expo` (^9.8.0)
- `expo-router` (~6.0.23)

**Add:**
- `@cometchat/chat-sdk-react-native` (^4.0.0) — Core SDK
- `@cometchat/chat-ui-kit-react-native` (^4.0.0) — Pre-built UI
- `@react-navigation/native` (already present, keep)
- `@react-navigation/native-stack` (^7.0.0) — Stack navigator
- `@react-navigation/bottom-tabs` (^7.0.0) — Tab navigator

Change `main` from `"expo-router/entry"` to `"expo/AppEntry"`.

Remove babel-plugin-expo-router if present in babel.config.

---

## 2. New Entry Point: `App.tsx`

Root component that wraps everything in NavigationContainer + ThemeProvider + GestureHandlerRootView.

```tsx
import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CustomAlert } from '@/components/CustomAlert';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthService } from '@/utils/auth';
import { registerDeviceForPush } from '@/utils/onesignal';
import { requestAllPermissions } from '@/utils/permissions';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    (async () => {
      await AuthService.initialize();
      if (Platform.OS !== 'web') {
        requestAllPermissions().catch(() => {});
      }
      SplashScreen.hideAsync();
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator navigationRef={navigationRef} />
          <CustomAlert />
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

---

## 3. New Navigation: `navigation/AppNavigator.tsx`

Three navigator layers:

```
RootStack (native-stack)
  ├── WelcomeScreen
  ├── AuthStack
  │     ├── SignInScreen
  │     └── SignUpScreen
  └── MainTabs (bottom-tabs)
        ├── ChatsStack (native-stack)
        │     ├── ChatListScreen
        │     ├── ChatDetailScreen
        │     └── NewChatModal
        ├── CallsScreen (native-stack, UNCHANGED content)
        └── SettingsStack (native-stack)
              ├── SettingsListScreen
              └── [all settings sub-screens]
```

Auth guard: if user is authenticated, show MainTabs; otherwise show AuthStack or Welcome.

OneSignal click handler uses `navigationRef.current?.navigate()` instead of `router.push()`.

---

## 4. New CometChat Service: `utils/cometchat.ts`

Replace `utils/stream.ts` entirely. Key API:

```typescript
import { CometChat } from '@cometchat/chat-sdk-react-native';

const APP_ID = process.env.EXPO_PUBLIC_COMETCHAT_APP_ID || '';
const REGION = process.env.EXPO_PUBLIC_COMETCHAT_REGION || 'us';

class CometChatServiceClass {
  private msgListeners: ((msg: any) => void)[] = [];

  async initialize() {
    const settings = new CometChat.CometChatSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(REGION)
      .build();
    await CometChat.init(APP_ID, settings);
  }

  async login(userId: string, displayName: string) {
    const user = new CometChat.User(userId);
    user.setName(displayName);
    await CometChat.login(user);
  }

  async logout() {
    await CometChat.logout();
  }

  get isConnected() {
    return CometChat.getLoggedInUser() != null;
  }

  get currentUserId() {
    return CometChat.getLoggedInUser()?.getUid() ?? null;
  }

  // Conversations list
  async getConversations(limit = 30) {
    const req = new CometChat.ConversationsRequestBuilder()
      .setLimit(limit).build();
    return req.fetch();
  }

  // Messages for a conversation
  async getMessages(conversationId: string, limit = 50) {
    const req = new CometChat.MessagesRequestBuilder()
      .setConversationId(conversationId)
      .setLimit(limit).build();
    return req.fetchPrevious();
  }

  // Send text
  async sendTextMessage(conversationId: string, text: string) {
    const msg = new CometChat.TextMessage(
      conversationId, text, CometChat.RECEIVER_TYPE.USER
    );
    return CometChat.sendMessage(msg);
  }

  // Mark read
  async markAsRead(conversationId: string) {
    await CometChat.markAsRead(conversationId, CometChat.RECEIVER_TYPE.USER);
  }

  // User search
  async searchUsers(query: string) {
    if (!this.isConnected) return [];
    const res = await CometChat.UserProvider.searchUsers(
      new CometChat.SearchUsersRequestBuilder()
        .setLimit(30)
        .setQuery(query)
        .build()
    );
    return res ?? [];
  }

  async getUser(userId: string) {
    if (!this.isConnected) return null;
    const res = await CometChat.UserProvider.fetchUser(userId);
    return res ?? null;
  }

  // Listeners
  onMessageReceived(handler: (msg: any) => void) {
    this.msgListeners.push(handler);
    return () => { this.msgListeners = this.msgListeners.filter(h => h !== handler); };
  }

  private setupListeners() {
    CometChat.addMessageListener('veill-msg', {
      onTextMessageReceived: (m) => this.msgListeners.forEach(h => h(m)),
      onMediaMessageReceived: (m) => this.msgListeners.forEach(h => h(m)),
    });
  }

  private teardownListeners() {
    CometChat.removeMessageListener('veill-msg');
    this.msgListeners = [];
  }
}

export const CometChatService = new CometChatServiceClass();
export default CometChatService;
```

---

## 5. Update `utils/auth.ts`

- Replace `import StreamChatService` → `import CometChatService`
- Replace `StreamChatService.connectUser()` → `CometChatService.initialize()` then `CometChatService.login()`
- Replace `StreamChatService.disconnect()` → `CometChatService.logout()`
- Everything else (OneSignal, Storage) stays the same

---

## 6. Rewrite Screens for React Navigation

### Screen mapping (old path → new path):

| Old (expo-router) | New (React Navigation) |
|---|---|
| `app/(tabs)/chats/index.tsx` | `screens/ChatListScreen.tsx` |
| `app/(tabs)/chats/[id].tsx` | `screens/ChatDetailScreen.tsx` |
| `app/(modals)/new-chat.tsx` | `screens/NewChatScreen.tsx` |
| `app/(tabs)/chats/_layout.tsx` | Part of ChatsStack in AppNavigator |
| `app/(tabs)/calls/index.tsx` | `screens/CallsScreen.tsx` (content unchanged, header wrapped in Stack.Screen) |
| `app/(tabs)/calls/_layout.tsx` | Part of MainTabs navigator |
| `app/(tabs)/settings/index.tsx` | `screens/SettingsListScreen.tsx` |
| `app/(tabs)/settings/_layout.tsx` | Part of SettingsStack in AppNavigator |
| `app/(tabs)/settings/*.tsx` | `screens/settings/*.tsx` (move, minimal changes) |
| `app/auth/sign-in.tsx` | `screens/SignInScreen.tsx` |
| `app/auth/sign-up.tsx` | `screens/SignUpScreen.tsx` |
| `app/index.tsx` | `screens/WelcomeScreen.tsx` |

### ChatListScreen
- Use `CometChatConversations` from UI Kit
- Theme: `{ primaryColor: Colors.primary, secondaryColor: Colors.lightGray, backgroundColor: Colors.background, textColor: Colors.text }`
- `onConversationClick` → `navigation.navigate('ChatDetail', { userId })`
- Pull-to-refresh reloads conversations

### ChatDetailScreen
- Use `CometChatMessages` from UI Kit
- Accept `userId` param from route
- Load messages via `CometChatService.getMessages()`
- Send via `CometChatService.sendTextMessage()`
- Header shows peer name + online status (from CometChat presence)
- Right header: video call, voice call, info icons (calls use Daily.co, keep untouched)

### NewChatScreen
- Use `CometChatUsers` from UI Kit
- Search via `CometChatService.searchUsers()`
- On user press → navigate to ChatDetail

### Settings Screens
- Replace `useRouter()` with `navigation.navigate('SettingsProfileEdit', { name, about, avatar })`
- Replace `router.push('/settings/...')` with `navigation.navigate('SettingsXxx')`
- Keep all content identical

### Calls Screen
- Replace `<Stack>` header with `navigation.setOptions()` in `useLayoutEffect`
- Replace `useRouter` imports — this screen doesn't navigate elsewhere
- Keep all call logic, Daily.co integration, and UI exactly as-is

---

## 7. Update `app/_layout.tsx` logic → `App.tsx` + `AppNavigator.tsx`

The auth guard currently in `app/_layout.tsx` moves into `AppNavigator.tsx`:

```typescript
// In AppNavigator, render conditionally:
const { isAuthenticated, userId } = await AuthService.getCurrentAuthState();
if (isAuthenticated && userId) {
  // Show MainTabs, connect CometChat
  await CometChatService.login(userId, displayName);
} else {
  // Show Welcome → Auth flow
}
```

---

## 8. Update OneSignal Handler (`utils/onesignal.ts` or `App.tsx`)

Current code uses `router.push(`/chats/${data.senderId}`)` — replace with:
```typescript
navigationRef.current?.navigate('ChatDetail', { userId: data.senderId });
```

For call notifications, keep the existing Daily.co handler (untouched).

---

## 9. Delete These Files/Directories

- `utils/stream.ts` (replaced by `utils/cometchat.ts`)
- Entire `app/` directory tree (replaced by `screens/` + `navigation/`)

---

## 10. Update `babel.config.js`

Remove expo-router plugin. Keep only what's needed for Expo SDK + reanimated.

---

## 11. Environment Variables

Add to `.env`:
```
EXPO_PUBLIC_COMETCHAT_APP_ID=your_app_id
EXPO_PUBLIC_COMETCHAT_REGION=us
```

Keep existing:
```
EXPO_PUBLIC_ONESIGNAL_APP_ID=...
EXPO_PUBLIC_PUSH_SERVER_URL=...
```

---

## 12. Untouched Files (do not modify)

- `utils/daily.ts` — voice/video calls
- `components/ActiveCallOverlay.tsx` — call overlay
- `contexts/ThemeContext.tsx` — theme (keep as-is, UI Kit accepts theme prop)
- `constants/Colors.ts` — colors (UI Kit uses these via theme prop)
- `constants/Fonts.ts` — fonts
- `constants/Styles.ts` — shared styles
- `utils/storage.ts` — storage service
- `utils/permissions.ts` — permissions
- `utils/biometric.ts` — biometric auth
- `utils/app-theme.ts` — theme utils
- All component files (`ChatRow.tsx`, `AppleStyleSwipeableRow.tsx`, etc.) — minor import updates only
- All settings screen content — same screens, different path

---

## Order of Implementation

1. Package changes (npm install/remove)
2. Create `utils/cometchat.ts`
3. Update `utils/auth.ts`
4. Create `navigation/AppNavigator.tsx`
5. Create `App.tsx`
6. Move and rewrite screens (ChatList, ChatDetail, NewChat, Settings, Auth, Welcome)
7. Update OneSignal handler
8. Delete old files
9. Update babel.config
10. Add env vars
11. Verify app boots and auth flow works

---

## Risks / Notes

- CometChat UI Kit component APIs may differ from the pseudocode above — verify against official docs during implementation
- The `CometChat.ConversationsRequestBuilder` and `MessagesRequestBuilder` are paginated; handle loading more on scroll
- User presence/online status comes through CometChat's presence system, not Stream's — `user.online` should still work
- Group chat is not requested, so skip CometChatGroups component for now
- The `stream-chat` types import in `calls/index.tsx` (line 32) needs to be removed — but the calls screen itself stays
