import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import { generateClient } from 'aws-amplify/api';
import { LOGIN_USER, REGISTER_USER, GET_USER_BY_SESSION_TOKEN } from '@/graphql/operations';

const client = generateClient();

interface AuthUser {
  userId: string;
  username: string;
  isAdmin: boolean;
  starColor: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  sessionToken: string | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, starColor: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SESSION_KEY = 'entre_estrellas_session';
const AuthContext = createContext<AuthContextValue | null>(null);

function parseJsonResult<T>(value: T | string): T {
  return typeof value === 'string' ? JSON.parse(value) as T : value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const validateSession = useCallback(async (token: string) => {
    try {
      const res = await (client.graphql({
        query: GET_USER_BY_SESSION_TOKEN,
        variables: { sessionToken: token },
      }) as any);
      const userData = parseJsonResult<any>(res.data.getUserBySessionToken);
      setUser({
        userId: userData.id,
        username: userData.username,
        isAdmin: userData.isAdmin ?? false,
        starColor: userData.starColor,
      });
      setSessionToken(token);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      setSessionToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(SESSION_KEY);
    if (storedToken) {
      validateSession(storedToken);
    } else {
      setLoading(false);
    }
  }, [validateSession]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await (client.graphql({
      query: LOGIN_USER,
      variables: { username, password },
    }) as any);
    const { token, user: userData } = parseJsonResult<any>(res.data.loginUser);
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    setUser({
      userId: userData.id,
      username: userData.username,
      isAdmin: userData.isAdmin ?? false,
      starColor: userData.starColor,
    });
  }, []);

  const register = useCallback(async (username: string, password: string, starColor: string) => {
    const res = await (client.graphql({
      query: REGISTER_USER,
      variables: { username, password, starColor },
    }) as any);
    const { token, user: userData } = parseJsonResult<any>(res.data.registerUser);
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    setUser({
      userId: userData.id,
      username: userData.username,
      isAdmin: userData.isAdmin ?? false,
      starColor: userData.starColor,
    });
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setSessionToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sessionToken,
      isAdmin: user?.isAdmin ?? false,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
