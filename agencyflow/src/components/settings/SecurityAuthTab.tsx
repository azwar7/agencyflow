'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Key,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Save,
  Lock,
} from 'lucide-react';

interface ActiveSessionItem {
  id: string;
  browser: string;
  os: string;
  device: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface SecurityPolicies {
  minPasswordLength: number;
  requirePasswordNumbers: boolean;
  requirePasswordSymbols: boolean;
  sessionDurationMinutes: number;
  maxConcurrentSessions: number;
  require2FAForAll: boolean;
  leadVisibility: 'ALL' | 'ASSIGNED_ONLY' | 'TEAM';
  contactVisibility: 'ALL' | 'ASSIGNED_ONLY' | 'TEAM';
  dealVisibility: 'ALL' | 'ASSIGNED_ONLY' | 'TEAM';
  taskVisibility: 'ALL' | 'ASSIGNED_ONLY' | 'TEAM';
}

interface SecurityAuthTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SecurityAuthTab({ currentUserRole = 'MEMBER', showToast }: SecurityAuthTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // 1. Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // 2. Active Sessions State
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // 3. Security Policies State
  const [policies, setPolicies] = useState<SecurityPolicies>({
    minPasswordLength: 8,
    requirePasswordNumbers: true,
    requirePasswordSymbols: false,
    sessionDurationMinutes: 10080,
    maxConcurrentSessions: 5,
    require2FAForAll: false,
    leadVisibility: 'ALL',
    contactVisibility: 'ALL',
    dealVisibility: 'ALL',
    taskVisibility: 'ALL',
  });
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [policiesDirty, setPoliciesDirty] = useState(false);

  // Fetch Sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch('/api/v1/settings/security/sessions');
      const json = await res.json();
      if (json.success) {
        setSessions(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Fetch Policies
  const fetchPolicies = useCallback(async () => {
    try {
      setLoadingPolicies(true);
      const res = await fetch('/api/v1/settings/security/policies');
      const json = await res.json();
      if (json.success && json.data) {
        setPolicies(json.data);
        setPoliciesDirty(false);
      }
    } catch (err) {
      console.error('Failed to load policies', err);
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchPolicies();
  }, [fetchSessions, fetchPolicies]);

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch('/api/v1/settings/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Password successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(json.error?.message || 'Failed to update password', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Revoke Specific Session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingId(sessionId);
      const res = await fetch(`/api/v1/settings/security/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Session revoked.');
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        showToast(json.error?.message || 'Failed to revoke session', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke All Other Sessions
  const handleRevokeOthers = async () => {
    if (!confirm('Sign out of all other devices and browser sessions?')) return;
    try {
      setRevokingOthers(true);
      const res = await fetch('/api/v1/settings/security/sessions/revoke-others', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchSessions();
      } else {
        showToast(json.error?.message || 'Failed to revoke other sessions', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setRevokingOthers(false);
    }
  };

  // Save Security Policies
  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;
    try {
      setSavingPolicies(true);
      const res = await fetch('/api/v1/settings/security/policies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policies),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Workspace security policies and visibility rules updated.');
        setPoliciesDirty(false);
      } else {
        showToast(json.error?.message || 'Failed to update security policies', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingPolicies(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          Security, Authentication & Data Visibility
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
          Update login credentials, terminate active sessions, and configure workspace data access policies.
        </p>
      </div>

      {/* 1. Password Update Form */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Key size={18} color="#a78bfa" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            Change Password
          </h3>
        </div>

        <form
          onSubmit={handleChangePassword}
          style={{
            background: 'var(--surface-container)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '560px',
          }}
        >
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Current Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 2.5rem 0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                New Password *
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Confirm New Password *
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Policy indicator checks */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.7rem', color: '#94a3b8' }}>
            <span style={{ color: newPassword.length >= policies.minPasswordLength ? '#4edea3' : '#94a3b8' }}>
              ✓ At least {policies.minPasswordLength} characters
            </span>
            {policies.requirePasswordNumbers && (
              <span style={{ color: /\d/.test(newPassword) ? '#4edea3' : '#94a3b8' }}>
                ✓ Contains a number
              </span>
            )}
            {policies.requirePasswordSymbols && (
              <span style={{ color: /[!@#$%^&*]/.test(newPassword) ? '#4edea3' : '#94a3b8' }}>
                ✓ Contains a symbol
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword}
              className="btn btn-primary"
              style={{ background: '#8b5cf6', border: 'none', padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              {changingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Active Sessions Management */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Laptop size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              Active Sessions ({sessions.length})
            </h3>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOthers}
              disabled={revokingOthers}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <LogOut size={12} />
              {revokingOthers ? 'Revoking...' : 'Sign Out All Other Sessions'}
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto', background: 'var(--surface-container)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: 'var(--outline)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>DEVICE & BROWSER</th>
                <th style={{ padding: '0.75rem 1rem' }}>OPERATING SYSTEM</th>
                <th style={{ padding: '0.75rem 1rem' }}>IP ADDRESS</th>
                <th style={{ padding: '0.75rem 1rem' }}>LAST ACTIVE</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loadingSessions ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading active sessions...
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>{s.browser}</span>
                        {s.isCurrent && (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Current Session
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                      {s.os} ({s.device})
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {s.ipAddress}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                      {new Date(s.lastActiveAt).toLocaleString()}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {!s.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          disabled={revokingId === s.id}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            color: '#f87171',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          {revokingId === s.id ? 'Revoking...' : 'Terminate'}
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

      {/* 3. Workspace Security Policies & Data Visibility Rules */}
      {isOwnerOrAdmin && (
        <form onSubmit={handleSavePolicies} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="#c0c1ff" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                  Workspace Security Policies & Access Controls
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
                Enforced server-side for all members of this workspace.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingPolicies}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: 'none',
                padding: '0.55rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Save size={14} />
              {savingPolicies ? 'Saving...' : policiesDirty ? 'Save Security Policies *' : 'Save Policies'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Minimum Password Length
              </label>
              <input
                type="number"
                min={6}
                max={32}
                value={policies.minPasswordLength}
                onChange={(e) => {
                  setPolicies({ ...policies, minPasswordLength: Number(e.target.value) });
                  setPoliciesDirty(true);
                }}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Max Concurrent Sessions per User
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={policies.maxConcurrentSessions}
                onChange={(e) => {
                  setPolicies({ ...policies, maxConcurrentSessions: Number(e.target.value) });
                  setPoliciesDirty(true);
                }}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Session Idle Expiration Duration
              </label>
              <select
                value={policies.sessionDurationMinutes}
                onChange={(e) => {
                  setPolicies({ ...policies, sessionDurationMinutes: Number(e.target.value) });
                  setPoliciesDirty(true);
                }}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value={1440}>1 Day (24 Hours)</option>
                <option value={4320}>3 Days (72 Hours)</option>
                <option value={10080}>7 Days (Standard)</option>
                <option value={20160}>14 Days</option>
                <option value={43200}>30 Days</option>
              </select>
            </div>
          </div>

          {/* Policy Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--surface-container)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={policies.requirePasswordNumbers}
                onChange={(e) => {
                  setPolicies({ ...policies, requirePasswordNumbers: e.target.checked });
                  setPoliciesDirty(true);
                }}
                style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
              />
              Require numeric digits (0-9) in passwords
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={policies.requirePasswordSymbols}
                onChange={(e) => {
                  setPolicies({ ...policies, requirePasswordSymbols: e.target.checked });
                  setPoliciesDirty(true);
                }}
                style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
              />
              Require special symbols (!@#$%) in passwords
            </label>
          </div>

          {/* Data Visibility Rules */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
              Query-Layer Data Visibility Rules
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Controls which records non-admin team members can query from the database. Enforced in the SQL/Prisma query layer.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                  Leads Visibility
                </label>
                <select
                  value={policies.leadVisibility}
                  onChange={(e) => {
                    setPolicies({ ...policies, leadVisibility: e.target.value as any });
                    setPoliciesDirty(true);
                  }}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="ALL">Everyone in Workspace</option>
                  <option value="ASSIGNED_ONLY">Assigned User Only</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                  Deals Visibility
                </label>
                <select
                  value={policies.dealVisibility}
                  onChange={(e) => {
                    setPolicies({ ...policies, dealVisibility: e.target.value as any });
                    setPoliciesDirty(true);
                  }}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="ALL">Everyone in Workspace</option>
                  <option value="ASSIGNED_ONLY">Assigned User Only</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                  Tasks Visibility
                </label>
                <select
                  value={policies.taskVisibility}
                  onChange={(e) => {
                    setPolicies({ ...policies, taskVisibility: e.target.value as any });
                    setPoliciesDirty(true);
                  }}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="ALL">Everyone in Workspace</option>
                  <option value="ASSIGNED_ONLY">Assigned User Only</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
