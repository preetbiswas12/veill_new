# Push notification extension

CometChat's realtime layer is a WebSocket, which is what the app uses while it
is open. When the app is backgrounded or killed the OS suspends that socket, so
something has to wake the device. This service is that something: it receives
your app's webhook events from CometChat and turns them into FCM/APNs pushes
using tokens CometChat is already storing for each user.

There is no way around this step — push delivery requires your Firebase and APNs
credentials, which only you can hold.

## What runs where

| Piece | Where | What it does |
|---|---|---|
| `lib/push.ts` (app) | mobile | gets the FCM token, hands it to `CometChatNotifications.registerPushToken`, parses what comes back, routes taps |
| this service | your server | receives CometChat webhooks, looks up the user's tokens, sends FCM/APNs |
| `/api/session` | your server | mints a CometChat login token so the **App Auth Key never ships in the app bundle** |

## 1. Configure CometChat

1. Deploy this service (any Node host: Render, Railway, Fly, Cloud Run, a VPS).
2. In **CometChat Dashboard → your app → Webhooks**, set the URL to
   `https://<your-host>/webhooks/cometchat` and subscribe to:
   - `Message Delivered`
   - `Call Initiated`, `Call Accepted`, `Call Rejected`, `Call Cancelled`, `Call Ended`
3. Copy `.env.example` to `.env` and fill it in:
   - App ID + Auth Key from **Dashboard → App → API Keys**
   - `GOOGLE_SERVICE_ACCOUNT_*` from Firebase Console → Project settings → Service accounts
   - `APNS_*` from Apple Developer → Keys → AuthKey `.p8` file
   - `CLIENT_SHARED_SECRET` — any random string (`openssl rand -hex 32`)

```bash
npm install
npm start
curl https://<your-host>/health
```

## 2. Add Firebase to the app

CometChat only accepts FCM (`fcm_react_native_android/ios`) and APNs tokens —
not Expo's push service. The app already depends on
`@react-native-firebase/messaging`, so:

1. Create a Firebase project, add the Android app with package
   `com.stargazer.veill`, download `google-services.json`.
2. Put it at the repo root and reference it in `app.json`:

```json
"android": { "googleServicesFile": "./google-services.json" }
```

3. iOS: enable the Push Notifications capability for the bundle id
   `com.stargazer.veill` and upload the same `.p8`.
4. Rebuild: `npx expo prebuild --clean && npx expo run:android` (or `run:ios`).

Until that rebuild happens the app catches the missing native module and runs
with push silently disabled — chat, calls, and everything else keep working over
the socket.

## 3. Keep the App Auth Key out of the app (recommended)

Today `EXPO_PUBLIC_COMETCHAT_API_KEY` is bundled into the JS, so anyone who
unzips the app can log in as any user. Once `/api/session` is deployed, the app
can ask for a short-lived token instead:

```ts
const { token } = await fetch('https://<your-host>/api/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-client-secret': SHARED },
  body: JSON.stringify({ uid, name, avatar }),
}).then((r) => r.json());

await CometChat.login(uid, '', token);
```

`SHARED` still ships in the bundle, so treat it as rate-limit + monitor material
rather than a hard secret; the App Auth Key is the one that must not be there.

## Payload shapes — what to verify

The event mapping in `src/events.js` assumes webhook v3 bodies
(`{ appId, event, data: { message, sender, receiver } }`). That is the documented
shape, but it is the one part of this service that cannot be verified from the
repo. After your first live test, check the server log for
`[webhook] … fcm=… apns=…`; if counts are 0, the payload path or event name is
different from the assumption and `src/events.js` is the only file to adjust.

## Not implemented here

- **Answer/decline buttons on the call notification.** Those need APNs VoIP
  (`PushKit`) and `react-native-callkeep`, which is a separate native
  integration. Tapping a call notification opens the app's ringing screen,
  where accept/decline already work.
- **Per-conversation push preferences.** The SDK exposes them
  (`CometChatNotifications.fetchPreferences` / `updatePreferences`,
  `muteConversations`), but there is no settings UI wired up yet — the extension
  currently pushes everything CometChat tells it to.
