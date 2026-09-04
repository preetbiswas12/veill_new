import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  CHATS: 'whatsapp_chats',
  MESSAGES: 'whatsapp_messages_',
  SETTINGS: 'whatsapp_settings',
  PROFILE: 'whatsapp_profile',
  CALLS: 'whatsapp_calls',
  AUTH: 'whatsapp_auth',
};

const isWeb = Platform.OS === 'web';

// ─── Web-only encrypted storage for sensitive data (auth tokens, keys) ───────
// Uses a session-bound AES-GCM KEK stored in sessionStorage.
// Closing the browser destroys the KEK, making stored data unrecoverable.

let webKek: CryptoKey | null = null;

async function getWebKek(): Promise<CryptoKey> {
  if (webKek) return webKek;

  const subtle = (globalThis as any).crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto not available');

  let kekRaw: ArrayBuffer | null = null;
  const sessionKey = 'veill_storage_kek';

  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(sessionKey);
    if (stored) {
      kekRaw = base64ToBuffer(stored);
    }
  }

  if (!kekRaw) {
    const rawBytes = crypto.getRandomValues(new Uint8Array(32));
    kekRaw = rawBytes.buffer;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(sessionKey, bufferToBase64(kekRaw));
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

async function encryptWeb(plaintext: string): Promise<string> {
  const subtle = (globalThis as any).crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto not available');
  const kek = await getWebKek();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, kek, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bufferToBase64(combined.buffer);
}

async function decryptWeb(encryptedBase64: string): Promise<string> {
  const subtle = (globalThis as any).crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto not available');
  const kek = await getWebKek();
  const combined = base64ToBuffer(encryptedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, kek, ciphertext);
  return new TextDecoder().decode(decrypted);
}

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

// ─── Sensitive keys that must be encrypted on web ────────────────────────────

const SENSITIVE_KEYS = new Set([STORAGE_KEYS.AUTH]);

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      if (SENSITIVE_KEYS.has(key)) {
        try {
          return await decryptWeb(raw);
        } catch {
          return null;
        }
      }
      return raw;
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      if (SENSITIVE_KEYS.has(key)) {
        const encrypted = await encryptWeb(value);
        localStorage.setItem(key, encrypted);
        return;
      }
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const StorageService = {
  async getChats(): Promise<any[]> {
    try {
      const data = await storage.getItem(STORAGE_KEYS.CHATS);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveChats(chats: any[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },

  async getMessages(chatId: string): Promise<any[]> {
    try {
      const data = await storage.getItem(`${STORAGE_KEYS.MESSAGES}${chatId}`);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveMessages(chatId: string, messages: any[]): Promise<void> {
    await storage.setItem(`${STORAGE_KEYS.MESSAGES}${chatId}`, JSON.stringify(messages));
  },

  async addMessage(chatId: string, message: any): Promise<void> {
    const messages = await this.getMessages(chatId);
    messages.push(message);
    await this.saveMessages(chatId, messages);
  },

  async getSettings(): Promise<any> {
    try {
      const data = await storage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
      return this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  },

  async saveSettings(settings: any): Promise<void> {
    await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  async updateSetting(key: string, value: any): Promise<void> {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.saveSettings(settings);
  },

  getDefaultSettings(): any {
    return {
      theme: 'light',
      wallpaper: 'default',
      fontSize: 'medium',
      enterIsSend: false,
      mediaVisibility: true,
      readReceipts: true,
      groups: true,
      conversationTones: true,
      highPriorityNotifications: true,
      reactionNotifications: true,
      lastSeen: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      statusPrivacy: 'contacts',
      blockedContacts: [],
      fingerprintLock: false,
      twoStepVerification: false,
      twoStepPin: '',
      autoLock: 'immediately',
      showNotifications: false,
      notificationTone: 'default',
      vibrate: 'default',
      groupNotificationTone: 'default',
      groupVibrate: 'default',
      popupNotification: 'none',
      inAppNotifications: true,
      securityNotifications: true,
      chatBackup: 'never',
      archiveChats: [],
      addAccount: false,
    };
  },

  async getProfile(): Promise<any> {
    try {
      const data = await storage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
      return this.getDefaultProfile();
    } catch {
      return this.getDefaultProfile();
    }
  },

  async saveProfile(profile: any): Promise<void> {
    await storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getDefaultProfile(): any {
    return {
      name: 'John Doe',
      about: 'Hey there! I am using WhatsApp.',
      avatar: 'https://i.pravatar.cc/150?u=settings-user',
    };
  },

  async getCalls(): Promise<any[]> {
    try {
      const data = await storage.getItem(STORAGE_KEYS.CALLS);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveCalls(calls: any[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(calls));
  },

  async addCall(call: any): Promise<void> {
    const calls = await this.getCalls();
    calls.unshift(call);
    await this.saveCalls(calls);
  },

  async getAuth(): Promise<any> {
    try {
      const data = await storage.getItem(STORAGE_KEYS.AUTH);
      if (data) return JSON.parse(data);
      return null;
    } catch {
      return null;
    }
  },

  async saveAuth(auth: any): Promise<void> {
    await storage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
  },

  async clearAuth(): Promise<void> {
    await storage.deleteItem(STORAGE_KEYS.AUTH);
  },

  async initializeDefaultData(): Promise<void> {
    const settings = await this.getSettings();
    if (Object.keys(settings).length === 0) {
      await this.saveSettings(this.getDefaultSettings());
    }

    const profile = await this.getProfile();
    if (Object.keys(profile).length === 0) {
      await this.saveProfile(this.getDefaultProfile());
    }
  },
};

export default StorageService;