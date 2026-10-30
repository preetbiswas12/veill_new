# veill platform audit — vs Signal, WhatsApp, Telegram

**Date:** Oct 30 2026 · Scope: the full app (`C:\Users\preet\Downloads\veill\signal-clone`) · Every claim below is anchored to a file:line read today. This is the "record" version: gaps to fix, loopholes to close, and what we deliberately cannot do on the current platform. Companion to each P0/P1/P2 item is a concrete remediation target.

---

## 1 · The reference architectures, stated precisely

| | **Signal** | **WhatsApp** | **Telegram** | **veill (today)** |
|---|---|---|---|---|
| Content crypto | X3DH + Double Ratchet, per-message ratchet, forward secrecy + post-compromise security | Signal protocol (adapted for multi-device per-device ratchets) | Cloud chats: **server-readable** (server-held encryption at rest). Secret chats: per-device E2E, mobile only | Deterministic derived-key "veil" over CometChat custom messages — **zero secret inputs** (see §3) |
| Server can read content? | No (sealed sender even hides *who* sent) | No | Cloud chats: yes. Secret chats: no | **Yes — and so can any platform user** |
| Identity trust | Phone + safety-number verification of identity keys | Phone + SMS/OTP + optional 2FA PIN + security-code verification | Phone/username | **Name typed into a box → uid** (`sign-in.tsx`, `useCometChat.tsx:700-712`) |
| Credential for login | Registration lock (PIN) + SIM possession | SMS possession + optional PIN | Account password/2FA | **One global authKey shipped in the bundle** (`useCometChat.tsx:277-278`), already public in repo history (`.gitignore:44-47` admits it) |
| Group keys | Sender keys, **rotated on membership change** | Same | Cloud model | Key from GUID alone (`secure-media.ts:190`); never rotates |
| Local at rest | Encrypted DB (SQLCipher; key in keystore), screen security | Encrypted app storage, screen lock, chat lock | Varies | Text: memory-only (never on disk) — genuinely good. Media: **plaintext cache files** (`secure-media.ts:390-397`) |
| Verification ritual | Safety numbers + QR | Security code / QR | — | None |

**Honest summary of veill's posture today:** it is *below* Telegram's cloud model and far below Signal/WhatsApp. Telegram cloud chats at least encrypt under server-held keys; veill's "sealed" envelopes use keys **derived entirely from public identifiers** — CometChat's server, CometChat's employees, and *any other user of the platform* can derive every key.

---

## 2 · What is actually on the wire today

- Transport: TLS to CometChat (rest + WebSocket). Good baseline, no app-level pinning.
- All text: `ve:text` custom messages, AES-256-CTR + HMAC-SHA256 (encrypt-then-MAC), constant-time MAC compare, AES/HMAC keys domain-separated (`secure-media.ts:200-235`).
- All media: `ve:start` announce (name, mime, bytes, **digest, total** — plaintext metadata) + `ve:chunk` envelopes, same crypto, receiver verifies full-file digest (`secure-media.ts:367-404`).
- Key (1:1): `sha256("veill.mkm.v1" : conversationId : sorted(localUid, peerUid))` — `secure-media.ts:167-181, 190-194`. **Every input is public.**
- Key (group): `sha256("veill.mkm.v1" : guid : "group")` — **pure GUID, no member secret at all**, and `STORIES_GUID` is a repo constant.
- Push: FCM via CometChat extension; app displays generic body for sealed messages (`metadata.pushNotification = 'New message'` override, `useCometChat.tsx:845`); tap-routes, badge count, delivered/clicked receipts wired (`push.ts`).
- Calls: CometChat calls SDK → WebRTC. Media rides DTLS-SRTP (standard WebRTC transport encryption); **signaling and call metadata flow through CometChat**. CometChat's documented E2EE extension (Virgil keypair cards) is **deprecated** per their docs, and calls SDK exposes no verifiable E2E.

---

## 3 · Threat model — who can read what

| Adversary | Text | Media | Call audio/video | Metadata (who/when/to-whom/file names) |
|---|---|---|---|---|
| CometChat server (or a breach of it) | **All** — derives every key | **All** | Sees signaling; media ciphertext in transit (SRTP keys negotiated between peers but through their signaling) | All (they host it) |
| Any *other user* of the platform | **All 1:1 chats between any pair** — uid search is open (`find-by-username`), key needs only the two uids | Same | — | Search enumerates uids |
| Anyone who knows a GUID | All messages of that group; **stories group key is derivable from a repo constant** | Same | — | — |
| Network MITM (no pinning) | TLS-protected only | TLS-protected | TLS/DTLS | TLS-protected |
| FCM/APNs (push service) | Sealed msgs: generic string only. **Plaintext long-text echo**: >4096-char messages send as plain `TextMessage` → extension alert can carry real text to the lock screen (`push.ts:295-301` falls back to `message.text`) | Sealed | n/a | Sender uid/name in tray data |
| Device thief (screenshots, same hand) | Screenshots + recent-apps previews: **no screen capture protection anywhere** (no `expo-screen-capture`) | Cache files readable while app open | Screenshot of call | — |
| Root/forensic extractor | Text: good (memory-only) | **All media** in `Paths.cache/ve-media` plaintext until OS clears | — | AsyncStorage identity (uid/name/image) in the clear; `expo-secure-store` is installed but unused |
| APK extractor / repo reader | **Total account takeover** — `CometChat.login(anyUid, authKey)` with the bundle-embedded key | Same | Same | Same |

