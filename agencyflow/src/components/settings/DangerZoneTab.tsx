'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  Lock,
  Building2,
  ShieldAlert,
} from 'lucide-react';

interface DangerZoneTabProps {
  currentUserRole?: string;
  workspaceName?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function DangerZoneTab({ currentUserRole = 'MEMBER', workspaceName = '', showToast }: DangerZoneTabProps) {
  const isOwner = currentUserRole === 'OWNER';

  // Modal State
  const [modalAction, setModalAction] = useState<'PURGE_CRM_DATA' | 'DELETE_WORKSPACE' | null>(null);
  const [typedName, setTypedName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAction) return;

    if (typedName.trim() !== workspaceName.trim()) {
      showToast('Confirmation failed: typed workspace name does not match.', 'error');
      return;
    }

    if (!password) {
      showToast('Current password is required for security verification.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/v1/settings/danger-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalAction,
          confirmWorkspaceName: typedName.trim(),
          password,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        if (json.redirectUrl) {
          window.location.href = json.redirectUrl;
        } else {
          setModalAction(null);
          setTypedName('');
          setPassword('');
          window.dispatchEvent(new Event('agencyflow-refresh'));
        }
      } else {
        showToast(json.error?.message || 'Action failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOwner) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--surface-container)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <ShieldAlert size={36} color="#f87171" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Owner Permission Required
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px', margin: '0.5rem auto 0 auto' }}>
          Danger zone operations (data purging, workspace dissolution) can only be accessed by the primary Workspace Owner.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} color="#f87171" /> Danger Zone
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
          Destructive workspace operations. Actions taken here are irreversible and logged to the permanent audit trail.
        </p>
      </div>

      {/* 1. Purge CRM Records Card */}
      <div style={{ background: 'var(--surface-container)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Purge All CRM Data
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0', maxWidth: '520px' }}>
            Permanently deletes all leads, contacts, deals, tasks, activities, and AI analyses. Workspace identity, users, and settings will remain intact.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTypedName('');
            setPassword('');
            setModalAction('PURGE_CRM_DATA');
          }}
          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.55rem 1.15rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Purge CRM Records
        </button>
      </div>

      {/* 2. Delete Entire Workspace Card */}
      <div style={{ background: 'var(--surface-container)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171', margin: 0 }}>
            Permanently Delete Workspace
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0', maxWidth: '520px' }}>
            Dissolves the organization completely. Deletes all user accounts, sessions, settings, and database records. This action cannot be undone.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTypedName('');
            setPassword('');
            setModalAction('DELETE_WORKSPACE');
          }}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.55rem 1.15rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Delete Workspace
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DOUBLE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {modalAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface-container-high)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} color="#f87171" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {modalAction === 'PURGE_CRM_DATA' ? 'Confirm CRM Data Purge' : 'Confirm Workspace Deletion'}
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              This action is <strong style={{ color: '#f87171' }}>completely irreversible</strong>. To proceed, confirm the workspace name and authenticate with your current password:
            </p>

            <form onSubmit={handleExecuteAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Type <strong style={{ color: '#fff' }}>{workspaceName}</strong> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder={workspaceName}
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Your Current Password:
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalAction(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || typedName.trim() !== workspaceName.trim() || !password}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Executing...' : 'I understand, permanently delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
