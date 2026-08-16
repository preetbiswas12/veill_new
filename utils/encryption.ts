import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

let Crypto: any = null;
try {
  Crypto = require('expo-crypto');
} catch {
  // expo-crypto native module not available — fallback to WebCrypto/JS
}

// ─── Secure random bytes helper (works on native + web) ─────────────────────
async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (isWeb) {
    return crypto.getRandomValues(new Uint8Array(length));
  }
  if (Crypto?.getRandomValues) {
    return Crypto.getRandomValues(new Uint8Array(length));
  }
  return crypto.getRandomValues(new Uint8Array(length));
}

// ─── Web-only encrypted localStorage wrapper ────────────────────────────────
// On web, private keys and auth tokens are encrypted with a session-bound AES-GCM key
// stored in sessionStorage. Closing the browser destroys the KEK, making localStorage
// data unrecoverable. This mitigates cold-storage exfiltration via XSS or disk access.

let webKek: CryptoKey | null = null;

async function getWebKek(): Promise<CryptoKey> {
  if (webKek) return webKek;

  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');

  let kekRaw: ArrayBuffer | null = null;
  const sessionKey = 'veill_kek';

  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(sessionKey);
    if (stored) {
      kekRaw = base64ToBuffer(stored);
    }
  }

  if (!kekRaw) {
    const newKek = await getRandomBytes(32).then(b => b.buffer as ArrayBuffer);
    kekRaw = newKek;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(sessionKey, bufferToBase64(newKek));
    }
  }

  webKek = await subtle.importKey(
    'raw',
    kekRaw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return webKek as CryptoKey;
}

async function encryptForWebStorage(plaintext: string): Promise<string> {
  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');
  const kek = await getWebKek();
  const iv = await getRandomBytes(12);
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, kek, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bufferToBase64(combined.buffer);
}

async function decryptFromWebStorage(encryptedBase64: string): Promise<string> {
  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');
  const kek = await getWebKek();
  const combined = base64ToBuffer(encryptedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, kek, ciphertext);
  return new TextDecoder().decode(decrypted);
}

function getWebCrypto(): any {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto.subtle;
  }
  return null;
}

// ─── Base64 helpers ──────────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Storage abstraction (SecureStore on native, encrypted localStorage on web) ──

