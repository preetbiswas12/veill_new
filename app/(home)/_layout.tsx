import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import ScreenLoading from '@/components/ScreenLoading';
import { PushNotificationGate } from '@/hooks/usePushNotifications';
import { useCometChat } from '@/hooks/useCometChat';

const HomeLayout = () => {
  const router = useRouter();
  const { user, loading } = useCometChat();

  // Gate on `loading`, not `sessionReady`: with no stored identity the provider
  // resolves `loading` to false and leaves `sessionReady` false forever, which
  // would strand this screen on the spinner with no way to reach sign-in.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [loading, user, router]);

  if (!user || loading) {
    return <ScreenLoading />;
  }

  return (
    <>
      <PushNotificationGate />
      <Stack>
        <Stack.Screen
          name="(modal)"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="call/[id]"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
        {/* Detail screens draw their own themed headers (ScreenHeader or an
            inset block above them) - the stack's native bar would stack a
            second navbar on top of them. */}
        <Stack.Screen name="contact-info" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="chats-settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="storage" options={{ headerShown: false }} />
        <Stack.Screen name="starred" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default HomeLayout;