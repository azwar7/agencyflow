'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  Shield,
  Clock,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ApiWebhooksTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ApiWebhooksTab({ currentUserRole = 'MEMBER', showToast }: ApiWebhooksTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // State: API Keys
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState('ADMIN');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // State: Webhooks
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'lead.created',
    'deal.created',
    'deal.stage_changed',
  ]);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/api-keys');
      const json = await res.json();
      if (json.success) setApiKeys(json.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/webhooks');
      const json = await res.json();
      if (json.success) setWebhooks(json.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
  }, [fetchKeys, fetchWebhooks]);

  // Handle Create API Key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/v1/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), role: newKeyRole }),
      });
      const json = await res.json();
      if (json.success && json.data?.rawKey) {
        setGeneratedKey(json.data.rawKey);
        setNewKeyName('');
        fetchKeys();
      } else {
        showToast(json.error?.message || 'Failed to create key', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Revoke API key "${name}"? Any applications using it will immediately be denied access.`)) return;

    try {
      const res = await fetch(`/api/v1/settings/api-keys/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchKeys();
      } else {
        showToast(json.error?.message || 'Failed to revoke key', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Create Webhook
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookName.trim() || !webhookUrl.trim() || selectedEvents.length === 0) return;

    try {
      const res = await fetch('/api/v1/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: webhookName.trim(),
          targetUrl: webhookUrl.trim(),
          events: selectedEvents,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Webhook registered successfully.');
        setIsWebhookModalOpen(false);
        setWebhookName('');
        setWebhookUrl('');
        fetchWebhooks();
      } else {
        showToast(json.error?.message || 'Failed to register webhook', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteWebhook = async (id: string, name: string) => {
    if (!confirm(`Delete webhook subscription "${name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/settings/webhooks/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchWebhooks();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      setTestingId(id);
      const res = await fetch(`/api/v1/settings/webhooks/${id}/test`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchWebhooks();
      } else {
        showToast(json.error?.message || 'Test failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTestingId(null);
    }
  };

  const AVAILABLE_EVENTS = [
    { id: 'lead.created', label: 'Lead Created' },
    { id: 'lead.updated', label: 'Lead Updated' },
    { id: 'deal.created', label: 'Deal Created' },
    { id: 'deal.stage_changed', label: 'Deal Stage Changed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* 1. REST API KEYS SECTION */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} color="#8b5cf6" /> REST API Keys
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              Authenticate external scripts and integrations. Keys are stored as irreversible SHA-256 hashes.
            </p>
          </div>

          <button
            type="button"
            disabled={!isOwnerOrAdmin}
            onClick={() => {
              setGeneratedKey(null);
              setIsKeyModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <Plus size={14} /> Generate API Key
          </button>
        </div>

        {/* API Keys Table */}
        <div style={{ background: 'var(--surface-container)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container-lowest)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Key Prefix</th>
                <th style={{ padding: '0.75rem 1rem' }}>Scope Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No API keys generated yet. Click "Generate API Key" to create your first integration secret.
                  </td>
                </tr>
              ) : (
                apiKeys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#fff' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{k.name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#c4b5fd' }}>{k.keyPrefix}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {k.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {k.revokedAt ? (
                        <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.75rem' }}>Revoked</span>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.75rem' }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {!k.revokedAt && isOwnerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. OUTBOUND WEBHOOKS SECTION */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Webhook size={18} color="#38bdf8" /> Outbound Webhooks
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
              Dispatches HMAC-SHA256 signed POST events to your endpoints when CRM entities are created or stages change.
            </p>
          </div>

          <button
            type="button"
            disabled={!isOwnerOrAdmin}
            onClick={() => setIsWebhookModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <Plus size={14} /> Add Webhook
          </button>
        </div>

        {/* Webhooks Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {webhooks.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#64748b', background: 'var(--surface-container)', borderRadius: '10px' }}>
              No webhooks configured. Add an endpoint to receive live CRM events.
            </div>
          ) : (
            webhooks.map((sub) => {
              const events = Array.isArray(sub.events) ? sub.events : [];
              const lastDelivery = sub.deliveries?.[0];
              return (
                <div
                  key={sub.id}
                  style={{
                    background: 'var(--surface-container)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {sub.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: sub.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                          color: sub.isActive ? '#10b981' : '#94a3b8',
                        }}
                      >
                        {sub.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#38bdf8', marginTop: '0.35rem', wordBreak: 'break-all' }}>
                      {sub.targetUrl}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.65rem' }}>
                      {events.map((ev: string) => (
                        <span key={ev} style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', padding: '1px 6px', borderRadius: '4px' }}>
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {lastDelivery ? (
                        lastDelivery.status === 'SUCCESS' ? (
                          <span style={{ color: '#10b981' }}>✓ HTTP {lastDelivery.statusCode}</span>
                        ) : (
                          <span style={{ color: '#f87171' }}>✗ Failed</span>
                        )
                      ) : (
                        <span>No deliveries yet</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        disabled={testingId === sub.id}
                        onClick={() => handleTestWebhook(sub.id)}
                        style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        {testingId === sub.id ? 'Pinging...' : 'Test Ping'}
                      </button>
                      {isOwnerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWebhook(sub.id, sub.name)}
                          style={{ background: 'none', border: 'none', color: '#f87171', padding: '3px 6px', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: GENERATE API KEY */}
      {/* ------------------------------------------------------------- */}
      {isKeyModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface-container-high)', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 1rem 0' }}>
              Generate API Key
            </h3>

            {generatedKey ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#fca5a5' }}>
                  <strong>Important:</strong> Copy this secret key now. It will never be displayed again.
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                    Your Secret Key:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={generatedKey}
                      style={{ flex: 1, padding: '0.5rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.8rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="btn btn-secondary"
                    >
                      {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  I have copied my key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                    Key Name (Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Enrichment Bot"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                    Permission Scope
                  </label>
                  <select
                    value={newKeyRole}
                    onChange={(e) => setNewKeyRole(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="ADMIN">Administrator (Full Access)</option>
                    <option value="MANAGER">Manager (Read / Write)</option>
                    <option value="SALES_REP">Sales Rep (Assigned Only)</option>
                    <option value="VIEWER">Viewer (Read Only)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsKeyModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD WEBHOOK */}
      {/* ------------------------------------------------------------- */}
      {isWebhookModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface-container-high)', borderRadius: '12px', width: '100%', maxWidth: '460px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 1rem 0' }}>
              Add Outbound Webhook
            </h3>

            <form onSubmit={handleCreateWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Subscription Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zapier Ingestion Sync"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Target HTTPS Endpoint URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Subscribed Events
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, ev.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter((x) => x !== ev.id));
                          }
                        }}
                        style={{ accentColor: '#8b5cf6' }}
                      />
                      {ev.label} ({ev.id})
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsWebhookModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
