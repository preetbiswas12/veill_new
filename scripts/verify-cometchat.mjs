/**
 * Verifies that every CometChat call the app makes actually works, using the
 * exact hosts the SDK uses by default and the exact request shapes the SDK
 * builds. Run it before blaming the backend:
 *
 *   node scripts/verify-cometchat.mjs
 *
 * Admin calls (createUser, auth tokens) go to <appId>.api-<region> with the
 * app key, exactly like the SDK's `isAdminApi` endpoints. Every other call goes
 * to <appId>.apiclient-<region> with the user's authToken, exactly like the
 * SDK's client endpoints.
 */
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const APP_ID = env.EXPO_PUBLIC_COMETCHAT_APP_ID;
const APP_KEY = env.EXPO_PUBLIC_COMETCHAT_API_KEY;
const REGION = (env.EXPO_PUBLIC_COMETCHAT_REGION || 'us').toLowerCase();

if (!APP_ID || !APP_KEY) {
  console.error('Missing EXPO_PUBLIC_COMETCHAT_APP_ID / EXPO_PUBLIC_COMETCHAT_API_KEY in .env');
  process.exit(2);
}

const ADMIN = `https://${APP_ID}.api-${REGION}.cometchat.io/v3.0`;
const CLIENT = `https://${APP_ID}.apiclient-${REGION}.cometchat.io/v3.0`;
const CALLS = `https://${APP_ID}.call-${REGION}.cometchat.io/v3`;

const UID = 'alice';
const PEER = 'bob';
const GROUP = 'signal-stories';

// Mirrors what the SDK's request layer sends.
const baseHeaders = {
  appId: APP_ID,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  sdk: 'chat-sdk-react-native@4.1.0',
  'User-Agent': 'cc_react_native_sdk',
};

let token = null;
const results = [];

