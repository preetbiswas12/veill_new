'use strict';

let messaging = null;
let apnProvider = null;
let firebaseReady = false;
let apnsReady = false;

/**
 * Lazy, failure-tolerant sender setup. A missing Firebase credential must not
 * stop the APNs half from working (and vice versa) — this is what makes it safe
 * to deploy before you have both.
 */
const initSenders = () => {
  if (!firebaseReady) {
    try {
      const admin = require('firebase-admin');
      const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      const path = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
      if (inline || path) {
        admin.initializeApp(
          inline
            ? { credential: admin.credential.cert(JSON.parse(inline)) }
            : { credential: admin.credential.cert(require(path)) }
        );
        messaging = admin.messaging();
        firebaseReady = true;
        console.log('[send] FCM ready');
      } else {
        console.warn('[send] no Firebase credential — FCM disabled');
      }
    } catch (caught) {
      console.warn('[send] FCM init failed:', caught.message);
    }
  }

  if (!apnsReady) {
    try {
      const apn = require('node-apn');
      const keyPath = process.env.APNS_KEY_PATH;
      const keyId = process.env.APNS_KEY_ID;
      const teamId = process.env.APNS_TEAM_ID;
      if (keyPath && keyId && teamId) {
        apnProvider = new apn.Provider({
          token: {
            key: require('fs').readFileSync(keyPath),
            keyId,
            teamId,
          },
          production: (process.env.APNS_ENVIRONMENT || 'sandbox') === 'production',
        });
        apnsReady = true;
        console.log('[send] APNs ready');
      } else {
        console.warn('[send] no APNs key — APNs disabled');
      }
    } catch (caught) {
      console.warn('[send] APNs init failed:', caught.message);
    }
  }
};

/** FCM expects a data-only payload; the OS never renders it for us. */
const isFcmToken = ({ token, platform }) =>
  /fcm/i.test(platform || '') || /^[a-zA-Z0-9_-]+:APA91b/.test(token);

const isApnsToken = ({ token, platform }) =>
  /apns|ios/i.test(platform || '') || /^[0-9a-f]{64}$/i.test(token);

const sendViaFcm = async (registrationToken, payload) => {
  await messaging.send(registrationToken, {
    data: payload,
    android: { priority: 'high' },
  });
};

const sendViaApns = async (deviceToken, payload) => {
  const notification = new (require('node-apn').Notification)({
    alert: {
      title: payload.title,
      body: payload.body,
    },
    sound: 'default',
    payload,
  });
  const result = await apnProvider.send(notification, deviceToken);
  if (!result || result.status !== 'Success') {
    throw new Error(
      `APNs rejected the push: ${result?.response?.reason || 'unknown'}`
    );
  }
};

/** Fan a payload out to every token CometChat holds for the user. */
const sendToUserTokens = async (tokens, payload) => {
  initSenders();

  const results = { fcm: 0, apns: 0, failed: 0 };

  await Promise.all(
    (tokens || []).map(async (entry) => {
      try {
        if (isFcmToken(entry)) {
          if (!firebaseReady) return;
          await sendViaFcm(entry.token, payload);
          results.fcm += 1;
          return;
        }
        if (isApnsToken(entry)) {
          if (!apnsReady) return;
          await sendViaApns(entry.token, payload);
          results.apns += 1;
          return;
        }
      } catch (caught) {
        results.failed += 1;
        console.warn('[send] token failed:', caught.message);
      }
    })
  );

  return results;
};

module.exports = { sendToUserTokens, initSenders };
