// @ts-nocheck
import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

let CallKeep: any = null;

try {
  CallKeep = require('react-native-callkeep').default;
} catch {}

const CALLKEEP_OPTIONS = {
  ios: {
    appName: 'Veill',
    supportsVideo: true,
    maximumCallGroups: '1',
    maximumCallsPerCallGroup: '1',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'OK',
    additionalPermissions: [],
    foregroundService: {
      channelId: 'com.stargazer.veill.callkit',
      channelName: 'Foreground service for calls',
      notificationTitle: 'Veill is on a call',
      notificationIcon: 'ic_launcher',
    },
  },
};

let initialized = false;
let currentCallUuid: string | null = null;

export function setupCallKeep() {
  if (initialized) return;
  if (Platform.OS !== 'android') return;
  if (!CallKeep) return;
  try {
    CallKeep.setup(CALLKEEP_OPTIONS);
    CallKeep.setAvailable(true);
    initialized = true;
  } catch (err) {
    console.warn('[CallKeep] setup failed:', err);
  }
}

export function setupIOSPushKit() {
  // Android-only: no-op
}

async function sendVoipTokenToBackend(token: string) {
  const PUSH_SERVER_URL = (process.env.PUSH_SERVER_URL || process.env.API_BASE_URL || '').replace(/\/$/, '');
  if (!PUSH_SERVER_URL) return;
  try {
    await fetch(`${PUSH_SERVER_URL}/api/register-voip-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'ios' }),
    });
  } catch (err) {
    console.warn('[CallKeep] sendVoipToken failed:', err);
  }
}

export function endNativeCall() {
  if (currentCallUuid && CallKeep) {
    try {
      CallKeep.endCall(currentCallUuid);
    } catch {}
    currentCallUuid = null;
  }
}

export function reportCallConnected() {
  if (currentCallUuid && CallKeep) {
    try {
      CallKeep.setCurrentCallActive(currentCallUuid);
    } catch {}
  }
}

export function reportCallEnded() {
  endNativeCall();
}