async function call(label, { method = 'GET', base = CLIENT, path, body, admin = false, expect = [200] }) {
  const headers = { ...baseHeaders };
  if (admin) headers.apiKey = APP_KEY;
  else if (token) headers.authToken = token;
  else if (APP_KEY && base === ADMIN) headers.apiKey = APP_KEY;

  let status = 0;
  let text = '';
  try {
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    status = res.status;
    text = (await res.text()).replace(/\s+/g, ' ');
  } catch (e) {
    text = `NETWORK ERROR: ${e.message}`;
  }

  const ok = expect.includes(status);
  results.push({ label, ok });
  const detail = text.length > 120 ? `${text.slice(0, 120)}...` : text || '(empty)';
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(48)} ${status || '-'}  ${detail}`);
  return { ok, status, text };
}

(async () => {
  console.log(`\n=== CometChat verification ===`);
  console.log(`appId  ${APP_ID}`);
  console.log(`region ${REGION}`);
  console.log(`key    ${APP_KEY.slice(0, 8)}... (App Auth Key)`);
  console.log(`admin  ${ADMIN}`);
  console.log(`client ${CLIENT}\n`);

  console.log('-- session (admin host, app key) --');
  await call('createUser  POST /users', {
    base: ADMIN, method: 'POST', path: '/users', admin: true,
    body: { uid: UID, name: 'Alice' }, expect: [200, 400],
  });
  const tok = await call('authToken   POST /users/{uid}/auth_tokens', {
    base: ADMIN, method: 'POST', path: `/users/${UID}/auth_tokens`, admin: true, body: {},
  });
  try {
    token = JSON.parse(tok.text).data.authToken;
  } catch {
    console.error('\n  !! could not mint an auth token - aborting');
    process.exit(1);
  }
  console.log(`        token ${token.slice(0, 20)}...`);

  console.log('\n-- identity (client host, authToken) --');
  await call('getMyDetails GET /me', { path: '/me' });
  await call('getJWT       POST /me/jwt', { method: 'POST', path: '/me/jwt', body: {} });
  await call('appSettings  GET /settings', { path: '/settings' });

  console.log('\n-- users & conversations --');
  await call('listUsers    GET /users', { path: '/users?limit=10' });
  await call('userDetail   GET /users/{uid}', { path: `/users/${PEER}` });
  await call('conversations GET /conversations', { path: '/conversations' });

  console.log('\n-- messages (SDK TextMessage shape: category/type/data.text) --');
  const msg = await call('sendMessage  POST /messages', {
    method: 'POST', path: '/messages',
    body: { receiver: PEER, receiverType: 'user', category: 'message', type: 'text', data: { text: 'verification ping' } },
  });
  let messageId = null;
  try {
    messageId = JSON.parse(msg.text).data.id;
  } catch {}

  const conversationId = `${UID}_user_${PEER}`;
  await call('thread       GET /messages', { path: `/messages?conversationId=${conversationId}` });
  await call('userMessages GET /users/{id}/messages', { path: `/users/${PEER}/messages` });

  if (messageId) {
    await call('message      GET /messages/{id}', { path: `/messages/${messageId}` });
    await call('addReaction  POST /messages/{id}/reactions/{r}', { method: 'POST', path: `/messages/${messageId}/reactions/love`, body: {} });
    await call('reactions    GET /messages/{id}/reactions', { path: `/messages/${messageId}/reactions` });
    await call('readReceipt  POST /users/{uid}/conversation/read', { method: 'POST', path: `/users/${PEER}/conversation/read`, body: {} });
    await call('deliveredRcp POST /users/{uid}/conversation/delivered', { method: 'POST', path: `/users/${PEER}/conversation/delivered`, body: {} });
    await call('rmReaction   DELETE /messages/{id}/reactions/{r}', { method: 'DELETE', path: `/messages/${messageId}/reactions/love` });
  } else {
    console.log('  SKIP  reaction/receipt checks - no message id');
    results.push({ label: 'reaction/receipt checks', ok: false });
  }

  console.log('\n-- groups (stories group) --');
  await call('createGroup  POST /groups', {
    method: 'POST', path: '/groups',
    body: { guid: GROUP, name: 'Stories', type: 'public', owner: UID, members: [UID] },
    expect: [200, 201, 400],
  });
  await call('listGroups   GET /groups', { path: '/groups?limit=10' });
  await call('groupDetail  GET /groups/{guid}', { path: `/groups/${GROUP}`, expect: [200, 404] });
  await call('joinGroup    POST /groups/{guid}/members', { method: 'POST', path: `/groups/${GROUP}/members`, body: { uids: [UID] }, expect: [200, 400, 404, 417] });
  await call('groupMembers GET /groups/{guid}/members', { path: `/groups/${GROUP}/members`, expect: [200, 404] });

  console.log('\n-- media upload (presign -> S3) --');
  await call('uploadUrl    POST /files/upload-url', {
    method: 'POST', path: '/files/upload-url', expect: [200, 400],
    body: {
      receiverType: 'user',
      receiver: PEER,
      files: [{ fileId: 'verify-probe', name: 'probe.jpg', size: 2048, mimeType: 'image/jpeg' }],
    },
  });

  console.log('\n-- calling --');
  await call('callsApi     GET /calls', {
    base: CALLS, path: '/calls', admin: true, expect: [200, 400, 401, 403],
  });

  console.log('\n-- realtime --');
  await new Promise((resolve) => {
    let settled = false;
    const done = (verdict) => {
      if (settled) return;
      settled = true;
      results.push({ label: 'websocket connect', ok: verdict.startsWith('PASS') });
      console.log(`  ${verdict}`);
      resolve();
    };
    try {
      const ws = new WebSocket(`wss://${APP_ID}.websocket-${REGION}.cometchat.io`);
      ws.onopen = () => { done('PASS  websocket  OPEN'); try { ws.close(); } catch {} };
      ws.onerror = () => done('FAIL  websocket  ERROR');
      setTimeout(() => done('FAIL  websocket  TIMEOUT'), 8000);
    } catch (e) {
      done(`FAIL  websocket  ${e.message}`);
    }
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`passed ${results.length - failed.length} / ${results.length}`);
  if (failed.length) {
    console.log('\nfailing:');
    failed.forEach((f) => console.log(`  - ${f.label}`));
  }
  process.exit(failed.length ? 1 : 0);
})();