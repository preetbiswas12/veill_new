import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '@/utils/storage';
import AuthService from '@/utils/auth';
import ChatService from '@/utils/chat';
import { registerPushToken } from '@/utils/onesignal';
import { CustomAlert } from '@/components/CustomAlert';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const segments = useSegments();
  const router = useRouter();
  const didRedirect = useRef(false);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    EnchantedLand: require('../assets/fonts/enchanted-land.otf'),
    ...FontAwesome.font,
  });
  const [initialized, setInitialized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const initApp = async () => {
      await StorageService.initializeDefaultData();
      await AuthService.initialize();
      setInitialized(true);
    };
    initApp();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initOneSignal() {
      try {
        const { OneSignal, LogLevel } = await import('react-native-onesignal');
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
        OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID');
        OneSignal.Notifications.requestPermission(false);

        const clickListener = async (event) => {
          console.log('OneSignal: notification clicked:', event);
          const data = event.getNotification().additionalData;
          if (data?.chatId) {
            router.push(`/chats/${data.chatId}`);
          } else if (data?.callId) {
            router.push('/calls');
          }
        };

        const foregroundListener = (event) => {
          console.log('OneSignal: foreground will display:', event);
        };

        OneSignal.Notifications.addEventListener('click', clickListener);
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener);

        OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
          if (granted && mounted) {
            OneSignal.Notifications.getDeviceState().then((state) => {
              const pushToken = state?.pushSubscription?.id;
              const platform = Platform.OS;
              if (pushToken) {
                registerPushToken(null, pushToken, platform);
              }
            });
          }
        });

        OneSignal.Notifications.getDeviceState().then((state) => {
          const pushToken = state?.pushSubscription?.id;
          const platform = Platform.OS;
          if (pushToken && mounted) {
            registerPushToken(null, pushToken, platform);
          }
        });
      } catch (err) {
        console.log('[OneSignal] Skipped — not available in this environment:', err);
      }
    }

    initOneSignal();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!initialized) return;
      const authState = await AuthService.getCurrentAuthState();
      const isAuthRoute = (segments[0] as string) === 'auth';
      const isTabsRoute = ['chats', 'calls', 'settings'].includes(segments[0] as string);

      if (authState.isAuthenticated && authState.userId) {
        if (isAuthRoute) {
          router.replace('/chats' as any);
        }
        try {
          await ChatService.initialize(authState.userId);
        } catch (err) {
          console.error('[Layout] Chat init error:', err);
        }
      } else {
        if (isTabsRoute) {
          router.replace('/auth/sign-in' as any);
        }
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [initialized, segments]);

  if (!loaded || !initialized || !authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />
      <CustomAlert />
      <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/sign-in"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="auth/sign-up"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/new-chat"
        options={{
          presentation: 'modal',
          title: 'New Chat',
          headerTransparent: true,
          headerBlurEffect: 'regular',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerRight: () => (
            <Link href={'/chats'} asChild>
              <TouchableOpacity
                style={{ backgroundColor: Colors.lightGray, borderRadius: 20, padding: 4 }}>
                <Ionicons name="close" color={Colors.text} size={30} />
              </TouchableOpacity>
            </Link>
          ),
          headerSearchBarOptions: {
            placeholder: 'Search name or number',
            hideWhenScrolling: false,
          },
        }}
      />
    </Stack>
    </View>
  );
};

export default InitialLayout;
