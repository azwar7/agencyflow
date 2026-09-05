'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type LeadFinderJobStatus = 'STARTING' | 'RUNNING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface LeadFinderJob {
  id: string;
  workspaceId: string;
  query: string;
  location: string;
  status: LeadFinderJobStatus;
  leadsFound: number;
  leadIds: string[];
  error?: string;
  startedAt: string;
  updatedAt: string;
  lastLeadAt?: string;
}

interface LeadFinderContextType {
  activeJob: LeadFinderJob | null;
  isJobRunning: boolean;
  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean) => void;
  startJob: (query: string, location: string, webhookUrl?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  dismissJob: () => Promise<void>;
  openNewLeadModalWithQuery?: (query: string, location: string) => void;
}

const LeadFinderContext = createContext<LeadFinderContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'agencyflow_active_leadfinder_job';

export function LeadFinderProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<LeadFinderJob | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const prevLeadCountRef = useRef(activeJob?.leadsFound || 0);

  const isJobRunning = Boolean(
    activeJob && ['STARTING', 'RUNNING', 'PROCESSING'].includes(activeJob.status)
  );

  // Sync to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (activeJob) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activeJob));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [activeJob]);

  // Fetch active job from backend
  const pollActiveJob = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/integrations/n8n/jobs/active');
      if (!res.ok) return;

      const json = await res.json();
      if (json.success) {
        const job: LeadFinderJob | null = json.data?.job || null;
        if (job) {
          // If leads count increased, dispatch refresh event so leads list dynamically updates
          if (job.leadsFound > prevLeadCountRef.current) {
            prevLeadCountRef.current = job.leadsFound;
            window.dispatchEvent(new Event('agencyflow-refresh'));
          }

          // If job transitioned to completed
          if (job.status === 'COMPLETED' && activeJob?.status !== 'COMPLETED') {
            window.dispatchEvent(new Event('agencyflow-refresh'));
          }

          setActiveJob(job);
        } else if (activeJob && ['STARTING', 'RUNNING', 'PROCESSING'].includes(activeJob.status)) {
          // Backend has no record, but client had a running job -> check if timed out
          const elapsed = Date.now() - new Date(activeJob.startedAt).getTime();
          if (elapsed > 75000) {
            setActiveJob((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
            window.dispatchEvent(new Event('agencyflow-refresh'));
          }
        }
      }
    } catch (err) {
      console.warn('[LeadFinderContext] Poll error:', err);
    }
  }, [activeJob]);

  // Initial check on mount
  useEffect(() => {
    pollActiveJob();
  }, []);

  // Polling loop while job is active (every 2.5s)
  useEffect(() => {
    if (!isJobRunning) return;

    const interval = setInterval(pollActiveJob, 2500);
    return () => clearInterval(interval);
  }, [isJobRunning, pollActiveJob]);

  // Start Job handler
  const startJob = async (query: string, location: string, webhookUrl?: string) => {
    try {
      const res = await fetch('/api/v1/integrations/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location,
          webhookUrl: webhookUrl || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.error?.message || 'Failed to start AI Lead Finder workflow.';
        if (json.error?.activeJob) {
          setActiveJob(json.error.activeJob);
          setIsWidgetOpen(true);
        }
        return { success: false, error: errorMsg };
      }

      const job: LeadFinderJob = json.data?.job || {
        id: `job_${Date.now()}`,
        workspaceId: '',
        query,
        location,
        status: 'RUNNING',
        leadsFound: 0,
        leadIds: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      prevLeadCountRef.current = 0;
      setActiveJob(job);
      setIsWidgetOpen(true);

      return {
        success: true,
        message: json.message || 'AI Lead Finder started in the background.',
      };
    } catch (err: any) {
      console.error('[LeadFinderContext] startJob error:', err);
      return {
        success: false,
        error: err.message || 'Network error while triggering AI Lead Finder.',
      };
    }
  };

  // Dismiss Job handler
  const dismissJob = async () => {
    try {
      await fetch('/api/v1/integrations/n8n/jobs/active', { method: 'DELETE' });
    } catch {
      // ignore
    }
    setActiveJob(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <LeadFinderContext.Provider
      value={{
        activeJob,
        isJobRunning,
        isWidgetOpen,
        setIsWidgetOpen,
        startJob,
        dismissJob,
      }}
    >
      {children}
    </LeadFinderContext.Provider>
  );
}

export function useLeadFinder() {
  const context = useContext(LeadFinderContext);
  if (!context) {
    throw new Error('useLeadFinder must be used within a LeadFinderProvider');
  }
  return context;
}
