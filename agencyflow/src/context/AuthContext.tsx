'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  email: string;
  name: string;
  role?: string;
  agency?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserProfile, redirectPath?: string) => void;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshAuth: () => {},
});

export const AUTH_COOKIE_NAME = 'agencyflow_auth';
export const AUTH_USER_KEY = 'agencyflow_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuthStatus = () => {
    if (typeof window === 'undefined') return;

    try {
      const cookieAuth = document.cookie.includes(`${AUTH_COOKIE_NAME}=true`);
      const storedUserRaw = localStorage.getItem(AUTH_USER_KEY);

      if (cookieAuth && storedUserRaw) {
        const parsedUser = JSON.parse(storedUserRaw) as UserProfile;
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    const handleAuthEvent = () => checkAuthStatus();
    window.addEventListener('storage', handleAuthEvent);
    window.addEventListener('agencyflow-auth-change', handleAuthEvent);

    return () => {
      window.removeEventListener('storage', handleAuthEvent);
      window.removeEventListener('agencyflow-auth-change', handleAuthEvent);
    };
  }, []);

  const login = (userData: UserProfile, redirectPath: string = '/dashboard') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=86400; SameSite=Lax`;
      window.dispatchEvent(new Event('agencyflow-auth-change'));
    }
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
    router.push(redirectPath);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_USER_KEY);
      document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      window.dispatchEvent(new Event('agencyflow-auth-change'));
    }
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    router.push('/');
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth: checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