---

## 4 · Loopholes, ranked

### P0 — must fix before calling this private

1. **Keys are derivable by everyone, including the server.** `secure-media.ts:167-194`. The code's own comment admits it ("protects against everything except someone who can enumerate the app's user IDs" — and uid enumeration is *shipped*). A "veil" that any peer on the network can strip is not encryption; it's stale metadata hygiene. ↔ Remediation §6-A.
2. **Global authKey in the bundle = login as anyone.** `useCometChat.tsx:277-278`; `.gitignore:44-47` states it is already public in history. Anyone with the APK (or the repo) can `login('bob', authKey)`, read bob's whole history (keys are derived from public uids!), send as bob. This is the single worst hole. ↔ Remediation §6-B.
3. **No possession factor at sign-in.** Name → uid (`useCometChat.tsx:700-712`); collisions mean "john doe" is *the* account `john_doe`. Impersonation is unauthenticated by design. ↔ Remediation §6-B (claim + optional passcode server-side; can never be Signal-grade without a phone/email anchor — declare that honestly in the UI).

### P1 — fix in the E2EE upgrade

4. **>4096-byte text silently goes plaintext.** `sendTextMessage` (`useCometChat.tsx:805-860`) falls back to `TextMessage` with **no runtime indication** — the doc comment even says the tradeoff is "a fact of the source rather than of the runtime", which contradicts the household rule: declared, not silent. Worse, as plaintext it feeds the push alert → lock-screen leak (§3, FCM row). Fix: chunk sealed text into sequence envelopes (`ve:text` part 1..n), and *display* the fallback banner if kept. ↔ §6-C.
5. **Group history has no epoch/membership boundary.** Key is a GUID constant (`participantTagFor:190`): members removed today can decrypt forever; members added tomorrow decrypt the entire past. Signal rotates sender keys on membership change; we can at least epoch-bound the key to the member set. ↔ §6-D.
6. **Stories are world-readable in practice** (public backing group, GUID in the repo, auto-join). If stories are a demo, say so in the UI; if they're a feature, they inherit loophole 5 at maximum spread. Also no story deletion, no viewer receipts (`useCometChat.tsx:1834-1943`).
7. **Call screen claims "End-to-end encrypted" with a lock glyph** (`call/[id]/index.tsx:193-198`) — not verifiable: signaling rides CometChat, and the platform's E2EE is deprecated. Marketing-inherited claims are exactly the dishonesty the app's bar forbids. Change to "Encrypted in transit" today; "E2E encrypted" only after we own the call crypto (not planned on this stack) — or remove the glyph.
8. **Decrypted media sits as plaintext files** in the app cache (`Paths.cache/ve-media`, `secure-media.ts:390-397`) with no user-visible cleanup ("Clear message cache" only resets in-memory state, `storage.tsx`). Add: on-logout/periodic wipe of that directory + Save-to-gallery as the *explicit* act of persistence.
9. **No screenshot / recents protection.** Nothing sets screen capture prevention; detail screens, threads, and even call screens screenshot freely. ↔ §6-E (expo-screen-capture: prevent screenshots + recents blur, settings toggle).

### P2 — hygiene and honesty debt

10. **`ve:start` metadata in the clear** (filename, mime, byte count, plaintext digest — a strong content fingerprint). Encrypt it inside envelope v2. ↔ §6-C.
11. **Identity in AsyncStorage** (uid/name/image, `useCometChat.tsx:590-632`); `expo-secure-store` installed but unused. Move tokens/binding secrets there when §6-B lands.
12. **No rate-limiting / report-user / report-message** — a hostile user can flood uid space; add server-side flood control in §6-B along with the token service; "Report" UI is absent (WhatsApp/Signal both have block *and* report).
13. **No safety-number equivalent.** Currently meaningless (keys are public anyway); after §6-A it becomes the core trust ritual — commit to it as part of the upgrade, not "later".
14. **Push override coverage**: text sends set `pushNotification` override; confirm every `ve:start`/`ve:chunk` send does too, else the extension composes its own alert from preview fields.
15. **Log hygiene**: `[sealed-text] open failed` and friends log error shapes at debug level — fine in dev, gate behind `__DEV__` for release builds.

