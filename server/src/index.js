'use strict';

require('dotenv').config();

const express = require('express');
const { buildPush } = require('./events');
const { sendToUserTokens } = require('./send');
const {
  createUserIfMissing,
  createUserToken,
  getPushTokens,
} = require('./cometchat');

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 8080);
const SHARED_SECRET = process.env.CLIENT_SHARED_SECRET || '';

const log = (...args) => console.log(new Date().toISOString(), ...args);

/** app → server auth so only your app can mint tokens. */
const requireSharedSecret = (req, res, next) => {
  if (!SHARED_SECRET) {
    res.status(503).json({ error: 'CLIENT_SHARED_SECRET is not configured' });
    return;
  }
  if (req.get('x-client-secret') !== SHARED_SECRET) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
};

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    appId: process.env.COMETCHAT_APP_ID || null,
    region: process.env.COMETCHAT_REGION || 'us',
  });
});

/**
 * CometChat webhook receiver — point your app's webhook URL here.
 *
 * Always answers 200: a 5xx makes CometChat retry the same event, and a payload
 * this service does not understand is not worth retrying.
 */
app.post('/webhooks/cometchat', async (req, res) => {
  const { event, data } = req.body || {};
  res.json({ received: true });

  if (!event) {
    log('[webhook] payload without an event field:', JSON.stringify(req.body));
    return;
  }

  try {
    const push = buildPush(event, data);
    if (!push) {
      log('[webhook] ignoring event:', event);
      return;
    }
    if (!push.targetUid) {
      log('[webhook] no target uid for', event);
      return;
    }

    const tokens = await getPushTokens(push.targetUid);
    const results = await sendToUserTokens(tokens, push.payload);
    log(
      `[webhook] ${event} → ${push.targetUid}: fcm=${results.fcm} apns=${results.apns} failed=${results.failed}`
    );
  } catch (caught) {
    log('[webhook] handler error:', caught.message);
  }
});

/**
 * Token endpoint. Lets the mobile app authenticate against CometChat without
 * embedding the App Auth Key in the bundle.
 *
 * POST /api/session  { uid, name?, avatar? }
 *   → { token }     use as `CometChat.login(uid, '', token)`
 */
app.post('/api/session', requireSharedSecret, async (req, res) => {
  const { uid, name, avatar } = req.body || {};
  if (!uid || !/^[a-zA-Z0-9_-]{1,100}$/.test(uid)) {
    res.status(400).json({ error: 'a valid uid is required' });
    return;
  }

  try {
    await createUserIfMissing(uid, name, avatar);
    const token = await createUserToken(uid);
    if (!token) throw new Error('CometChat returned no token');
    log('[session] issued token for', uid);
    res.json({ token });
  } catch (caught) {
    log('[session] failed:', caught.message);
    res.status(502).json({ error: 'unable to create a session' });
  }
});

app.listen(PORT, () => {
  log(`push extension listening on :${PORT}`);
  log(`webhook url:  https://<your-host>/webhooks/cometchat`);
  log(`session url:  https://<your-host>/api/session`);
});
