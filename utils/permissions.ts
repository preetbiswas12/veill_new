// @ts-ignore - expo-media-library types
const MediaLibrary = require('expo-media-library');
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
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

export async function requestAllPermissions(): Promise<PermissionResult> {
  const result: PermissionResult = {
    camera: 'undetermined',
    mediaLibrary: 'undetermined',
    notifications: 'undetermined',
    audio: 'undetermined',
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

  try {
    const notificationStatus = await Notifications.requestPermissionsAsync();
    result.notifications = await getPermissionStatus(notificationStatus);
  } catch {
    result.notifications = 'denied';
  }

  try {
    if (Platform.OS === 'ios') {
      const { AVAudioSession } = await import('expo-av');
      const audioStatus = await AVAudioSession.requestPermissionAsync();
      result.audio = audioStatus.granted ? 'granted' : 'denied';
    } else {
      result.audio = 'granted';
    }
  } catch {
    result.audio = 'undetermined';
  }

  return result;
}

export async function checkPermissions(): Promise<PermissionResult> {
  const result: PermissionResult = {
    camera: 'undetermined',
    mediaLibrary: 'undetermined',
    notifications: 'undetermined',
    audio: 'undetermined',
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
    const notificationStatus = await Notifications.getPermissionsAsync();
    result.notifications = await getPermissionStatus(notificationStatus);
  } catch {
    result.notifications = 'denied';
  }

  try {
    if (Platform.OS === 'ios') {
      const { AVAudioSession } = await import('expo-av');
      const audioStatus = await AVAudioSession.getPermissionAsync();
      result.audio = audioStatus.granted ? 'granted' : 'denied';
    } else {
      result.audio = 'granted';
    }
  } catch {
    result.audio = 'undetermined';
  }

  return result;
}

export async function openAppSettings(): Promise<void> {
  const { Linking } = await import('react-native');
  Linking.openSettings();
}
