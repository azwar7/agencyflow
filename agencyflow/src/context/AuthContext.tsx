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
  logout: (redirectPath?: string) => Promise<void>;
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
  logout: async () => {},
  refreshAuth: async () => {},
  loadSampleData: async () => false,
  clearSampleData: async () => false,
  dismissOnboarding: () => {},
});

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

    try {
      // Authenticate strictly via server-controlled httpOnly cookie
      const res = await fetch('/api/v1/auth/me', {
        credentials: 'include',
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
          return;
        }
      }

      // Server rejected with 401 or invalid session -> reset unauthenticated state
      setUser(null);
      setWorkspaceId(null);
      setIsAuthenticated(false);
      setIsSampleData(false);
      setIsFirstLogin(false);
      setChecklist(defaultChecklist);
    } catch (err) {
      console.warn('[AuthContext] Session verification error:', err);
      setUser(null);
      setWorkspaceId(null);
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
    window.addEventListener('agencyflow-refresh', handleAuthEvent);

    return () => {
      window.removeEventListener('storage', handleAuthEvent);
      window.removeEventListener('agencyflow-auth-change', handleAuthEvent);
      window.removeEventListener('agencyflow-refresh', handleAuthEvent);
    };
  }, []);

  const login = async (
    credentials: { email: string; password?: string },
    redirectPath: string = '/dashboard'
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password || '',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Invalid email or password.');
      }

      const userData = json.data?.user;

      setUser(userData);
      setWorkspaceId(userData.workspaceId);
      setIsAuthenticated(true);
      setIsLoading(false);

      window.dispatchEvent(new Event('agencyflow-auth-change'));
      router.push(redirectPath);
      return true;
    } catch (err: any) {
      console.error('[AuthContext] Login error:', err);
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
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to create workspace.' };
      }

      const userData = json.data?.user;

      setUser(userData);
      setWorkspaceId(userData.workspaceId);
      setIsAuthenticated(true);
      setIsFirstLogin(true);
      setIsLoading(false);

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
    try {
      // 1. Invalidate server session and clear httpOnly cookie
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch((e) => console.warn('[AuthContext] Server logout request error:', e));

      // 2. Synchronous local state reset
      setUser(null);
      setWorkspaceId(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setIsSampleData(false);
      setIsFirstLogin(false);
      setChecklist(defaultChecklist);

      // 3. Notify all open tabs & listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('agencyflow-auth-change'));
      }

      // 4. Redirect cleanly
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        credentials: 'include',
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
