import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import StorageService from './storage';

const SERVER_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://veill.qzz.io';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id',
    });

    const token = tokenData.data;
    console.log('[Push] Token:', token);

    return token;
  } catch (err) {
    console.error('[Push] Error registering for notifications:', err);
    return null;
  }
}

export async function sendPushTokenToServer(token: string | null): Promise<void> {
  if (!token) return;

  try {
    const auth = await StorageService.getAuth();
    if (!auth?.serverToken || !auth?.userId) return;

    const response = await fetch(`${SERVER_URL}/api/push-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.serverToken}`,
      },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to register push token' }));
      console.error('[Push] Failed to register token:', error.error);
    } else {
      console.log('[Push] Token registered with server');
    }
  } catch (err) {
    console.error('[Push] Error sending token to server:', err);
  }
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void
): (() => void) => {
  const subscription1 = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Push] Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  const subscription2 = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[Push] Notification tapped:', response);
  });

  return () => {
    subscription1.remove();
    subscription2.remove();
  };
}
