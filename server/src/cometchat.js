'use strict';

const REGION = (process.env.COMETCHAT_REGION || 'us').toLowerCase();
const API_VERSION = 'v3';
const APP_ID = process.env.COMETCHAT_APP_ID || '';
const AUTH_KEY = process.env.COMETCHAT_AUTH_KEY || '';

const baseUrl = () => {
  if (!REGION || REGION === 'us') return 'https://api.cometchat.com';
  return `https://api-${REGION}.cometchat.com`;
};

/**
 * Minimal CometChat REST v3 client. Only what the push extension and the token
 * endpoint need — the mobile app talks to CometChat directly for everything
 * else.
 */
const request = async (path, { method = 'GET', body, authKey = AUTH_KEY } = {}) => {
  const response = await fetch(
    `${baseUrl()}/${API_VERSION}${path}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apiKey': authKey || appIdHeader(),
        'appId': APP_ID,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(
      `CometChat ${method} ${path} failed (${response.status}): ${JSON.stringify(parsed)}`
    );
    error.status = response.status;
    error.body = parsed;
    throw error;
  }
  return parsed;
};

/** `apiKey` header may carry the App ID on some CometChat endpoints. */
const appIdHeader = () => APP_ID;

/** Create the CometChat user if it does not exist yet. */
const createUserIfMissing = async (uid, name, avatar) => {
  const user = { UID: uid, name: name || uid };
  if (avatar) user.avatar = avatar;
  return request('/users', { method: 'POST', body: user });
};

/**
 * Mint a short-lived login token for a user. This is what lets the app drop the
 * App Auth Key from the client bundle entirely.
 */
const createUserToken = async (uid) => {
  const result = await request(`/users/${encodeURIComponent(uid)}/tokens`, {
    method: 'POST',
    body: {},
  });
  return result?.data?.token;
};

/** Every push token CometChat holds for a user, as FCM/APNs tokens. */
const getPushTokens = async (uid) => {
  const result = await request(`/users/${encodeURIComponent(uid)}/push_tokens`);
  const tokens = result?.data?.tokens;
  if (!Array.isArray(tokens)) return [];

  return tokens
    .map((entry) => {
      const value = typeof entry === 'string' ? entry : entry?.token;
      const platform = typeof entry === 'string' ? '' : entry?.platform || '';
      if (!value) return null;
      // Keep the platform so FCM vs APNs routing stays honest.
      return { token: value, platform: String(platform) };
    })
    .filter(Boolean);
};

module.exports = {
  request,
  createUserIfMissing,
  createUserToken,
  getPushTokens,
  baseUrl,
};
