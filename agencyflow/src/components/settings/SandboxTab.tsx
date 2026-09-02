'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Trash2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';

interface SandboxTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SandboxTab({ currentUserRole = 'MEMBER', showToast }: SandboxTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [sandboxMode, setSandboxMode] = useState(false);
  const [demoCounts, setDemoCounts] = useState<any>({ leads: 0, deals: 0, contacts: 0, tasks: 0, total: 0 });
  const [realCounts, setRealCounts] = useState<any>({ leads: 0, deals: 0, contacts: 0, tasks: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fetchSandboxData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/settings/sandbox');
      const json = await res.json();
      if (json.success && json.data) {
        setSandboxMode(json.data.sandboxMode);
        setDemoCounts(json.data.demoCounts);
        setRealCounts(json.data.realCounts);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSandboxData();
  }, [fetchSandboxData]);

  const handleToggleSandbox = async (enabled: boolean) => {
    if (!isOwnerOrAdmin) return;
    try {
      setActing(true);
      const res = await fetch('/api/v1/settings/sandbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxMode: enabled }),
      });
      const json = await res.json();
      if (json.success) {
        setSandboxMode(enabled);
        showToast(`Sandbox mode ${enabled ? 'enabled' : 'disabled'}.`);
      } else {
        showToast(json.error?.message || 'Failed to update sandbox mode', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActing(false);
    }
  };

  const handleLoadSampleData = async () => {
    if (!confirm('Load realistic sample agency leads, deals, deliverables, and invoices into this workspace?')) return;
    try {
      setActing(true);
      const res = await fetch('/api/v1/workspace/sample-data', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('Sample demo data successfully loaded!');
        fetchSandboxData();
      } else {
        showToast(json.error?.message || 'Failed to load sample data', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActing(false);
    }
  };

  const handleExecutePurgeDemo = async () => {
    try {
      setActing(true);
      const res = await fetch('/api/v1/workspace/sample-data', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Demo data removed. Real customer records preserved.');
        setIsConfirmModalOpen(false);
        fetchSandboxData();
      } else {
        showToast(json.error?.message || 'Failed to remove demo data', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FlaskConical size={18} color="#f59e0b" /> Developer & Sandbox Controls
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
          Testing environment mode, sample dataset seeding, and guaranteed safe demo record cleanup.
        </p>
      </div>

      {/* 1. Sandbox Testing Mode Card */}
      <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Sandbox Isolation Mode
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: sandboxMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                color: sandboxMode ? '#f59e0b' : '#94a3b8',
              }}
            >
              {sandboxMode ? 'SANDBOX ACTIVE' : 'LIVE PRODUCTION'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            When enabled, live outreach emails are simulated and webhook tests are explicitly marked with sandbox headers.
          </p>
        </div>

        <button
          type="button"
          disabled={acting || !isOwnerOrAdmin}
          onClick={() => handleToggleSandbox(!sandboxMode)}
          className={sandboxMode ? 'btn btn-secondary' : 'btn btn-primary'}
          style={{ fontSize: '0.8rem' }}
        >
          {sandboxMode ? 'Disable Sandbox Mode' : 'Enable Sandbox Mode'}
        </button>
      </div>

      {/* 2. Sample Agency Data Management */}
      <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={16} color="#38bdf8" /> Sample Dataset Management
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Demo records are explicitly tagged with <code style={{ color: '#38bdf8' }}>isSample: true</code> in the database, allowing them to be loaded or safely purged without risking your real data.
          </p>
        </div>

        {/* Counts Breakdown Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Demo Records Present</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
              {demoCounts.total}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {demoCounts.leads} leads, {demoCounts.deals} deals, {demoCounts.tasks} tasks
            </span>
          </div>

          <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real Customer Records</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
              {realCounts.total}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {realCounts.leads} leads, {realCounts.deals} deals, {realCounts.tasks} tasks
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
          <button
            type="button"
            disabled={acting || !isOwnerOrAdmin}
            onClick={handleLoadSampleData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <Plus size={14} /> Populate Realistic Sample Data
          </button>

          {demoCounts.total > 0 && (
            <button
              type="button"
              disabled={acting || !isOwnerOrAdmin}
              onClick={() => setIsConfirmModalOpen(true)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Trash2 size={14} /> Remove Demo Data ({demoCounts.total} records)
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CONFIRMATION MODAL: DEMO DATA REMOVAL */}
      {/* ------------------------------------------------------------- */}
      {isConfirmModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface-container-high)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ShieldCheck size={24} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Confirm Demo Data Removal
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              This operation will permanently purge all seeded demo records while strictly preserving your real customer data:
            </p>

            <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                <span>Demo Leads to remove:</span>
                <strong>{demoCounts.leads}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                <span>Demo Deals to remove:</span>
                <strong>{demoCounts.deals}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                <span>Demo Contacts to remove:</span>
                <strong>{demoCounts.contacts}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                <span>Demo Tasks to remove:</span>
                <strong>{demoCounts.tasks}</strong>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span>Real Records Protected (Untouched):</span>
                <strong>{realCounts.total}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                disabled={acting}
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={handleExecutePurgeDemo}
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
                {acting ? 'Purging...' : 'Purge Demo Data Only'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
