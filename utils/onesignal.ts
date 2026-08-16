const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

export async function registerPushToken(
  serverToken: string | null,
  pushToken: string,
  platform: 'ios' | 'android'
): Promise<void> {
  if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') {
    return;
  }

  if (!serverToken) return;

  try {
    const resp = await fetch(`${SERVER_URL}/api/onesignal/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
      },
      body: JSON.stringify({ pushToken, platform }),
    });

    if (!resp.ok) {
      console.error('[OneSignal] Failed to register push token:', await resp.text());
    }
  } catch (err) {
    console.error('[OneSignal] Register error:', err);
  }
}

export async function unregisterPushToken(
  serverToken: string | null,
  pushToken: string
): Promise<void> {
  if (!serverToken) return;

  try {
    await fetch(`${SERVER_URL}/api/onesignal/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
      },
      body: JSON.stringify({ pushToken }),
    });
  } catch (err) {
    console.error('[OneSignal] Unregister error:', err);
  }
}
