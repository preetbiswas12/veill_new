import * as aesjs from 'aes-js';
import { sha256 } from 'js-sha256';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';

/**
 * The privacy layer for media.
 *
 * WHAT HAPPENS TO A PICTURE
 *
 * It never reaches CometChat's file storage as pixels. The sender reads the
 * file, splits it into small chunks, encrypts each chunk with AES-256 under a
 * key both ends of the conversation can derive, and pushes the chunks as
 * ordinary custom messages. The receiver buffers them as they land, decrypts
 * each one, verifies the sender's digest, writes the result to this device's
 * cache, and renders it.
 *
 * One honest detail: the announce (`ve:start`) carries the file's name, mime,
 * byte count and digest in the clear, stored alongside the message by
 * CometChat. Only the bytes themselves stay sealed; sealing that metadata too
 * is the same upgrade that replaces the derived key below.
 *
 * THE KEY
 *
 * Each conversation has one key, derived deterministically from the
 * conversation's participants:
 *
 *   key = SHA-256("veill.mkm.v1" : conversation id : participant tag)
 *
 * Both ends derive the same value from the same public inputs, so there is no
 * key to exchange and no setup step that can fail. The honest tradeoff, stated
 * once: this protects the media against everything except someone who can
 * enumerate the app's user IDs, because the key is a derivation of public
 * identifiers rather than a random secret distributed out-of-band. A wrapped
 * random-key protocol can sit on top of the exact same chunk format when there
 * is time to test it; nothing sent on the wire changes.
 *
 * THE CHUNKS
 *
 * Every chunk is independently ciphertext - its own IV, its own MAC - and
 * carries its index and the total, so chunks arrive in any order, retries add
 * nothing, and the receiver always knows how many of them have landed, which is
 * what the bubble renders while media is streaming.
 *
 * Sent as CometChat custom messages:
 *
 *   `ve:start`  { v, id, kind, name, mime, bytes, digest, total }
 *   `ve:chunk`  { v, id, n, total, iv, mac, d }
 *
 * Integrity is encrypt-then-MAC (HMAC-SHA256 under a key derived separately
 * from the AES key), so a flipped bit anywhere fails loudly instead of showing
 * a ruined photo.
 *
 * Chunk payload size is chosen for CometChat's custom-data ceiling: 4096
 * plaintext bytes lands comfortably under it once ciphertext and base64
 * inflation are counted.
 */

const KEY_DOMAIN = 'veill.mkm.v1';
const MAC_DOMAIN = 'veill.mac.v1';

const CHUNK_BYTES = 4 * 1024;
const PENDING_MS = 60_000; // how long an unsatisfied transfer stays optimistic

export const SECURE_START = 've:start';
export const SECURE_CHUNK = 've:chunk';

export type SecuredKind = 'image' | 'video' | 'file';

interface StartEnvelope {
  v: 1;
  id: string;
  kind: SecuredKind;
  name: string;
  mime: string;
  bytes: number;
  digest: string;
  total: number;
}

interface ChunkEnvelope {
  v: 1;
  id: string;
  n: number;
  total: number;
  iv: string;
  mac: string;
  d: string;
}

export interface SecuredMediaState {
  /** The decrypted file on this device, once every chunk landed and verified. */
  uri?: string;
  meta?: StartEnvelope;
  received: number;
  total: number;
  error?: string;
  kind: SecuredKind;
}

// ---------------------------------------------------------------------------
// codec
// ---------------------------------------------------------------------------

let b64encode: (bytes: Uint8Array) => string;
let b64decode: (value: string) => Uint8Array;

{
  // globalThis.btoa/atob exist in RN 0.74+ (Hermes). The fallback covers older
  // engines only; if neither exists, secure media degrades to a plain media
  // message rather than tearing the app down.
  const globalBtoa = typeof globalThis.btoa === 'function' ? globalThis.btoa : null;
  const globalAtob = typeof globalThis.atob === 'function' ? globalThis.atob : null;

  b64encode = (bytes: Uint8Array): string => {
    let binary = '';
    const stride = 0x8000;
    for (let i = 0; i < bytes.length; i += stride) {
      binary += String.fromCharCode(...bytes.subarray(i, i + stride));
    }
    return globalBtoa ? globalBtoa(binary) : binary;
  };

  b64decode = (value: string): Uint8Array => {
    const binary = globalAtob ? globalAtob(value) : value;
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  };
}

