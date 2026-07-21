import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';
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
  // Synchronous hydration from localStorage for 0ms initial load
  const [user, setUser] = useState<User | null>(() => {
    const cachedUser = localStorage.getItem('nile_user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {}
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('nile_user');
    // If token and cached user exist, render immediately without spinner!
    return !!token && !cachedUser;
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          if (userData) {
            setUser(userData);
            localStorage.setItem('nile_user', JSON.stringify(userData));
          }
        } catch (error) {
          console.warn('Auth check fallback:', error);
          if (!localStorage.getItem('nile_user')) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('nile_user');
      }
      setLoading(false);
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
    localStorage.removeItem('nile_dashboard_bookings');
    localStorage.removeItem('nile_crm_cache');
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
