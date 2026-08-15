'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  X,
  Building2,
  Filter,
  FileCheck,
  CheckSquare,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function GettingStartedWidget() {
  const { checklist: authChecklist, workspaceId, refreshAuth, dismissOnboarding } = useAuth();

  const [localChecklist, setLocalChecklist] = useState(authChecklist);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Synchronize local checklist with context updates
  useEffect(() => {
    setLocalChecklist(authChecklist);
  }, [authChecklist]);

  // Fetch real-time checklist status from server
  const fetchLatestStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/v1/auth/me', {
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.workspace?.checklist) {
          setLocalChecklist(json.data.workspace.checklist);
        }
      }
    } catch (err) {
      console.warn('[GettingStartedWidget] Failed to poll status:', err);
    }
  }, [workspaceId]);

  // Initial mount: load persistence & trigger live count query
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && workspaceId) {
      const dismissed =
        localStorage.getItem(`agencyflow_checklist_dismissed_${workspaceId}`) === 'true' ||
        localStorage.getItem(`agencyflow_onboarding_dismissed_${workspaceId}`) === 'true';
      setIsDismissed(dismissed);

      const collapsed = localStorage.getItem(`agencyflow_checklist_collapsed_${workspaceId}`) === 'true';
      setIsCollapsed(collapsed);
    }

    fetchLatestStatus();

    // Listen to global agencyflow mutation events
    const handleRefresh = () => {
      fetchLatestStatus();
      refreshAuth();
    };

    window.addEventListener('agencyflow-refresh', handleRefresh);
    window.addEventListener('agencyflow-auth-change', handleRefresh);
    window.addEventListener('visibilitychange', handleRefresh);

    return () => {
      window.removeEventListener('agencyflow-refresh', handleRefresh);
      window.removeEventListener('agencyflow-auth-change', handleRefresh);
      window.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [workspaceId, fetchLatestStatus, refreshAuth]);

  if (!mounted || isDismissed) return null;

  const items = [
    {
      id: 'client',
      label: 'Add your first client',
      href: '/clients',
      completed: Boolean(localChecklist.hasClient),
      icon: Building2,
    },
    {
      id: 'deal',
      label: 'Create a pipeline deal or lead',
      href: '/pipeline',
      completed: Boolean(localChecklist.hasDealOrLead),
      icon: Filter,
    },
    {
      id: 'deliverable',
      label: 'Upload a deliverable or project',
      href: '/deliverables',
      completed: Boolean(localChecklist.hasDeliverableOrProject),
      icon: FileCheck,
    },
    {
      id: 'task',
      label: 'Create an urgent task or action',
      href: '/tasks',
      completed: Boolean(localChecklist.hasTask),
      icon: CheckSquare,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== 'undefined' && workspaceId) {
      localStorage.setItem(`agencyflow_checklist_collapsed_${workspaceId}`, String(next));
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    dismissOnboarding();
    if (typeof window !== 'undefined' && workspaceId) {
      localStorage.setItem(`agencyflow_checklist_dismissed_${workspaceId}`, 'true');
    }
  };

  return (
    <aside
      aria-label="Getting Started Onboarding Checklist"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 90,
        width: isCollapsed ? 'auto' : '330px',
        backgroundColor: '#161922',
        borderRadius: '0.85rem',
        border: progressPercent === 100 ? '1px solid rgba(78, 222, 163, 0.4)' : '1px solid rgba(192, 193, 255, 0.25)',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(192, 193, 255, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '0.75rem 1rem',
          background: progressPercent === 100 ? 'rgba(78, 222, 163, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={toggleCollapse}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: progressPercent === 100 ? 'var(--secondary)' : 'var(--primary)',
            }}
          />
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
            {isCollapsed ? `Workspace Setup (${completedCount}/${items.length})` : 'Getting Started Guide'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
            title={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={handleDismiss}
            style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
            title="Dismiss widget"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {!isCollapsed && (
        <div style={{ padding: '0.85rem 1rem' }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '0.35rem' }}>
              <span>Setup Milestones</span>
              <span style={{ fontWeight: 700, color: progressPercent === 100 ? 'var(--secondary)' : 'var(--primary)' }}>
                {progressPercent}% ({completedCount}/{items.length})
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: progressPercent === 100 ? 'var(--secondary)' : 'linear-gradient(90deg, var(--primary), #818cf8)',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map((item) => {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: item.completed ? 'rgba(78, 222, 163, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: item.completed ? '1px solid rgba(78, 222, 163, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {item.completed ? (
                      <CheckCircle2 size={16} color="var(--secondary)" />
                    ) : (
                      <Circle size={16} color="var(--outline)" />
                    )}
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: item.completed ? 500 : 600,
                        color: item.completed ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.completed ? (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Check size={11} /> Done
                    </span>
                  ) : (
                    <ArrowRight size={13} color="var(--on-surface-variant)" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 100% Completed Celebration Banner */}
          {progressPercent === 100 && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(78, 222, 163, 0.12)',
                border: '1px solid rgba(78, 222, 163, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#4edea3',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <span>🎉 You're all set! Workspace setup complete.</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
