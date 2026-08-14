'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id?: string;
  email: string;
  name: string;
  role?: string;
  agency?: string;
  workspaceId?: string;
  isFirstLogin?: boolean;
}

export interface WorkspaceChecklist {
  hasClient: boolean;
  hasDealOrLead: boolean;
  hasDeliverableOrProject: boolean;
  hasTask: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  workspaceId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLogin: boolean;
  isSampleData: boolean;
  checklist: WorkspaceChecklist;
  login: (credentials: { email: string; password?: string; name?: string; agency?: string }, redirectPath?: string) => Promise<boolean>;
  signup: (formData: { fullName: string; email: string; agencyName: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: (redirectPath?: string) => void;
  refreshAuth: () => Promise<void>;
  loadSampleData: () => Promise<boolean>;
  clearSampleData: () => Promise<boolean>;
  dismissOnboarding: () => void;
}

const defaultChecklist: WorkspaceChecklist = {
  hasClient: false,
  hasDealOrLead: false,
  hasDeliverableOrProject: false,
  hasTask: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  workspaceId: null,
  isAuthenticated: false,
  isLoading: true,
  isFirstLogin: false,
  isSampleData: false,
  checklist: defaultChecklist,
  login: async () => false,
  signup: async () => ({ success: false }),
  logout: () => {},
  refreshAuth: async () => {},
  loadSampleData: async () => false,
  clearSampleData: async () => false,
  dismissOnboarding: () => {},
});

export const SESSION_COOKIE_NAME = 'agencyflow_session';
export const AUTH_COOKIE_NAME = 'agencyflow_auth';
export const AUTH_USER_KEY = 'agencyflow_user';
export const ONBOARDING_DISMISSED_KEY = 'agencyflow_onboarding_dismissed';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [isSampleData, setIsSampleData] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<WorkspaceChecklist>(defaultChecklist);

  const checkAuthStatus = async () => {
    if (typeof window === 'undefined') return;

    // Synchronously populate from localStorage on first client mount tick
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.workspaceId) {
          setUser(u);
          setWorkspaceId(u.workspaceId);
          setIsAuthenticated(true);
        }
      }
    } catch {}

    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('agencyflow_session');
      if (token) headers['x-session-token'] = token;
      if (workspaceId || user?.workspaceId) {
        headers['x-workspace-id'] = workspaceId || user?.workspaceId || '';
      }

      const res = await fetch('/api/v1/auth/me', {
        credentials: 'include',
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const u = json.data.user;
          const ws = json.data.workspace;
          setUser(u);
          setWorkspaceId(u.workspaceId);
          setIsAuthenticated(true);
          setIsSampleData(Boolean(ws.isSampleData));
          if (ws.checklist) setChecklist(ws.checklist);

          const dismissed = localStorage.getItem(`${ONBOARDING_DISMISSED_KEY}_${u.workspaceId}`);
          if (u.isFirstLogin && !dismissed) {
            setIsFirstLogin(true);
          } else {
            setIsFirstLogin(false);
          }
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
          return;
        }
      }

      // If server rejected with 401 and there's no stored session token, reset unauthenticated state
      if (res.status === 401 && !token) {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem('agencyflow_session');
        setUser(null);
        setWorkspaceId(null);
        setIsAuthenticated(false);
        setIsSampleData(false);
        setIsFirstLogin(false);
        setChecklist(defaultChecklist);
      }
    } catch (err) {
      console.warn('[AuthContext] Session validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    const handleAuthEvent = () => checkAuthStatus();
    window.addEventListener('storage', handleAuthEvent);
    window.addEventListener('agencyflow-auth-change', handleAuthEvent);
    window.addEventListener('agencyflow-refresh', handleAuthEvent);

    return () => {
      window.removeEventListener('storage', handleAuthEvent);
      window.removeEventListener('agencyflow-auth-change', handleAuthEvent);
      window.removeEventListener('agencyflow-refresh', handleAuthEvent);
    };
  }, []);

  const login = async (
    credentials: { email: string; password?: string; name?: string; agency?: string },
    redirectPath: string = '/dashboard'
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password || 'password123',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Invalid login');
      }

      const token = json.data?.token;
      const userData = json.data?.user;

      if (token && typeof window !== 'undefined') {
        document.cookie = `${SESSION_COOKIE_NAME}=${token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('agencyflow_session', token);
      }

      setUser(userData);
      setWorkspaceId(userData.workspaceId);
      setIsAuthenticated(true);
      setIsLoading(false);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      window.dispatchEvent(new Event('agencyflow-auth-change'));
      router.push(redirectPath);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (formData: {
    fullName: string;
    email: string;
    agencyName: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to create workspace.' };
      }

      const token = json.data?.token;
      const userData = json.data?.user;

      if (token && typeof window !== 'undefined') {
        document.cookie = `${SESSION_COOKIE_NAME}=${token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=604800; SameSite=Lax`;
        localStorage.setItem('agencyflow_session', token);
      }

      setUser(userData);
      setWorkspaceId(userData.workspaceId);
      setIsAuthenticated(true);
      setIsFirstLogin(true);
      setIsLoading(false);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      window.dispatchEvent(new Event('agencyflow-auth-change'));
      router.push('/dashboard');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (redirectPath: string = '/') => {
    console.log('[AuthContext] Logging out user and clearing all session data...');
    try {
      // 1. Client-side storage purge
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem('agencyflow_session');
        sessionStorage.clear();
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `agencyflow_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }

      // 2. Synchronous state reset
      setUser(null);
      setWorkspaceId(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setIsSampleData(false);
      setIsFirstLogin(false);
      setChecklist(defaultChecklist);

      // 3. Server-side session cookie invalidation
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
      }).catch((e) => console.warn('Server logout failed:', e));

      // 4. Notify listeners and multi-tab windows
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('agencyflow-auth-change'));
        window.dispatchEvent(new Event('storage'));
      }

      // 5. Redirect cleanly to landing page
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      console.error('[AuthContext] Error during logout:', err);
      router.push(redirectPath);
    }
  };

  const loadSampleData = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/workspace/sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        setIsSampleData(true);
        window.dispatchEvent(new Event('agencyflow-refresh'));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const clearSampleData = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/workspace/sample-data', {
        method: 'DELETE',
        headers: {
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        setIsSampleData(false);
        window.dispatchEvent(new Event('agencyflow-refresh'));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const dismissOnboarding = () => {
    setIsFirstLogin(false);
    if (workspaceId) {
      localStorage.setItem(`${ONBOARDING_DISMISSED_KEY}_${workspaceId}`, 'true');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaceId,
        isAuthenticated,
        isLoading,
        isFirstLogin,
        isSampleData,
        checklist,
        login,
        signup,
        logout,
        refreshAuth: checkAuthStatus,
        loadSampleData,
        clearSampleData,
        dismissOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