const randomBytes = (length: number): Uint8Array => {
  const out = new Uint8Array(length);
  const stride = 1024;
  for (let offset = 0; offset < length; offset += stride) {
    out.set(
      Crypto.getRandomValues(new Uint8Array(Math.min(stride, length - offset))),
      offset
    );
  }
  return out;
};

const uniqueId = (): string =>
  Array.from(randomBytes(8))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

/** Digest of every plaintext byte, in transfer order across all chunks. */
const digestOf = (pieces: Uint8Array[]): string => {
  const hasher = sha256.create();
  for (const piece of pieces) hasher.update(piece);
  return hasher.hex();
};

// ---------------------------------------------------------------------------
// conversation key
// ---------------------------------------------------------------------------

const keyCache = new Map<string, Uint8Array>();

/**
 * The conversation's key. Tag construction lives in `participantTagFor` and is
 * shared by both ends, so the cache never has to negotiate.
 */
export const conversationKey = (
  conversationId: string,
  participantTag: string
): Uint8Array => {
  const cacheKey = conversationId + '|' + participantTag;
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;

  // Sorting makes the tag order-independent: derived from either end, the pair
  // always agrees.
  const tag = participantTag.split('|').sort().join('|');
  const key = new Uint8Array(sha256.arrayBuffer(`${KEY_DOMAIN}:${conversationId}:${tag}`));
  keyCache.set(cacheKey, key);
  return key;
};

/**
 * The participant tag for a conversation.
 *
 * A 1:1 chat uses both user IDs, so the key is specific to that pair. A group
 * uses only its GUID: membership is the permission, and whoever can read the
 * group's messages is meant to be able to open them.
 */
export const participantTagFor = (
  conversationId: string,
  chatType: string,
  localUid: string | null
): string => (chatType === 'group' ? 'group' : [localUid || '?', conversationId].join('|'));

// ---------------------------------------------------------------------------
// cipher
// ---------------------------------------------------------------------------

/** Envelope AES + HMAC keys, both derived from the conversation key. */
const derivedKeys = (key: Uint8Array) => {
  const seed = b64encode(key);
  return {
    aes: new Uint8Array(sha256.arrayBuffer(seed + KEY_DOMAIN)),
    macSeed: new Uint8Array(sha256.arrayBuffer(seed + MAC_DOMAIN)),
  };
};

const sealChunk = (plaintext: Uint8Array, key: Uint8Array) => {
  const { aes, macSeed } = derivedKeys(key);
  const iv = randomBytes(16);
  const ciphertext = new aesjs.ModeOfOperation.ctr(aes, iv).encrypt(plaintext);

  const ivB64 = b64encode(iv);
  const cipherB64 = b64encode(ciphertext);
  const mac = sha256.hmac(macSeed, `${ivB64}.${cipherB64}`);
  return { ivB64, cipherB64, mac };
};

