import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { useCometChat } from '@/hooks/useCometChat';
import {
  getExpoNotifications,
  getFirebaseMessaging,
  markPushClicked,
  markPushDelivered,
  parsePushPayload,
  presentForegroundPush,
  registerBackgroundPushHandler,
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
    return messaging().onMessage(async (remoteMessage: any) => {
      const push = parsePushPayload(remoteMessage);
      await markPushDelivered(push);
      await presentForegroundPush(push);
    });
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

      if (push.kind === 'call') {
        router.navigate({ pathname: '/call/[id]', params });
        return;
      }
      router.navigate({ pathname: '/chat/[id]', params });
    },
    [router]
  );

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

    return () => subscription.remove();
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
