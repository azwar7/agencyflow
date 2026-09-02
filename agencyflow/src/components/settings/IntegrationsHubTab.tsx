'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Webhook,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Bot,
  Mail,
  Zap,
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  category: 'Communication' | 'Automation' | 'AI';
  description: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  details?: string;
  lastChecked: string;
}

interface IntegrationsHubTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function IntegrationsHubTab({ currentUserRole = 'MEMBER', showToast }: IntegrationsHubTabProps) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/integrations');
      const json = await res.json();
      if (json.success && json.data) {
        setIntegrations(json.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Error checking integrations', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchIntegrations();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Communication':
        return <Mail size={18} color="#38bdf8" />;
      case 'Automation':
        return <Zap size={18} color="#f59e0b" />;
      case 'AI':
        return <Bot size={18} color="#8b5cf6" />;
      default:
        return <Webhook size={18} color="#94a3b8" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'Connected & Verified',
        };
      case 'ERROR':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
          label: 'Connection Error',
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.1)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.2)',
          label: 'Not Configured',
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Integrations & Service Connectors
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Real-time infrastructure health: Verified connectivity statuses for mail transfer, n8n automations, and AI model APIs.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Verifying...' : 'Re-check Status'}
        </button>
      </div>

      {/* Integration Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ height: '140px', borderRadius: '12px' }} />
          ))
        ) : (
          integrations.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface-container)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {getCategoryIcon(item.category)}
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                          {item.name}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.category}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4, margin: '0 0 0.5rem 0' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span style={{ fontFamily: 'monospace', color: item.status === 'CONNECTED' ? '#10b981' : '#64748b' }}>
                    {item.details || '—'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
