'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isIndependent: boolean;
  networkId: string | null;
  inviteCode: string;
  preferredCurrency: string;
  trialEndsAt: string;
  subscription: { startDate: string; endDate: string } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  inviteCode?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      Cookies.remove('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    Cookies.set('token', data.token, { expires: 30 });
    setUser(data.user);
    router.push('/dashboard');
  };

  const register = async (registerData: RegisterData) => {
    const { data } = await api.post('/auth/register', registerData);
    Cookies.set('token', data.token, { expires: 30 });
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) setUser({ ...user, ...data });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
