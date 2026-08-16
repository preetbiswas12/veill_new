import { SERVER_URL } from './auth';
import { AuthService } from './auth';

export interface CallToken {
  roomName: string;
  callerToken: string;
  calleeToken: string;
  e2eeKeyId: string;
  wsUrl: string;
}

const TOKEN_CACHE = new Map<string, { token: CallToken; expiresAt: number }>();

export async function getCallToken(
  myUserId: number,
  otherUserId: number,
  serverToken: string | null
): Promise<CallToken | null> {
  if (!serverToken) return null;

  const cacheKey = `${Math.min(myUserId, otherUserId)}_${Math.max(myUserId, otherUserId)}`;
  const cached = TOKEN_CACHE.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  try {
    const resp = await fetch(`${SERVER_URL}/api/calls/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
      },
      body: JSON.stringify({ otherUserId }),
    });

    if (!resp.ok) {
      return null;
    }

    const data = await resp.json();
    const token: CallToken = {
      roomName: data.roomName,
      callerToken: data.callerToken,
      calleeToken: data.calleeToken,
      e2eeKeyId: data.e2eeKeyId,
      wsUrl: data.wsUrl,
    };

    TOKEN_CACHE.set(cacheKey, {
      token,
      expiresAt: Date.now() + 22 * 60 * 60 * 1000,
    });

    return token;
  } catch {
    return null;
  }
}

export async function refreshCallTokens(
  myUserId: number,
  otherUserIds: number[],
  serverToken: string | null
): Promise<void> {
  if (!serverToken || otherUserIds.length === 0) return;

  try {
    const resp = await fetch(`${SERVER_URL}/api/calls/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
      },
      body: JSON.stringify({ userIds: otherUserIds }),
    });

    if (!resp.ok) {
      return;
    }

    const data = await resp.json();

    for (const [userId, tokenData] of Object.entries(data.tokens || {})) {
      const cacheKey = `${Math.min(myUserId, Number(userId))}_${Math.max(myUserId, Number(userId))}`;
      TOKEN_CACHE.set(cacheKey, {
        token: {
          roomName: (tokenData as any).roomName,
          callerToken: (tokenData as any).token,
          calleeToken: (tokenData as any).token,
          e2eeKeyId: (tokenData as any).e2eeKeyId,
          wsUrl: (tokenData as any).wsUrl,
        },
        expiresAt: Date.now() + 22 * 60 * 60 * 1000,
      });
    }
  } catch {
    // Silent fail - tokens will be fetched on demand
  }
}

export function getCachedCallToken(myUserId: number, otherUserId: number): CallToken | null {
  const cacheKey = `${Math.min(myUserId, otherUserId)}_${Math.max(myUserId, otherUserId)}`;
  const cached = TOKEN_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }
  return null;
}
