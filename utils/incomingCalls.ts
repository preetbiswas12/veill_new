// @ts-nocheck
import { OneSignal } from 'react-native-onesignal';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import dailyCallService from './daily';
import { navigationRef } from '../src/navigation/NavigationService';
import { SCREEN_CONSTANTS } from '../src/utils/AppConstants';

const APP_ID = process.env.ONESIGNAL_APP_ID || '';
const CALL_CHANNEL_ID = 'veill_calls';
const CALL_NOTIFICATION_ID = 'veill_incoming_call';
let initialized = false;

async function ensureCallChannel() {
  try {
    await notifee.createChannel({
      id: CALL_CHANNEL_ID,
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      bypassDnd: true,
    });
  } catch (err) {
    console.warn('[IncomingCalls] createChannel failed:', err);
  }
}

async function displayFullScreenCall(call: {
  callId: string;
  roomUrl: string;
  callType: 'voice' | 'video';
  callerId: string;
  callerName: string;
}) {
  await ensureCallChannel();
  try {
    await notifee.displayNotification({
      id: CALL_NOTIFICATION_ID,
      title: `Incoming ${call.callType} call`,
      body: `${call.callerName} is calling...`,
      data: {
        type: 'call',
        callId: call.callId,
        roomUrl: call.roomUrl,
        callType: call.callType,
        callerId: call.callerId,
        callerName: call.callerName,
      },
      android: {
        channelId: CALL_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: 'default',
          launchActivity: 'default',
        },
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        smallIcon: 'ic_launcher',
        ongoing: false,
        autoCancel: true,
        category: 'call',
      },
    });
  } catch (err) {
    console.warn('[IncomingCalls] displayFullScreenCall failed:', err);
  }
}

function navigateToIncoming(call: {
  callId: string;
  roomUrl: string;
  callType: 'voice' | 'video';
  callerId: string;
  callerName: string;
}) {
  dailyCallService.handleIncomingInvite(call);
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate(SCREEN_CONSTANTS.INCOMING_CALL as never, { call } as never);
    }
  } catch (err) {
    console.warn('[IncomingCalls] navigate failed:', err);
  }
}

export function initIncomingCalls(): void {
  if (initialized) return;
  initialized = true;

  try {
    if (APP_ID) {
      OneSignal.initialize(APP_ID);
    } else {
      console.warn('[incomingCalls] ONESIGNAL_APP_ID not set — push disabled');
    }

    // When user taps the OS-level notification -> open the IncomingCall screen
    OneSignal.Notifications.addEventListener('click', (event) => {
      const data = (event.notification.additionalData as Record<string, any>) || {};
      if (data.type === 'call' && data.callId && data.roomUrl) {
        navigateToIncoming({
          callId: data.callId,
          roomUrl: data.roomUrl,
          callType: data.callType === 'video' ? 'video' : 'voice',
          callerId: data.callerId,
          callerName: data.callerName,
        });
      }
    });

    // When push arrives while app is in foreground or backgrounded -> show fullscreen
    OneSignal.Notifications.addEventListener('foregroundWillDisplay' as any, (event: any) => {
      const data = (event.notification.additionalData as Record<string, any>) || {};
      if (data.type === 'call' && data.callId && data.roomUrl) {
        const call = {
          callId: data.callId,
          roomUrl: data.roomUrl,
          callType: data.callType === 'video' ? 'video' : 'voice',
          callerId: data.callerId,
          callerName: data.callerName,
        };
        displayFullScreenCall(call);
        navigateToIncoming(call);
      }
      try {
        event.preventDefault?.();
      } catch {}
    });

    // Listen for notifee events (taps on the fullscreen notification)
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.type === 'call') {
        const data = detail.notification.data as any;
        if (data.callId && data.roomUrl) {
          navigateToIncoming({
            callId: data.callId,
            roomUrl: data.roomUrl,
            callType: data.callType === 'video' ? 'video' : 'voice',
            callerId: data.callerId,
            callerName: data.callerName,
          });
        }
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.type === 'call') {
        const data = detail.notification.data as any;
        if (data.callId && data.roomUrl) {
          dailyCallService.handleIncomingInvite({
            callId: data.callId,
            roomUrl: data.roomUrl,
            callType: data.callType === 'video' ? 'video' : 'voice',
            callerId: data.callerId,
            callerName: data.callerName,
          });
        }
      }
    });
  } catch (err) {
    console.warn('[IncomingCalls] init failed:', err);
  }
}

export async function getOneSignalPlayerId(): Promise<string | null> {
  try {
    const id = await OneSignal.User.pushSubscription.getIdAsync();
    return id;
  } catch {
    return null;
  }
}
