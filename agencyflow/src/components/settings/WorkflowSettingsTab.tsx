'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';

interface WorkflowSettingsTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function WorkflowSettingsTab({ currentUserRole = 'MEMBER', showToast }: WorkflowSettingsTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/settings/workflows');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading workflow settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyEndpoint = () => {
    if (data?.inboundWebhookEndpoint) {
      navigator.clipboard.writeText(data.inboundWebhookEndpoint);
      setCopied(true);
      showToast('Inbound webhook URL copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          Workflow & Automation Endpoints
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
          Configured n8n webhook pipelines: Inbound lead ingestion, deduplication rules, and outbound dispatch.
        </p>
      </div>

      {loading ? (
        <div className="skeleton-pulse" style={{ height: '220px', borderRadius: '12px' }} />
      ) : (
        <>
          {/* Active Ingestion Pipeline */}
          <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Inbound Lead Ingestion Pipeline
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {data.engine}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              External n8n workflows POST scraped or prospective leads directly to this secured CRM endpoint.
            </p>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Inbound Webhook Endpoint
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={data.inboundWebhookEndpoint || ''}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  onClick={handleCopyEndpoint}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Required Header</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                  {data.authHeaderRequired}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Secret Authentication</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: data.isSecretConfigured ? '#10b981' : '#f87171' }}>
                  {data.isSecretConfigured ? '✓ Configured (.env)' : '✗ Missing Secret'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Leads Ingested</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {data.n8nLeadsCount} records
                </span>
              </div>
            </div>
          </div>

          {/* Recent Inbound Activity */}
          {data.recentActivity && data.recentActivity.length > 0 && (
            <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={18} color="#10b981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Recent Ingestion Events
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.recentActivity.map((act: any) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'var(--surface-container-lowest)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: '#fff' }}>{act.content}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
