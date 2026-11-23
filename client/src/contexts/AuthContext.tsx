import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    phone?: string;
    country?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Never authorize from cached localStorage. The server-issued token and
  // /auth/me response are the only source of the current role.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        localStorage.removeItem('nile_user');
        setLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        if (!userData) throw new Error('No authenticated user returned');
        setUser(userData);
        localStorage.setItem('nile_user', JSON.stringify(userData));
      } catch (error) {
        console.warn('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('nile_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({
      email: email.trim().toLowerCase(),
      password,
    });
    const loggedUser: User = {
      _id: response._id,
      name: response.name,
      email: response.email,
      role: response.role as 'customer' | 'provider' | 'admin',
      slug: response.slug,
      businessName: response.businessName,
    };
    setUser(loggedUser);
    localStorage.setItem('nile_user', JSON.stringify(loggedUser));
    setLoading(false);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    phone?: string;
    country?: string;
  }) => {
    await authApi.register({
      ...data,
      email: data.email.trim().toLowerCase(),
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nile_user');
    localStorage.removeItem('nile_admin_auth');
    localStorage.removeItem('nile_dashboard_bookings');
    localStorage.removeItem('nile_crm_cache');
    queryClient.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
