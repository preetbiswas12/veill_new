import { CometChat, CometChatNotifications } from '@cometchat/chat-sdk-react-native';
import * as Notifications from 'expo-notifications';
import { Platform, TurboModule, TurboModuleRegistry } from 'react-native';

/**
 * CometChat push delivery.
 *
 * While the app is open, messages and calls arrive over the chat SDK's
 * WebSocket. When the app is backgrounded or killed that socket is suspended,
 * so the OS must wake it with an FCM/APNs push. Those pushes are produced by
 * CometChat's push notification extension (a small server — see /server), and
 * the SDK's job is to hand us a token and parse what comes back:
 *
 *   CometChatNotifications.registerPushToken(token, platform)  →  token storage
 *   new CometChat.PushNotification(pushJson)                    →  payload parse
 *   markPushNotificationDelivered / …Clicked                     →  read receipts
 *
 * Firebase is imported lazily: until the native module is in the binary
 * (it needs google-services.json + a rebuild) push is simply unavailable and
 * the rest of the app is unaffected.
 */

type MessagingModule = any;

let messagingCache: MessagingModule | null | undefined;

/**
 * Firebase is only usable once its native module is in the binary. Requiring
 * the JS package when it is not linked does not throw synchronously - it fails
 * later, inside TurboModule lookup, as an uncaught "NativeRNFBTurboApp is not
 * registered". So check registration first and skip the require entirely.
 */
const isFirebaseLinked = (): boolean => {
  for (const name of ['NativeRNFBTurboApp', 'RNFBAppModule']) {
    try {
      TurboModuleRegistry.getEnforcing<TurboModule>(name);
      return true;
    } catch {
      // Not registered under this name - try the next one.
    }
  }
  return false;
};

const getMessaging = (): MessagingModule | null => {
  if (messagingCache === undefined) {
    if (!isFirebaseLinked()) {
      messagingCache = null;
      return messagingCache;
    }
    try {
      const mod = require('@react-native-firebase/messaging');
      messagingCache = mod.default ?? mod;
    } catch {
      messagingCache = null;
    }
  }
  return messagingCache;
};

/** True when the native Firebase module is present in this build. */
export const isPushAvailable = (): boolean => getMessaging() !== null;

const pushPlatform = () =>
  Platform.OS === 'ios'
    ? CometChatNotifications.PushPlatforms.FCM_REACT_NATIVE_IOS
    : CometChatNotifications.PushPlatforms.FCM_REACT_NATIVE_ANDROID;

export interface ParsedPush {
  kind: 'message' | 'call' | 'unknown';
  notificationId: string;
  title: string;
  body: string;
  conversationId: string;
  conversationType: string;
  senderId: string;
  senderName: string;
  sessionId: string;
  isVideo: boolean;
  /** The extension payload, verbatim, for `new PushNotification(raw)`. */
  raw: Record<string, any>;
}

const asObject = (value: any): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? value : {};
};

const readPushNotification = (data: Record<string, any>) => {
  if (data.pushNotification) return asObject(data.pushNotification);
  if (data.push) return asObject(data.push);
  return {};
};

/**
 * Normalises the several shapes a CometChat extension payload can take into
 * one object. Unknown payloads degrade to a plain message notification rather
 * than being dropped.
 */
