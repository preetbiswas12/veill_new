import { useUser } from '@clerk/clerk-expo';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';

import ScreenLoading from '@/components/ScreenLoading';
import { CometChatProvider } from '@/hooks/useCometChat';

const HomeLayout = () => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isSignedIn, router]);

  const cometChatUser = useMemo(
    () =>
      user
        ? {
            id: user.id,
            name: user.fullName || user.username || undefined,
            image: user.hasImage ? user.imageUrl : undefined,
            username: user.username || undefined,
          }
        : null,
    [user]
  );

  if (!isSignedIn || !user) {
    return <ScreenLoading />;
  }

  return (
    <CometChatProvider user={cometChatUser}>
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
    </CometChatProvider>
  );
};

export default HomeLayout;

