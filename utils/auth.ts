import SocketService from './socket';
import StorageService from './storage';
import { registerPushToken, unregisterPushToken } from './onesignal';

export type AuthState = {
  userId: number | null;
  isAuthenticated: boolean;
  serverToken: string | null;
  username: string | null;
  email: string | null;
};

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';

export const AuthService = {
  async initialize(): Promise<void> {
    await StorageService.initializeDefaultData();
  },

  async getCurrentAuthState(): Promise<AuthState> {
    try {
      const stored = await StorageService.getAuth();
      return {
        userId: stored?.userId || null,
        isAuthenticated: stored?.isAuthenticated || false,
        serverToken: stored?.serverToken || null,
        username: stored?.username || null,
        email: stored?.email || null,
      };
    } catch {
      return {
        userId: null,
        isAuthenticated: false,
        serverToken: null,
        username: null,
        email: null,
      };
    }
  },

  async register(email: string, password: string, username: string): Promise<{ serverToken: string; user: any }> {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      await StorageService.saveAuth({
        userId: data.user.id,
        isAuthenticated: true,
        serverToken: data.token,
        username: data.user.username,
        email: data.user.email,
      });

      const authState = await AuthService.getCurrentAuthState();
      if (authState.userId) {
        registerPushToken(authState.serverToken, 'pending', 'web').catch(() => {});
      }

      return { serverToken: data.token, user: data.user };
    } catch (err) {
      console.error('[Auth] Register error:', err);
      throw err;
    }
  },

  async login(email: string, password: string): Promise<{ serverToken: string; user: any }> {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      await StorageService.saveAuth({
        userId: data.user.id,
        isAuthenticated: true,
        serverToken: data.token,
        username: data.user.username,
        email: data.user.email,
      });

      const authState = await AuthService.getCurrentAuthState();
      if (authState.userId) {
        registerPushToken(authState.serverToken, 'pending', 'web').catch(() => {});
      }

      return { serverToken: data.token, user: data.user };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      throw err;
    }
  },

  async connectToServer(userId: number): Promise<void> {
    try {
      const stored = await StorageService.getAuth();
      let serverToken = stored?.serverToken;

      if (!serverToken) {
        throw new Error('No server token — user must log in first');
      }

      await SocketService.connect(userId, serverToken);
    } catch (err) {
      console.error('[Auth] Connect to server error:', err);
      throw err;
    }
  },

  async signOut(): Promise<void> {
    try {
      await StorageService.clearAuth();
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
    await SocketService.disconnect();
  },

  onAuthStateChanged(callback: (state: AuthState) => void): () => void {
    let isActive = true;

    const checkAuth = async () => {
      if (!isActive) return;

      try {
        const stored = await StorageService.getAuth();

        callback({
          userId: stored?.userId || null,
          isAuthenticated: stored?.isAuthenticated || false,
          serverToken: stored?.serverToken || null,
          username: stored?.username || null,
          email: stored?.email || null,
        });
      } catch (err) {
        if (isActive) {
          callback({
            userId: null,
            isAuthenticated: false,
            serverToken: null,
            username: null,
            email: null,
          });
        }
      }
    };

    checkAuth();

    return () => {
      isActive = false;
    };
  },
};

export default AuthService;
