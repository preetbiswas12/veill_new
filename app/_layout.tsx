import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AlertDialogHost from '@/components/AlertDialog';
import { CometChatProvider } from '@/hooks/useCometChat';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

import '../global.css';

// The CometChat provider sits at the root so the identity screen and the app
// itself share one session. There is no separate identity provider: signing in
// is a CometChat UID login (see app/(auth)/sign-in.tsx).
//
// ThemeProvider wraps everything because it applies nativewind's `.dark` class,
// and every colour token in the app resolves through a variable in global.css
// that hangs off that class.
const RootNavigator = () => {
  const { isDark } = useTheme();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(home)" options={{ headerShown: false }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* One themed alert host for the whole app; screens call showAlertDialog(). */}
      <AlertDialogHost />
    </Stack>
  );
};

const RootLayout = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider>
      <CometChatProvider>
        <RootNavigator />
      </CometChatProvider>
    </ThemeProvider>
  </GestureHandlerRootView>
);

export default RootLayout;
