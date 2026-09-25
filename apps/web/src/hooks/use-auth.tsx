import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authStorage, ApiRequestError } from '@/lib/api';
import { loginRequest, meRequest, registerRequest } from '@/lib/queries';
import type { User } from '@dirly/shared';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!authStorage.token) {
      setLoading(false);
      return;
    }
    meRequest()
      .then(({ user }) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        authStorage.clear();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await loginRequest(email, password);
    authStorage.token = res.token;
    queryClient.clear();
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    const res = await registerRequest(name, email, password);
    authStorage.token = res.token;
    queryClient.clear();
    setUser(res.user);
  }

  function logout(): void {
    authStorage.clear();
    queryClient.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === 'ADMIN', login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}

export { ApiRequestError };