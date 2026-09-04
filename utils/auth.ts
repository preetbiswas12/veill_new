import StorageService from './storage';
import { registerPushToken, unregisterPushToken } from './onesignal';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { getOneSignalPlayerId } from './incomingCalls';

export type AuthState = {
  userId: string | null;
  isAuthenticated: boolean;
  username: string | null;
  displayName: string | null;
  token: string | null;
};

const API_BASE = (process.env.API_BASE_URL || 'https://veill-backend.onrender.com').replace(/\/$/, '');
const TOKEN_KEY = 'veill_auth_token';
const USER_KEY = 'veill_user';

type CometchatTokenResponse = {
  cometchatUid: string;
  authToken: string;
  cometchatAppId: string;
  cometchatRegion: string;
};

async function apiPost(path: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || `HTTP ${resp.status}`);
  }
  return data;
}

export const AuthService = {
  async initialize(): Promise<void> {
    await StorageService.initializeDefaultData();
  },

  async getCurrentAuthState(): Promise<AuthState> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      const user = userJson ? JSON.parse(userJson) : null;
      return {
        userId: user?.id || null,
        isAuthenticated: !!token,
        username: user?.username || null,
        displayName: user?.displayName || null,
        token,
      };
    } catch {
      return { userId: null, isAuthenticated: false, username: null, displayName: null, token: null };
    }
  },

  async signUp(username: string, displayName: string, password: string) {
    const data = await apiPost('/api/auth/signup', { username, displayName, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    await StorageService.saveAuth({
      userId: data.user.id,
      isAuthenticated: true,
      serverToken: data.token,
      username: data.user.username,
      displayName: data.user.displayName,
    });
    try {
      const onesignalId = await getOneSignalPlayerId();
      if (onesignalId) {
        await registerPushToken(data.user.id, onesignalId);
      }
    } catch {}
    return data.user;
  },

  async signIn(username: string, password: string) {
    const data = await apiPost('/api/auth/signin', { username, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    await StorageService.saveAuth({
      userId: data.user.id,
      isAuthenticated: true,
      serverToken: data.token,
      username: data.user.username,
      displayName: data.user.displayName,
    });
    try {
      const onesignalId = await getOneSignalPlayerId();
      if (onesignalId) {
        await registerPushToken(data.user.id, onesignalId);
      }
    } catch {}
    return data.user;
  },

  async getCometChatAuthToken(): Promise<CometchatTokenResponse> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return await apiPost('/api/auth/token', {}, token || undefined);
  },

  async signOut(): Promise<void> {
    try {
      const onesignalId = await getOneSignalPlayerId();
      const authState = await AuthService.getCurrentAuthState();
      if (onesignalId && authState.userId) {
        await unregisterPushToken(authState.userId, onesignalId).catch(() => {});
      }
    } catch {}
    try {
      await CometChat.logout();
    } catch {}
    try {
      const { OneSignal } = await import('react-native-onesignal');
      OneSignal.logout();
    } catch {}
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await StorageService.clearAuth();
  },

  onAuthStateChanged(callback: (state: AuthState) => void): () => void {
    let isActive = true;
    const checkAuth = async () => {
      if (!isActive) return;
      const state = await AuthService.getCurrentAuthState();
      callback(state);
    };
    checkAuth();
    return () => {
      isActive = false;
    };
  },
};

export default AuthService;
