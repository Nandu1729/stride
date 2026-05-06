import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, loadStoredToken, setBearerToken } from '../lib/api';
import type { AuthResult, UserSummary } from '../types/api';

interface AuthState {
  user: UserSummary | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  async function refresh() {
    try {
      const { data } = await api.get<{ user: UserSummary }>('/auth/me');
      setState({ user: data.user, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }

  useEffect(() => {
    loadStoredToken();
    refresh();
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post<AuthResult>('/auth/login', { email, password });
    setBearerToken(data.token);
    setState({ user: data.user, loading: false });
  }

  async function signup(name: string, email: string, password: string) {
    const { data } = await api.post<AuthResult>('/auth/signup', { name, email, password });
    setBearerToken(data.token);
    setState({ user: data.user, loading: false });
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setBearerToken(null);
      setState({ user: null, loading: false });
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, signup, logout, refresh }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
