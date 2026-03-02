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
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      setUser({
        _id: response._id,
        name: response.name,
        email: response.email,
        role: response.role as 'customer' | 'provider' | 'admin',
        slug: response.slug,
        businessName: response.businessName,
      });
    } catch (error) {
      // Re-throw to allow Login component to handle it
      throw error;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
    phone?: string;
  }) => {
    const response = await authApi.register({
      ...data,
      email: data.email.trim().toLowerCase(),
    });
    setUser({
      _id: response._id,
      name: response.name,
      email: response.email,
      role: response.role as 'customer' | 'provider' | 'admin',
      slug: response.slug,
      businessName: response.businessName,
    });
  };

  const logout = () => {
    authApi.logout();
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