---

## 5 · Feature parity vs WhatsApp / Signal

Legend: ✓ done · ~ partial/cosmetic · ✗ absent · ⚠ dead or miswired control

**Messaging**
| Feature | WA | Signal | veill |
|---|---|---|---|
| Send text (sealed) | ✓ | ✓ | ✓ |
| Replies with quote *transmitted* | ✓ | ✓ | ⚠ quote bar is cosmetic — no parent id sent (`CustomMessageInput.tsx:104`), receiver never sees it, banner not cleared |
| Edit message | ✓ | ✗ | ✗ |
| Delete for everyone | ✓ | ✓ | ✓ (`useCometChat.tsx:1307-1325`) |
| Delete for me | n/a | ✓ | ✗ |
| Disappearing messages | ✓ | ✓ | ✗ (settings row is an honest no-op `Switch`, `chats-settings.tsx:156-162`) |
| View-once media | ✓ | ✓ | ✗ |
| Copy, forward | ✓ | ✓ | ✓ copy; ✓ forward (text-only — sealed media can't forward, `chat/[id].tsx:631-633`) |
| Starred messages | ✓ | ✓ | ✓ (device-local store) |
| Scheduled / polls / mentions | partial / ✓ / ✓ | ✗/✗/~ | ✗ (poll tile = honest dialog) |
| In-chat search | ✓ | ✓ | ✗ (chat-list search only, & only loaded previews) |

**Composer sources**
| | WA | Signal | veill |
|---|---|---|---|
| Camera capture | ✓ | ✓ | ✓ (in-app `expo-camera` + picker handoff) |
| Gallery / documents | ✓ | ✓ | ✓ (sealed pipeline) |
| **Voice notes** | ✓ | ✓ | ⚠ **mic button = "not wired up yet" dialog** (`CustomMessageInput.tsx:313-323`); no audio dep installed |
| Location / contacts | ✓ | ✓ | ⚠ honest-dialog tiles (`AddMoreSheet.tsx:39-40`) |
| Stickers/GIF | ✓ | ✓ | ⚠ "not connected" dialog (`CustomMessageInput.tsx:284-295`) |

**Calls** — 1:1 only ✓, ringing to *other* CometChat users via in-app nav + push tap ✓, mic/camera mute ✓; **speaker route miswired to mic mute** (`call/[id]/index.tsx:210-215`, `react-native-incall-manager` installed, unused), "Add participant" honest dialog, "Remind me" is actually just Decline (`:283-294`), no OS-level ring/CallKit.

**Groups** — create + member-pick ✓; **no add/remove after create, no info screen with member list, no leave, no admin** (`contact-info.tsx:155` handles groups but shows none of this; all members created as `participant`).

**Stories** — post (sealed ✓), 24h expiry ✓, full-screen viewer ✓; no privacy (whole platform is the audience), no deletion, no receipts, **"Text status" pencil opens the media picker** (`updates.tsx:192-200` — mislabeled).

**Notifications** — receive, tap-route (incl. killed state), badge, delivered/clicked receipts ✓; **no quick-reply/action buttons** (WA/Signal both), no channel/sound customization (`ANDROID_CHANNEL_ID` exported but never used, `push.ts:448`).

**Chats list** — unread badges ✓, tab badge ✓, mark-(un)read ✓, filters ✓, favourites (device-local) ✓; **no pin, no archive** (honest dialog exists), **no swipe actions**, mute lives only in per-chat/settings screens.

**Privacy settings** — blocking real ✓ (list + unblock ✓); profile-photo/about/last-seen/who-can-add/favourites = honest-dialog read-only rows (platform has no per-user visibility APIs — correctly declared); **no disable-read-receipts or typing toggle** (platform limitation — declare it, don't fake it); push prefs real ✓.

**Persistence** — history server-fetched, no local text store (privacy-positive), seal-crypto keys memory-only, cleared on logout ✓; export = share of loaded transcript text only (`contact-info.tsx:198-219`); no backup, no restore, no multi-device linking, no desktop/web session ("Linked devices" row = honest dialog).

**Bugs caught during inventory** — `starred.tsx:57` renders the literal string `Loading\u2026` (escape never processed outside a JS string); unused imports (`AppMenu` ×2, `ProfileCard`).

---

## 6 · Remediation roadmap

### A — Real keys, real E2EE (the core upgrade; transport needs no change)
1. Per-install identity keypair (X25519 + Ed25519) generated once, **stored in `expo-secure-store`**, public half published via `updateCurrentUserDetails` metadata and broadcast as `ve:key` custom messages (infra already exists for custom-message fanout).
2. Per-conversation random session key: sender generates it, **wraps it to each recipient's identity public key**, sends `ve:handshake2`. All envelopes move to `{v:2, wrapped[], senderFp, …}`; keep a v1 decoder during migration; bump `KEY_DOMAIN`.
3. Text chunking fixes loophole 4 and raises the sealed ceiling; `ve:start` metadata moves *inside* the sealed payload (loophole 10 disappears).
4. **Safety-number ritual**: 8×8 emoji/word grid or 60-digit from `sha256(sorted(identity pubkeys))`; QR verify in contact-info; key-change alerts (re-ciprocals get "safety number changed" rows — Signal's signature honesty feature).
5. Group epochs: session key wrapped to the *snapshot of member identity keys at send time*; membership change ⇒ new epoch ⇒ removed members can't decrypt the future, added members can't decrypt the past. Declare (in the upgrade notes) that this beats nothing Signal does, just catches up on the two guarantees they canonize.
6. **Add safety-verification plumbing to the privacy screen** so the honest dialogs of today (last-seen, about…) can be replaced by real toggles only where the platform gains them — never fake panels.

### B — Auth that resists an APK reader (P0-2, P0-3)
1. Restore the tiny token service (deleted stand-alone server still in history: `git checkout 7aff0ab -- server/`) as one endpoint: server holds the real CometChat REST key; issues **per-user auth tokens** via `POST /v1/users/{uid}/auth_tokens` (CometChat's own documented pattern); client logs in with `login(uid, authToken)` — authKey never ships again.
2. UID claim model to close P0-3: first device to claim a uid binds a **device secret** (secure-store); rebind requires a *reset* that deletes the account (honest consent dialog). Optional in-server passcode as a second factor for those who want one.
3. Rate-limit claims; add "Report" alongside Block.

### C — Sealed-meta + text ceiling (P1-4, P2-10)
Covered by A-3; interim hotfix if A slips: render the plaintext-fallback banner at send time and stop `alert` echoing text (override metadata on the fallback path too).

### D — Group epochs (P1-5) — covered by A-5; stories inherit it the moment the group stops being "public to derive".

### E — Device hygiene (P1-7..9)
1. `expo-screen-capture` (+ config plugin): prevent screenshots on threads/settings; blur/lock in recents; settings toggle, default ON.
2. Wipe `Paths.cache/ve-media` on logout + "Clear media cache" in Storage with a real byte count.
3. Move identity/binding secrets to secure-store.
4. Set `metadata.pushNotification` override on **every** `ve:*` send.

### F — Feature parity seeds (post-security, cheapest-first, all verified against inventory)
1. Voice notes: `expo-audio` record → existing sealed media pipeline (`kind:'voice'`, one `EXT_BY_MIME` entry) — the only *core* WhatsApp feature that is a dead button today.
2. Wire transmitted replies (`parentMessageId` — verify SDK setter; else metadata block) + render quote on receiver side; clear banner on send.
3. Save-to-gallery: `expo-media-library` is *already installed and plugin-configured* — one `MediaLibrary.saveToLibraryAsync` behind a long-press action.
4. Fix miswired controls: speaker → `react-native-incall-manager` routing; "Text status" → text-story composer or relabel; "Remind me" → label it Decline+Remind-with-notification or drop it; Enter-to-send Switch → implement or remove; Lock-chat → implement (screen-capture passcode gate) or remove.
5. Notification actions: `setNotificationCategoryAsync` with reply input.
6. Group member management + member list + leave; `Loading…` literal fix; unused import cleanup.
7. Pin/archive: device-local (store key already exists for favourites) — honest, since ordering isn't platform data.

### Standing honesty decisions to make after review
- If stories stay demo-scoped: label them in-UI as demo, like the alice thread already does.
- The call banner (P1-7) changes **this week** regardless: "Encrypted in transit" is the truthful maximum on this stack.
- The alice demo thread stays labeled local-only; no changes needed.

---

## 7 · What already stands up well

- Text never touches disk — bubbles and previews decrypt in memory, cache cleared on logout (`registerSecureKeyResolver(null)`).
- Push tray is deliberately generic for sealed content; the override at send time shows forethought.
- The hand-rolled primitives are clean: encrypt-then-MAC, constant-time compare, sender digest verification, domain separation, per-chunk IVs. The *implementation* would pass review; the *key management* is what fails it.
- Honest declaration dialogs replace almost every fake control — the inventory found the dead buttons listed in §5, and most talk rather than lie.
- No local DB means logs/forensics find much less than WhatsApp's local store would hold — a genuine privacy property worth keeping through the E2EE upgrade.

---

*Commit ritual applies to the doc as for code: `npx tsc --noEmit`, theme/insets/gservices scripts pass before push.*