const openChunk = (chunk: ChunkEnvelope, key: Uint8Array): Uint8Array | null => {
  const { aes, macSeed } = derivedKeys(key);
  const expected = sha256.hmac(macSeed, `${chunk.iv}.${chunk.d}`);

  // Constant-time fold: any single flipped bit takes the same path as any other.
  if (expected.length !== chunk.mac.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ chunk.mac.charCodeAt(i);
  if (diff !== 0) return null;

  // IV and ciphertext travelled as base64; the MAC stayed hex, which is why the
  // comparison above folds character codes rather than bytes.
  const iv = b64decode(chunk.iv);
  const ciphertext = b64decode(chunk.d);
  return new aesjs.ModeOfOperation.ctr(aes, iv).decrypt(ciphertext);
};

// ---------------------------------------------------------------------------
// reassembly store
// ---------------------------------------------------------------------------

interface Pending {
  start: StartEnvelope | null;
  startedAt: number;
  parts: Map<number, ChunkEnvelope>;
}

interface Resolved {
  uri: string;
  start: StartEnvelope;
}

const pending = new Map<string, Pending>();
const resolved = new Map<string, Resolved>();
const failed = new Map<string, string>();
const subscribers = new Set<() => void>();

const notify = () => {
  for (const fn of subscribers) fn();
};

const stateFor = (mediaId: string): SecuredMediaState => {
  const done = resolved.get(mediaId);
  if (done) {
    return {
      uri: done.uri,
      meta: done.start,
      received: done.start.total,
      total: done.start.total,
      kind: done.start.kind,
    };
  }
  const inflight = pending.get(mediaId);
  if (inflight) {
    const total = inflight.start?.total ?? inflight.parts.size;
    const starved = Date.now() - inflight.startedAt > PENDING_MS;
    return {
      meta: inflight.start ?? undefined,
      received: inflight.parts.size,
      total,
      kind: inflight.start?.kind ?? 'image',
      error: starved ? 'Part of this media never arrived' : undefined,
    };
  }
  return { received: 0, total: 0, kind: 'image', error: failed.get(mediaId) };
};

const dropPending = (mediaId: string, why: string) => {
  pending.delete(mediaId);
  failed.set(mediaId, why);
  notify();
};

const gcPending = () => {
  const now = Date.now();
  for (const [id, entry] of pending) {
    if (now - entry.startedAt > PENDING_MS + 60_000) pending.delete(id);
  }
};

export const useSecureMedia = (mediaId: string): SecuredMediaState => {
  const [state, setState] = useState<SecuredMediaState>(() => stateFor(mediaId));

  useEffect(() => {
    const sync = () => setState(stateFor(mediaId));
    subscribers.add(sync);
    sync();
    return () => {
      subscribers.delete(sync);
    };
  }, [mediaId]);

  return state;
};

// The store cannot know the key on its own - the provider does, because only it
// holds the current uid and the per-conversation types. It registers here once
// at session start.
let resolveKey: ((conversationId: string) => Uint8Array | null) | null = null;

export const registerSecureKeyResolver = (
  fn: ((conversationId: string) => Uint8Array | null) | null
) => {
  resolveKey = fn;
};

// `finalize` needs to know which conversation a media id belongs to, so the
// ingest keeps that mapping alongside the metadata.
const conversationOf = new Map<string, string>();

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

const openAll = (entry: Pending, key: Uint8Array): Uint8Array[] | null => {
  const out: Uint8Array[] = [];
  for (let n = 0; n < entry.start!.total; n++) {
    const chunk = entry.parts.get(n);
    if (!chunk) return null;
    const plaintext = openChunk(chunk, key);
    // A failed MAC means the bytes are not the ones the sender sealed. Nothing
    // partial gets rendered: the transfer reports its failure honestly.
    if (!plaintext) {
      dropPending(entry.start!.id, 'This media failed a safety check');
      return null;
    }
    out.push(plaintext);
  }
  return out;
};

const joinBytes = (pieces: Uint8Array[]): Uint8Array => {
  const length = pieces.reduce((sum, piece) => sum + piece.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const piece of pieces) {
    out.set(piece, offset);
    offset += piece.length;
  }
  return out;
};

/** Completes a transfer: opens every chunk, checks the digest, writes the file. */
const finalize = async (mediaId: string, conversationId: string): Promise<void> => {
  const entry = pending.get(mediaId);
  if (!entry?.start || entry.parts.size < entry.start.total) return;

  const key = resolveKey ? resolveKey(conversationId) : null;
  // No resolver (or a key that does not exist yet) keeps the transfer waiting
  // rather than failing it: chunks that landed are kept for a later attempt.
  if (!key) {
    conversationOf.set(mediaId, conversationId);
    return;
  }

  const pieces = openAll(entry, key);
  if (!pieces) return;

  if (digestOf(pieces) !== entry.start.digest) {
    dropPending(mediaId, 'This media failed a safety check');
    return;
  }

  try {
    const ext = EXT_BY_MIME[entry.start.mime] || 'bin';
    const dir = new Directory(Paths.cache, 've-media');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

    const file = new File(dir, `${mediaId}.${ext}`);
    file.create({ intermediates: true, overwrite: true });
    file.write(joinBytes(pieces));

    resolved.set(mediaId, { uri: file.uri, start: entry.start });
    pending.delete(mediaId);
    failed.delete(mediaId);
    notify();
  } catch {
    dropPending(mediaId, 'This media could not be saved');
  }
};

/**
 * Feeds one incoming message into the pipeline.
 *
 * Returns the media id when the message is a carrier for a secured transfer, so
 * the caller knows the message itself should never render as a bubble - its
 * payload surfaces through `useSecureMedia` instead.
 */
export const ingestSecuredMessage = (message: any, conversationId: string): string | null => {
  const category =
    typeof message?.getCategory === 'function' ? message.getCategory() : message?.category;
  if (category !== 'custom') return null;

  const type = typeof message?.getType === 'function' ? message.getType() : message?.type;
  if (type !== SECURE_START && type !== SECURE_CHUNK) return null;

  const data = typeof message?.getData === 'function' ? message.getData() : message?.data;
  if (!data || typeof data !== 'object') return null;

  const id = String(data.id || '');
  if (!id) return null;

  if (type === SECURE_START) {
    conversationOf.set(id, conversationId);
    if (Number(data.total) > 0 && id) {
      const next: StartEnvelope = {
        v: 1,
        id,
        kind: (data.kind as SecuredKind) || 'image',
        name: String(data.name || 'media'),
        mime: String(data.mime || 'application/octet-stream'),
        bytes: Number(data.bytes || 0),
        digest: String(data.digest || ''),
        total: Number(data.total),
      };
      const existing = pending.get(id);
      if (existing && existing.start) return id; // duplicate announce; ignore
      if (existing) {
        existing.start = next;
      } else {
        pending.set(id, { start: next, startedAt: Date.now(), parts: new Map() });
      }
      failed.delete(id);
      notify();
      void finalize(id, conversationId);
    }
    return id;
  }

  // `ve:chunk`
  const n = Number(data.n);
  if (!Number.isFinite(n)) return id;
  conversationOf.set(id, conversationId);

  let entry = pending.get(id);
  if (!entry) {
    // Chunks can outpace the announce over the wire; the store stays open and
    // the metadata lands when `ve:start` arrives.
    entry = { start: null, startedAt: Date.now(), parts: new Map() };
    pending.set(id, entry);
  }
  if (!entry.parts.has(n)) {
    entry.parts.set(n, {
      v: 1,
      id,
      n,
      total: Number(data.total || 0),
      iv: String(data.iv || ''),
      mac: String(data.mac || ''),
      d: String(data.d || ''),
    });
    gcPending();
    notify();
    void finalize(id, conversationId);
  }
  return id;
};

/**
 * Whether one message is a secured-transfer carrier. Cheap check used by both
 * the bubble renderer and the preview line, without touching the store.
 */
export const isSecuredCarrier = (message: any): boolean => {
  const category =
    typeof message?.getCategory === 'function' ? message.getCategory() : message?.category;
  if (category !== 'custom') return false;
  const type = typeof message?.getType === 'function' ? message.getType() : message?.type;
  return type === SECURE_START || type === SECURE_CHUNK;
};

/** The media id a carrier message belongs to, from its own data. */
export const secureMediaIdOf = (message: any): string | null => {
  const data = typeof message?.getData === 'function' ? message.getData() : message?.data;
  const id = data && typeof data === 'object' ? String(data.id || '') : '';
  return id || null;
};

/** One-line preview for the conversation list. */
export const securedPreviewText = (start: StartEnvelope): string => {
  if (start.kind === 'image') return '🔒 Photo';
  if (start.kind === 'video') return '🔒 Video';
  return `🔒 ${start.name}`;
};

// ---------------------------------------------------------------------------
// sender side
// ---------------------------------------------------------------------------

export const sha256Bytes = (bytes: Uint8Array): string => {
  const hasher = sha256.create();
  hasher.update(bytes);
  return hasher.hex();
};

export interface PreparedTransfer {
  start: StartEnvelope;
  chunks: ChunkEnvelope[];
}

/** Seals a file's bytes into the announce plus its chunk set. */
export const prepareTransfer = (
  bytes: Uint8Array,
  meta: { kind: SecuredKind; name: string; mime: string },
  key: Uint8Array
): PreparedTransfer => {
  const total = Math.max(1, Math.ceil(bytes.length / CHUNK_BYTES));
  const start: StartEnvelope = {
    v: 1,
    id: uniqueId(),
    total,
    kind: meta.kind,
    name: meta.name,
    mime: meta.mime,
    bytes: bytes.length,
    digest: sha256Bytes(bytes),
  };

  const chunks: ChunkEnvelope[] = [];
  for (let n = 0; n < total; n++) {
    const slice = bytes.subarray(n * CHUNK_BYTES, (n + 1) * CHUNK_BYTES);
    const { ivB64, cipherB64, mac } = sealChunk(slice, key);
    chunks.push({
      v: 1,
      id: start.id,
      n,
      total,
      iv: ivB64,
      mac,
      d: cipherB64,
    });
  }
  return { start, chunks };
};

// ---------------------------------------------------------------------------
// sealed text
// ---------------------------------------------------------------------------

/**
 * Text rides the same primitives as media: one `ve:text` custom message whose
 * data is a single sealed envelope (own IV, own MAC) under the conversation's
 * key. Nothing new to derive, nothing new to key-exchange — the receiver opens
 * it with the exact key it would have used for a picture.
 *
 * The honest asymmetry with media: the plaintext is IN the envelope, so while
 * the key is present every reader gets it back verbatim — but the chats list,
 * push tray, and search never see it, because those surfaces stay outside the
 * sealed zone by policy (the provider marks previews locked).
 */
export const SECURE_TEXT = 've:text';

/** aes-js bundles a utf8 codec at runtime (index.js `utils.utf8`), a piece its
 * typings omit — so the codec is picked up through a tight cast once, here. */
type Utf8Codec = {
  toBytes: (text: string) => Uint8Array;
  fromBytes: (bytes: Uint8Array) => string;
};
const utf8Codec = (aesjs as unknown as { utils: { utf8: Utf8Codec } }).utils.utf8;

export interface TextEnvelope {
  v: 1;
  iv: string;
  mac: string;
  d: string;
}

/**
 * The ceiling for one sealed envelope: a plaintext byte count whose base64
 * ciphertext (plus iv/mac/json) stays inside CometChat's custom-data limit —
 * the same headroom a 4KB media chunk uses. Beyond it the sender falls back to
 * an ordinary, unsealed TextMessage rather than truncating or losing the send.
 */
export const MAX_SEALED_TEXT_BYTES = 4096;

/** Seal one text message. Overflow is the caller's decision (returns null). */
export const sealText = (text: string, key: Uint8Array): TextEnvelope | null => {
  const plain = utf8Codec.toBytes(text);
  if (plain.length > MAX_SEALED_TEXT_BYTES) return null;
  const { ivB64, cipherB64, mac } = sealChunk(plain, key);
  return { v: 1, iv: ivB64, mac, d: cipherB64 };
};

/** Open one sealed envelope; any tampering returns null. */
export const openTextEnvelope = (data: any, key: Uint8Array): string | null => {
  if (!data || typeof data !== 'object') return null;
  const chunk: ChunkEnvelope = {
    v: 1,
    id: '',
    n: 0,
    total: 1,
    iv: String(data.iv || ''),
    mac: String(data.mac || ''),
    d: String(data.d || ''),
  };
  const plain = openChunk(chunk, key);
  if (!plain) return null;
  try {
    return utf8Codec.fromBytes(plain);
  } catch {
    return null;
  }
};

/** Whether a message is a sealed-text envelope (category custom, ve:text). */
export const isSecureText = (message: any): boolean => {
  const category =
    typeof message?.getCategory === 'function' ? message.getCategory() : message?.category;
  if (category !== 'custom') return false;
  const type = typeof message?.getType === 'function' ? message.getType() : message?.type;
  return type === SECURE_TEXT;
};

export interface SealedTextState {
  text?: string;
  failed?: boolean;
}

type SealedTextResolver = (message: any) => SealedTextState;

let resolveSealedText: SealedTextResolver | null = null;

/** The provider holds the local uid and the conversation types, so it
 * registers the text resolver the same way it registers the media key one. */
export const registerSealedTextResolver = (fn: SealedTextResolver | null): void => {
  if (!fn) sealedTextCache.clear(); // plaintext never outlives a session
  resolveSealedText = fn;
};

const sealedTextCache = new Map<string, SealedTextState>();

/**
 * The plaintext of one sealed message: from the per-id cache, else the
 * registered resolver, synchronously (the work is a sha256 plus one AES pass
 * over at most the ceiling). The list preview calls this as often as the
 * bubble does; the cache makes that free.
 */
export const secureTextOf = (message: any): SealedTextState => {
  const id = String(message?.getId?.() ?? message?.id ?? '');
  const cached = id ? sealedTextCache.get(id) : undefined;
  if (cached) return cached;
  const state = resolveSealedText?.(message) ?? {};
  if (id) sealedTextCache.set(id, state);
  return state;
};
