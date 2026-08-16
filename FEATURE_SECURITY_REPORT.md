# Veill WhatsApp Clone — Feature & Security Report

## Architecture Overview

### Client (React Native / Expo)
- **Framework**: React Native 0.81.5 + Expo Router 6
- **State**: React hooks + local secure storage
- **Real-time**: Socket.IO client
- **Encryption**: ECDH P-256 + AES-256-GCM (expo-crypto / WebCrypto)
- **Auth**: Firebase Auth + custom JWT bridge

### Server (veill_relay)
- **Runtime**: Node.js + Express + Socket.IO
- **Database**: SQLite (better-sqlite3)
- **Calls**: LiveKit WebRTC
- **Push**: Firebase Admin (optional FCM)
- **Security**: Helmet, CORS, rate limiting, JWT auth

---

## Feature Inventory

### 1. Authentication & Onboarding
- Phone number entry with German country code mask
- OTP verification screen (6-digit code field)
- Dummy OTP: `123456` for testing
- Auth state persisted in secure storage
- Auto-redirect based on auth state
- Firebase UID ↔ server JWT bridge

### 2. Chats
- Chat list with avatars, last message, timestamps, unread counts
- Real-time message sending via Socket.IO
- End-to-end encrypted messages (ECDH + AES-256-GCM)
- Message persistence per chat (secure local storage)
- Image/photo sharing via camera or library
- Reply-to-message with swipe gesture
- Swipeable chat rows (archive, more, delete actions)
- System messages (e.g., "Chat with [Contact]")
- Pull-to-refresh on chat list
- Empty state with "Start a Chat" prompt
- New chat modal with contact search
- Server user search + local contacts fallback

### 3. Calls
- Call history with All / Missed filters
- Swipe-to-delete call entries
- Call detail modal (caller info, timestamp)
- Outgoing call initiation (voice/video)
- Incoming call alert with Accept/Decline
- Active call in-progress overlay
- LiveKit WebRTC signaling via server
- Call history persistence

### 4. Settings
- Profile card with avatar, name, about
- Profile editing (name, about, avatar photo)
- Account settings (security notifications, passkeys, 2FA, change number, delete account)
- Privacy (last seen, profile photo, about, status, read receipts, groups, fingerprint lock)
- Chats (theme, wallpaper, enter-is-send, media visibility, font size, archived chats, backup, history)
- Notifications (tones, vibrate, high priority, popup, group settings, reactions)
- Storage and data (media upload quality, message timer, manage storage)
- Help & invite a friend
- All settings persisted locally

### 5. Real-Time Features
- Socket.IO connection with auto-reconnect
- Online/offline presence indicators
- Typing indicators relay
- Read receipts and delivery confirmations
- Message deletion relay
- Chat opened/read status

### 6. Media & Attachments
- Camera photo capture
- Photo library selection (multiple)
- Encrypted image messaging
- Document, location, contact placeholders

---

## Security Features

### End-to-End Encryption (E2EE)
| Layer | Implementation |
|-------|---------------|
| Key Exchange | ECDH P-256 (prime256v1 / secp256r1) |
| Encryption | AES-256-GCM |
| Integrity | SHA-256 hash of encrypted payload |
| Key Storage | Expo SecureStore (native) / encrypted localStorage (web) |
| Key Rotation | Per-peer keys stored and managed |

**Encryption Flow:**
1. Each user generates an ECDH key pair on first launch
2. Public keys are exchanged and stored per-peer
3. Messages encrypted with derived shared secret (AES-256-GCM)
4. IV: 12 bytes random per message
5. Ciphertext + IV concatenated and Base64 encoded
6. SHA-256 hash computed server-side for integrity verification
7. Server never has access to plaintext or private keys

