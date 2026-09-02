// @ts-ignore - expo-media-library types
const MediaLibrary = require('expo-media-library');
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionResult {
  camera: PermissionStatus;
  mediaLibrary: PermissionStatus;
  notifications: PermissionStatus;
  audio: PermissionStatus;
}

async function getPermissionStatus(status: { status: string }): Promise<PermissionStatus> {
  if (status.status === 'granted') return 'granted';
  if (status.status === 'denied') return 'denied';
  return 'undetermined';
}

async function requestNotificationPermission(): Promise<PermissionStatus> {
  try {
    const { OneSignal } = await import('react-native-onesignal');
    OneSignal.Notifications.requestPermission(true);
    const granted = OneSignal.Notifications.hasPermission();
    return granted ? 'granted' : 'denied';
  } catch {
    return 'undetermined';
  }
}

export async function requestAllPermissions(): Promise<PermissionResult> {
  const result: PermissionResult = {
    camera: 'undetermined',
    mediaLibrary: 'undetermined',
    notifications: 'undetermined',
    audio: Platform.OS === 'android' ? 'granted' : 'undetermined',
  };

  try {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    result.camera = await getPermissionStatus(cameraStatus);
  } catch {
    result.camera = 'denied';
  }

  try {
    const mediaStatus = await MediaLibrary.requestPermissionsAsync();
    result.mediaLibrary = await getPermissionStatus(mediaStatus);
  } catch {
    result.mediaLibrary = 'denied';
  }

  result.notifications = await requestNotificationPermission();

  return result;
}

export async function checkPermissions(): Promise<PermissionResult> {
  const result: PermissionResult = {
    camera: 'undetermined',
    mediaLibrary: 'undetermined',
    notifications: 'undetermined',
    audio: Platform.OS === 'android' ? 'granted' : 'undetermined',
  };

  try {
    const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
    result.camera = await getPermissionStatus(cameraStatus);
  } catch {
    result.camera = 'denied';
  }

  try {
    const mediaStatus = await MediaLibrary.getPermissionsAsync();
    result.mediaLibrary = await getPermissionStatus(mediaStatus);
  } catch {
    result.mediaLibrary = 'denied';
  }

  try {
    const { OneSignal } = await import('react-native-onesignal');
    result.notifications = OneSignal.Notifications.hasPermission() ? 'granted' : 'denied';
  } catch {
    result.notifications = 'undetermined';
  }

  return result;
}

export async function openAppSettings(): Promise<void> {
  const { Linking } = await import('react-native');
  Linking.openSettings();
}