export const parsePushPayload = (remoteMessage: any): ParsedPush => {
  const data = asObject(remoteMessage?.data);
  const notification = readPushNotification(data);
  const message = asObject(data.message);
  const sender = asObject(data.sender ?? message.sender ?? notification.sender);
  const receiver = asObject(data.receiver ?? message.receiver ?? notification.receiver);
  const call = asObject(data.call);

  const rawType = String(
    data.type ?? notification.type ?? call.type ?? data.category ?? ''
  ).toLowerCase();
  const isCall =
    rawType.includes('call') ||
    Boolean(call.sessionId ?? notification.sessionId ?? data.sessionId);

  const conversationId =
    receiver.uid ??
    receiver.userId ??
    receiver.guid ??
    data.conversationId ??
    message.conversationId ??
    '';
  const conversationType =
    String(receiver.type ?? data.conversationType ?? 'user').toLowerCase() === 'group'
      ? 'group'
      : 'user';

  const sessionId = String(
    call.sessionId ?? notification.sessionId ?? data.sessionId ?? ''
  );
  const callType = String(call.type ?? notification.callType ?? data.callType ?? 'audio');

  const senderName = String(sender.name ?? sender.displayName ?? sender.uid ?? '');

  return {
    kind: isCall ? 'call' : 'message',
    notificationId: String(notification.id ?? data.id ?? remoteMessage?.messageId ?? ''),
    title: isCall
      ? senderName
        ? `${callType === 'video' ? 'Video' : 'Voice'} call`
        : 'Incoming call'
      : senderName || 'New message',
    body: isCall
      ? senderName
        ? `${senderName} is calling`
        : 'Incoming call'
      : String(
          message.text ||
            (message.attachments?.length ? 'Sent an attachment' : '') ||
            data.body ||
            ''
        ),
    conversationId,
    conversationType,
    senderId: String(sender.uid ?? sender.userId ?? ''),
    senderName,
    sessionId,
    isVideo: callType === 'video',
    raw: Object.keys(notification).length ? notification : data,
  };
};

/** Ask for OS permission and hand the FCM token to CometChat. */
export const registerDeviceForPush = async (): Promise<string | null> => {
  const messaging = getMessaging();
  if (!messaging) return null;

  try {
    if (Platform.OS === 'android') {
      const androidStatus = await Notifications.getPermissionsAsync();
      if (androidStatus.status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } else {
      const iosStatus = await Notifications.getPermissionsAsync();
      if (iosStatus.status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    }

    await messaging().requestPermission();
    const token = await messaging().getToken();
    if (!token) return null;

    await CometChatNotifications.registerPushToken(token, pushPlatform());
    return token;
  } catch {
    // No Firebase config in this build — chat still works over the socket.
    return null;
  }
};

/** Drop this device's token so the extension stops pushing to it. */
export const unregisterDeviceFromPush = async (): Promise<void> => {
  try {
    await CometChatNotifications.unregisterPushToken();
  } catch {
    // Never block logout on notification cleanup.
  }
  const messaging = getMessaging();
  if (!messaging) return;
  try {
    await messaging().deleteToken();
  } catch {
    // Token may already be gone.
  }
};

/**
 * Report delivery/click back to CometChat. The SDK parses the payload itself
 * (`new PushNotification(pushJson)`), so the extension JSON is passed as-is.
 */
export const markPushDelivered = async (push: ParsedPush): Promise<void> => {
  if (!push.notificationId) return;
  try {
    await (CometChat as any).markPushNotificationDelivered(push.raw);
  } catch {
    // Feed analytics are best-effort.
  }
};

export const markPushClicked = async (push: ParsedPush): Promise<void> => {
  if (!push.notificationId) return;
  try {
    await (CometChat as any).markPushNotificationClicked(push.raw);
  } catch {
    // Feed analytics are best-effort.
  }
};

/**
 * Shows a notification for pushes that arrive while the app is in front.
 * SDK 57 removed `presentNotificationAsync`; an immediate (null-trigger)
 * schedule is the supported way to display one now.
 */
export const presentForegroundPush = async (push: ParsedPush): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: push.title,
        body: push.body,
        data: {
          kind: push.kind,
          conversationId: push.conversationId,
          conversationType: push.conversationType,
          senderId: push.senderId,
          senderName: push.senderName,
          sessionId: push.sessionId,
          isVideo: String(push.isVideo),
          notificationId: push.notificationId,
        },
      },
      trigger: null,
    });
  } catch {
    // Notifications are disabled at the OS level — nothing else to do.
  }
};

/** Runs for pushes delivered while the app is backgrounded or closed. */
export const handleBackgroundPush = async (remoteMessage: any): Promise<void> => {
  const push = parsePushPayload(remoteMessage);
  await presentForegroundPush(push);
};

/**
 * Must be registered as early as possible (the app entry file) — Firebase
 * requires the background handler outside the React tree.
 */
export const registerBackgroundPushHandler = (): void => {
  const messaging = getMessaging();
  if (!messaging) return;
  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      await handleBackgroundPush(remoteMessage);
    });
  } catch {
    // Native module missing.
  }
};

export const ANDROID_CHANNEL_ID = 'default';