### Server-Side Security
| Control | Implementation |
|---------|---------------|
| Authentication | JWT tokens (jsonwebtoken) |
| Authorization | Socket.IO handshake auth middleware |
| Input Validation | Payload size limits, type checks, hash verification |
| Rate Limiting | Per-socket event rate limits (e.g., 60 msgs/min) |
| CORS | Configurable origin whitelist |
| Headers | Helmet (CSP disabled for API-only, COEP disabled for Firebase) |
| SQL Injection | Parameterized queries (better-sqlite3) |
| Timing Attacks | `crypto.timingSafeEqual` for hash comparison |
| Path Traversal | Media path validation against media directory |
| Graceful Shutdown | SIGINT/SIGTERM handlers with cleanup |

### Client-Side Security
| Control | Implementation |
|---------|---------------|
| Secure Storage | Expo SecureStore for keys, auth, messages |
| Auth State | Encrypted local persistence |
| Token Management | JWT stored securely, auto-refresh |
| Input Sanitization | Message length limits, type validation |
| Permission Checks | Camera, media library, notifications |

### Data Privacy
- **Server cannot read messages**: Only stores encrypted blobs in `pending_payloads`
- **Offline messages**: Stored encrypted, deleted after delivery
- **No message history on server**: `messages` table deprecated, no new writes
- **Media expiry**: `.veill` files auto-deleted after 24h
- **FCM silent push**: Data-only notifications, no plaintext in payload

---

## veill_relay Server Schema

```
users               — Firebase UID → server identity
conversations       — 1:1 chat rooms (user1_id < user2_id)
messages            — DEPRECATED (backward compat only)
friend_requests     — pending friend requests
friendships         — bidirectional friend links
media_files         — .veill encrypted file metadata
pending_payloads    — encrypted blobs for offline delivery
```

---

## Socket.IO Protocol

### Client → Server
- `send-message` — encrypted payload + hash + content type
- `get-pending` — fetch queued offline messages
- `delete-message` — soft delete notification
- `read-receipt` / `message-delivered` — status updates
- `mark-read` / `chat-opened` — read status
- `typing` — typing indicator
- `initiate-call` / `accept-call` / `reject-call` / `end-call`
- `webrtc-signal` — SDP/ICE candidates for LiveKit

### Server → Client
- `new-message` — encrypted message relay
- `message-deleted` — deletion notification
- `read-receipt` / `messages-read` / `message-delivered`
- `user-online` — presence updates
- `webrtc-signal` — call signaling relay
- `call-ended` — termination notice

---

## Current Limitations & Notes

1. **Firebase Config**: Placeholder values in `utils/auth.ts` — needs real Firebase project credentials
2. **Server URL**: Hardcoded to `localhost:3000` in dev — update for production
3. **LiveKit**: Requires DGX machine + Cloudflare Tunnel for production calls
4. **Media Chunks**: Chunked upload infrastructure exists but not fully wired in UI
5. **Group Chats**: Architecture supports 1:1 only currently
6. **Message Search**: Not implemented in UI
7. **Blocked Contacts**: Setting exists but no enforcement logic yet

---

## Running the System

```bash
# 1. Start server
cd veill_relay
npm install
cp .env.example .env
npm run migrate
npm run dev

# 2. Start client (new terminal)
npm install
npx expo start
```

**Test OTP**: `123456`

---

## Security Checklist

- [x] E2EE messages (ECDH + AES-256-GCM)
- [x] Server never sees plaintext
- [x] JWT authentication
- [x] Rate limiting
- [x] Input validation + size limits
- [x] Timing-safe hash comparison
- [x] Secure key storage
- [x] CORS + security headers
- [x] Parameterized SQL queries
- [x] Offline message queuing (encrypted)
- [x] Media expiry cleanup
- [x] Graceful shutdown
- [ ] Firebase ID token verification (skipped in dev mode)
- [ ] Certificate pinning (not implemented)
- [ ] Biometric auth for app unlock (UI exists, not enforced)
- [ ] Backup encryption (chat backup setting exists)