const KEY_PAIR_KEY = 'veill_keypair';
const PEER_KEYS_KEY = 'veill_peer_keys';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      try {
        return await decryptFromWebStorage(encrypted);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      const encrypted = await encryptForWebStorage(value);
      localStorage.setItem(key, encrypted);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ─── Key types ───────────────────────────────────────────────────────────────

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export type PeerKeys = Record<string, string>;

// ─── Web Crypto key generation ───────────────────────────────────────────────

async function generateKeyPairWeb(): Promise<KeyPair> {
  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const publicKeyBuffer = await subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await subtle.exportKey('pkcs8', keyPair.privateKey);
  return {
    publicKey: bufferToBase64(publicKeyBuffer),
    privateKey: bufferToBase64(privateKeyBuffer),
  };
}

async function deriveSharedSecretWeb(privateKeyStr: string, publicKeyStr: string): Promise<CryptoKey> {
  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');
  const privateKey = await subtle.importKey(
    'pkcs8', base64ToBuffer(privateKeyStr), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']
  );
  const publicKey = await subtle.importKey(
    'spki', base64ToBuffer(publicKeyStr), { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  return subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptWeb(sharedKey: CryptoKey, plaintext: string): Promise<string> {
  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');
  const iv = await getRandomBytes(12);
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bufferToBase64(combined.buffer);
}

async function decryptWeb(sharedKey: CryptoKey, encryptedBase64: string): Promise<string> {
  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');
  const combined = base64ToBuffer(encryptedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}

async function sha256Web(message: string): Promise<string> {
  const subtle = getWebCrypto();
  if (!subtle) throw new Error('WebCrypto not available');
  const encoded = new TextEncoder().encode(message);
  const hash = await subtle.digest('SHA-256', encoded);
  return bufferToBase64(hash);
}

// ─── Native Crypto helpers ───────────────────────────────────────────────────

async function generateKeyPairNative(): Promise<KeyPair> {
  if (!Crypto) throw new Error('expo-crypto not available');
  const keyPair = await Crypto.generateKeyPairAsync('EC', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

async function deriveSharedSecretNative(privateKeyPem: string, publicKeyPem: string): Promise<CryptoKey> {
  if (!Crypto) throw new Error('expo-crypto not available');
  const privateKey = await Crypto.importKeyAsync(privateKeyPem, 'EC', { namedCurve: 'prime256v1' }, true, ['deriveKey']);
  const publicKey = await Crypto.importKeyAsync(publicKeyPem, 'EC', { namedCurve: 'prime256v1' }, false, []);
  return Crypto.deriveKeyAsync(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptNative(sharedKey: CryptoKey, plaintext: string): Promise<string> {
  if (!Crypto) throw new Error('expo-crypto not available');
  const iv = await getRandomBytes(12);
  const ciphertext = await Crypto.encryptAsync(plaintext, sharedKey, { name: 'AES-GCM', iv, tagLength: 128 });
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv);
  combined.set(ciphertext, iv.length);
  return bufferToBase64(combined.buffer);
}

async function decryptNative(sharedKey: CryptoKey, encryptedBase64: string): Promise<string> {
  if (!Crypto) throw new Error('expo-crypto not available');
  const combined = base64ToBuffer(encryptedBase64);
  const iv = new Uint8Array(combined.slice(0, 12));
  const ciphertext = new Uint8Array(combined.slice(12));
  const decrypted = await Crypto.decryptAsync(ciphertext, sharedKey, { name: 'AES-GCM', iv, tagLength: 128 });
  return decrypted;
}

async function sha256Native(message: string): Promise<string> {
  if (!Crypto) throw new Error('expo-crypto not available');
  return Crypto.digestStringAsync(Crypto.CryptoAlgorithm.SHA256, message);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const EncryptionService = {
  async generateKeyPair(): Promise<KeyPair> {
    if (isWeb || !Crypto) {
      const keyPair = await generateKeyPairWeb();
      await storage.setItem(KEY_PAIR_KEY, JSON.stringify(keyPair));
      return keyPair;
    }
    const keyPair = await generateKeyPairNative();
    await storage.setItem(KEY_PAIR_KEY, JSON.stringify(keyPair));
    return keyPair;
  },

  async getKeyPair(): Promise<KeyPair | null> {
    const stored = await storage.getItem(KEY_PAIR_KEY);
    if (stored) return JSON.parse(stored);
    return null;
  },

  async getOrCreateKeyPair(): Promise<KeyPair> {
    let keyPair = await this.getKeyPair();
    if (!keyPair) keyPair = await this.generateKeyPair();
    return keyPair;
  },

  async getPublicKey(): Promise<string | null> {
    const keyPair = await this.getKeyPair();
    return keyPair?.publicKey || null;
  },

  async deriveSharedSecret(privateKey: string, peerPublicKey: string): Promise<CryptoKey> {
    if (isWeb || !Crypto) return deriveSharedSecretWeb(privateKey, peerPublicKey);
    return deriveSharedSecretNative(privateKey, peerPublicKey);
  },

  async encrypt(sharedKey: CryptoKey, plaintext: string): Promise<string> {
    if (isWeb || !Crypto) return encryptWeb(sharedKey, plaintext);
    return encryptNative(sharedKey, plaintext);
  },

  async decrypt(sharedKey: CryptoKey, encryptedBase64: string): Promise<string> {
    if (isWeb || !Crypto) return decryptWeb(sharedKey, encryptedBase64);
    return decryptNative(sharedKey, encryptedBase64);
  },

  async sha256(message: string): Promise<string> {
    if (isWeb || !Crypto) return sha256Web(message);
    return sha256Native(message);
  },

  async encryptForPeer(peerPublicKey: string, plaintext: string): Promise<string> {
    const keyPair = await this.getOrCreateKeyPair();
    const sharedKey = await this.deriveSharedSecret(keyPair.privateKey, peerPublicKey);
    return this.encrypt(sharedKey, plaintext);
  },

  async decryptFromPeer(peerPublicKey: string, encryptedBase64: string): Promise<string> {
    const keyPair = await this.getOrCreateKeyPair();
    const sharedKey = await this.deriveSharedSecret(keyPair.privateKey, peerPublicKey);
    return this.decrypt(sharedKey, encryptedBase64);
  },

  async getPeerKey(peerId: string): Promise<string | null> {
    const stored = await storage.getItem(PEER_KEYS_KEY);
    if (!stored) return null;
    const peers: PeerKeys = JSON.parse(stored);
    return peers[peerId] || null;
  },

  async setPeerKey(peerId: string, publicKey: string): Promise<void> {
    const stored = await storage.getItem(PEER_KEYS_KEY);
    const peers: PeerKeys = stored ? JSON.parse(stored) : {};
    peers[peerId] = publicKey;
    await storage.setItem(PEER_KEYS_KEY, JSON.stringify(peers));
  },

  async encryptMessage(peerId: string, plaintext: string): Promise<string> {
    const peerPublicKey = await this.getPeerKey(peerId);
    if (!peerPublicKey) throw new Error(`No public key for peer ${peerId}`);
    return this.encryptForPeer(peerPublicKey, plaintext);
  },

  async decryptMessage(peerId: string, encryptedBase64: string): Promise<string> {
    const peerPublicKey = await this.getPeerKey(peerId);
    if (!peerPublicKey) throw new Error(`No public key for peer ${peerId}`);
    return this.decryptFromPeer(peerPublicKey, encryptedBase64);
  },
};

export default EncryptionService;