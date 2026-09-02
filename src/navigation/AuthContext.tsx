import React from 'react';
import { AuthService } from '../../utils/auth';

export interface AuthContextProps {
  isAuthenticated: boolean;
  user: { id: string; username: string; displayName: string } | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextProps>({
  isAuthenticated: false,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<{ id: string; username: string; displayName: string } | null>(null);

  React.useEffect(() => {
    AuthService.getCurrentAuthState().then((state) => {
      setIsAuthenticated(state.isAuthenticated);
      if (state.isAuthenticated) {
        setUser({
          id: state.userId || '',
          username: state.username || '',
          displayName: state.displayName || '',
        });
      }
    });
  }, []);

  const signIn = async (username: string, password: string) => {
    const result = await AuthService.signIn(username, password);
    setIsAuthenticated(true);
    setUser({ id: result.id, username: result.username, displayName: result.displayName });
  };

  const signUp = async (username: string, displayName: string, password: string) => {
    const result = await AuthService.signUp(username, displayName, password);
    setIsAuthenticated(true);
    setUser({ id: result.id, username: result.username, displayName: result.displayName });
  };

  const signOut = async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
