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
      </Stack>
    </>
  );
};

export default HomeLayout;