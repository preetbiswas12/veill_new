const PUSH_SERVER_URL = (process.env.EXPO_PUBLIC_PUSH_SERVER_URL || process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export type RingCallRequest = {
  calleeIds: string[];
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video';
  callId: string;
  roomUrl: string;
};

async function post<T = any>(path: string, body: unknown): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!PUSH_SERVER_URL) {
    return { ok: false, error: 'Push server not configured — set EXPO_PUBLIC_PUSH_SERVER_URL' };
  }
  try {
    const resp = await fetch(`${PUSH_SERVER_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return { ok: false, error: (data as any)?.error || `HTTP ${resp.status}` };
    }
    return { ok: true, data: data as T };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network request failed' };
  }
}

export async function registerPushToken(userId: string | null, onesignalId: string): Promise<void> {
  if (!userId) return;
  const result = await post('/api/register-push', { userId, onesignalId });
  if (!result.ok) {
    console.warn('[Push] Register failed:', result.error);
  }
}

export async function unregisterPushToken(userId: string | null, onesignalId?: string): Promise<void> {
  if (!userId) return;
  await post('/api/unregister-push', { userId, onesignalId }).catch(() => {});
}

export async function ringCall(request: RingCallRequest): Promise<boolean> {
  const result = await post('/api/calls/ring', request);
  if (!result.ok) {
    console.warn('[Push] Call ring failed:', result.error);
  }
  return result.ok;
}

export async function cancelRing(calleeIds: string[], callId: string): Promise<void> {
  await post('/api/calls/end', { calleeIds, callId }).catch(() => {});
}
