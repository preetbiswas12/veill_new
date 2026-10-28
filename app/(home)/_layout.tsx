import { Feather } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import ScreenLoading from '@/components/ScreenLoading';
import { PushNotificationGate } from '@/hooks/usePushNotifications';
import { useCometChat } from '@/hooks/useCometChat';
import { useTheme } from '@/hooks/useTheme';

const HomeLayout = () => {
  const router = useRouter();
  const { user, loading } = useCometChat();
  const { colors } = useTheme();

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
      <Stack
        screenOptions={{
          // Every screen paints its own; this is the themed base that shows
          // through wherever one does not - the stack default is white, which
          // glared in dark mode.
          contentStyle: { backgroundColor: colors['chat-bg'] },
          // Only the four modal sheets below show the native header, and it
          // takes literal values: NativeWind's CSS-variable classes do not
          // reach a native header bar.
          headerBackground: () => null,
          headerTintColor: colors['text-strong'],
          headerTitleStyle: {
            color: colors['text-strong'],
            fontSize: 17,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTitleAlign: 'center',
        }}
      >
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
        {/* The four sheets are flat, single-level screens. Nesting them inside
            a second modal Stack mounted two levels per push, so Android's
            hardware back popped an empty inner stack and left the sheet up. */}
        <Stack.Screen
          name="profile"
          options={{
            presentation: 'modal',
            title: 'Profile',
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Feather name="chevron-left" size={32} color={colors['text-strong']} />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="new-message"
          options={{
            presentation: 'modal',
            title: 'New Message',
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ fontSize: 17, color: colors['link'] }}>Cancel</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="new-group"
          options={{
            presentation: 'modal',
            title: 'Select Members',
          }}
        />
        <Stack.Screen
          name="find-by-username"
          options={{
            presentation: 'modal',
            title: 'Find by Username',
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
