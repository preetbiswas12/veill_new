import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { useCometChat } from '@/hooks/useCometChat';
import {
  getExpoNotifications,
  getFirebaseMessaging,
  markPushClicked,
  markPushDelivered,
  parsePushPayload,
  presentForegroundPush,
  registerBackgroundPushHandler,
  registerDeviceForPush,
  setOpenThreadForPush,
} from '@/lib/push';

/**
 * Foreground push handling and tap routing.
 *
 * Token registration lives in the CometChat provider (it owns the session);
 * this hook covers what happens while the app is running:
 *   - shows a notification for a push that arrives in the foreground, which the
 *     OS does not surface on its own
 *   - routes a tap to the conversation, or to the ringing screen for a call
 */
export const usePushNotifications = (sessionReady: boolean): void => {
  const router = useRouter();
  const pathname = usePathname();

  // Pushes for the thread already on screen are suppressed through lib/push's
  // module state, in both the foreground path and the headless background one.
  useEffect(() => {
    const chatMatch = /\/chat\/([^/?]+)/.exec(pathname ?? '');
    setOpenThreadForPush(chatMatch ? decodeURIComponent(chatMatch[1]) : null);
  }, [pathname]);

  // Firebase requires the background handler outside the React tree, so it is
  // registered on every mount (it is a no-op after the first call).
  useEffect(() => {
    registerBackgroundPushHandler();
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    // Probe first: requiring the JS package without the native module present
    // throws "NativeRNFBTurboApp is not registered" from inside the require.
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    // Foreground pushes never trigger a system notification on their own.
    const foreground = messaging().onMessage(async (remoteMessage: any) => {
      const push = parsePushPayload(remoteMessage);
      await markPushDelivered(push);
      await presentForegroundPush(push);
    });

    // FCM rotates tokens occasionally; a rotated token that is not re-registered
    // silently stops receiving pushes. registerDeviceForPush re-reads the token
    // and re-registers it; the session gate keeps this from firing while logged
    // out.
    const refresh = messaging().onTokenRefresh(() => {
      void registerDeviceForPush();
    });

    return () => {
      foreground();
      refresh();
    };
  }, [sessionReady]);

  const routeToPush = useCallback(
    async (data: Record<string, any>) => {
      const push = parsePushPayload({ data });
      if (push.notificationId) await markPushClicked(push);
      if (!push.conversationId && !push.senderId) return;

      const peerId = push.conversationId || push.senderId;
      const params = {
        id: peerId,
        name: push.senderName || '',
        video: push.isVideo ? '1' : '0',
        direction: push.kind === 'call' ? 'incoming' : '',
        type: push.conversationType || 'user',
      };

      // Calls still ringing go to the ringing screen; pushes about calls that
      // already ended (cancelled/unanswered) open the conversation instead.
      if (
        push.kind === 'call' &&
        (!push.callAction || push.callAction === 'initiated')
      ) {
        router.navigate({ pathname: '/call/[id]', params });
        return;
      }
      router.navigate({ pathname: '/chat/[id]', params });
    },
    [router]
  );

  // Backgrounded pushes carrying the dashboard's "Notifications" key render in
  // the system tray on their own; their taps arrive through React Native
  // Firebase's open handlers — not the expo listener below, which only sees
  // locally-presented notifications. getInitialNotification covers the
  // killed-app case: the notification that launched the process is what to
  // route.
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const opened = messaging().onNotificationOpenedApp((remoteMessage: any) => {
      void routeToPush(remoteMessage?.data || {});
    });
    void messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage?.data) void routeToPush(remoteMessage.data);
      })
      .catch(() => {});

    return () => opened();
  }, [routeToPush]);

  useEffect(() => {
    // expo-notifications is absent in Expo Go; without it there are no taps to
    // listen for, so the whole effect no-ops rather than throwing.
    const Notifications = getExpoNotifications();
    if (!Notifications) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = (response.notification.request.content.data ||
          {}) as Record<string, any>;
        void routeToPush(data);
      }
    );

    // Cold start: the notification that launched the app.
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = (response.notification.request.content.data ||
          {}) as Record<string, any>;
        void routeToPush(data);
      })
      .catch(() => {});

    // Opening the app clears the launcher badge; CometChat re-sets it from the
    // next push's unreadMessageCount.
    const stateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void Notifications.setBadgeCountAsync(0).catch(() => {});
      }
    });

    return () => {
      subscription.remove();
      stateSub.remove();
    };
  }, [routeToPush]);
};

export default usePushNotifications;

/**
 * Mount point for the push listeners. Lives inside CometChatProvider (it needs
 * the session flag) and renders nothing.
 */
export const PushNotificationGate = () => {
  const { sessionReady } = useCometChat();
  usePushNotifications(sessionReady);
  return null;
};
