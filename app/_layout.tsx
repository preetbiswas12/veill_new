import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CometChatProvider } from '@/hooks/useCometChat';

import '../global.css';

// The CometChat provider sits at the root so the identity screen and the app
// itself share one session. There is no separate identity provider: signing in
// is a CometChat UID login (see app/(auth)/sign-in.tsx).
const RootLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CometChatProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(home)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </CometChatProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;