'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  Sliders,
  Sparkles,
  Shield,
  Layers,
  X,
} from 'lucide-react';

interface LeadRoutingTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function LeadRoutingTab({ currentUserRole = 'MEMBER', showToast }: LeadRoutingTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Array<{ id: string; fullName: string; role: string }>>([]);

  // Form State
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [newSourceInput, setNewSourceInput] = useState('');

  const [leadStatuses, setLeadStatuses] = useState<Array<{ key: string; label: string; color: string }>>([]);
  const [newStatusLabel, setNewStatusLabel] = useState('');

  const [defaultLeadOwnerId, setDefaultLeadOwnerId] = useState<string | null>(null);
  const [leadAssignmentRule, setLeadAssignmentRule] = useState<'MANUAL' | 'ROUND_ROBIN' | 'DEFAULT_OWNER'>('MANUAL');
  const [duplicateLeadDetection, setDuplicateLeadDetection] = useState<'OFF' | 'EMAIL_ONLY' | 'EMAIL_AND_PHONE'>('EMAIL_AND_PHONE');

  const [dealLossReasons, setDealLossReasons] = useState<string[]>([]);
  const [newReasonInput, setNewReasonInput] = useState('');

  const [dealRequiredFields, setDealRequiredFields] = useState<string[]>(['title', 'value']);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [defaultsRes, teamRes] = await Promise.all([
        fetch('/api/v1/settings/crm-defaults'),
        fetch('/api/v1/settings/team'),
      ]);

      const defaultsJson = await defaultsRes.json();
      const teamJson = await teamRes.json();

      if (defaultsJson.success && defaultsJson.data) {
        setLeadSources(defaultsJson.data.leadSources || []);
        setLeadStatuses(defaultsJson.data.leadStatuses || []);
        setDefaultLeadOwnerId(defaultsJson.data.defaultLeadOwnerId || null);
        setLeadAssignmentRule(defaultsJson.data.leadAssignmentRule || 'MANUAL');
        setDuplicateLeadDetection(defaultsJson.data.duplicateLeadDetection || 'EMAIL_AND_PHONE');
        setDealLossReasons(defaultsJson.data.dealLossReasons || []);
        setDealRequiredFields(defaultsJson.data.dealRequiredFields || ['title', 'value']);
      }

      if (teamJson.success && teamJson.data) {
        setMembers(teamJson.data.members || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load CRM settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;

    try {
      setSaving(true);
      const res = await fetch('/api/v1/settings/crm-defaults', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadSources,
          leadStatuses,
          defaultLeadOwnerId,
          leadAssignmentRule,
          duplicateLeadDetection,
          dealLossReasons,
          dealRequiredFields,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Lead and deal settings saved successfully.');
      } else {
        showToast(json.error?.message || 'Failed to save settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add Source
  const handleAddSource = () => {
    if (!newSourceInput.trim()) return;
    if (leadSources.includes(newSourceInput.trim())) {
      showToast('Source already exists.', 'error');
      return;
    }
    setLeadSources([...leadSources, newSourceInput.trim()]);
    setNewSourceInput('');
  };

  // Remove Source
  const handleRemoveSource = (src: string) => {
    if (leadSources.length <= 1) {
      showToast('You must keep at least one lead source.', 'error');
      return;
    }
    setLeadSources(leadSources.filter((s) => s !== src));
  };

  // Add Status
  const handleAddStatus = () => {
    if (!newStatusLabel.trim()) return;
    const key = newStatusLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    if (leadStatuses.some((st) => st.key === key)) {
      showToast('Status key already exists.', 'error');
      return;
    }
    setLeadStatuses([...leadStatuses, { key, label: newStatusLabel.trim(), color: '#8b5cf6' }]);
    setNewStatusLabel('');
  };

  // Remove Status
  const handleRemoveStatus = (key: string) => {
    if (leadStatuses.length <= 2) {
      showToast('You must keep at least 2 lead statuses.', 'error');
      return;
    }
    setLeadStatuses(leadStatuses.filter((st) => st.key !== key));
  };

  // Add Loss Reason
  const handleAddLossReason = () => {
    if (!newReasonInput.trim()) return;
    if (dealLossReasons.includes(newReasonInput.trim())) {
      showToast('Loss reason already exists.', 'error');
      return;
    }
    setDealLossReasons([...dealLossReasons, newReasonInput.trim()]);
    setNewReasonInput('');
  };

  // Remove Loss Reason
  const handleRemoveLossReason = (reason: string) => {
    if (dealLossReasons.length <= 1) {
      showToast('You must keep at least one deal loss reason.', 'error');
      return;
    }
    setDealLossReasons(dealLossReasons.filter((r) => r !== reason));
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Lead Lifecycle & Deal Settings
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Directly governs lead intake sources, duplicate validation, automated assignment, and deal loss attribution.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !isOwnerOrAdmin}
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
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* 1. Lead Sources Manager */}
      <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.35rem' }}>
          Configured Lead Acquisition Sources
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
          These sources appear in lead creation modals, n8n ingestion workflows, and campaign filters.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {leadSources.map((src) => (
            <span
              key={src}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c4b5fd',
                fontSize: '0.8rem',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              {src}
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => handleRemoveSource(src)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>

        {isOwnerOrAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Add custom source (e.g. Podcast Sponsor)..."
              value={newSourceInput}
              onChange={(e) => setNewSourceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSource();
                }
              }}
              style={{ flex: 1, padding: '0.45rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            />
            <button
              type="button"
              onClick={handleAddSource}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Add Source
            </button>
          </div>
        )}
      </div>

      {/* 2. Automated Lead Assignment & Duplicate Detection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Assignment Rules */}
        <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.35rem' }}>
            Lead Assignment Rule
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Determine who is assigned incoming prospects when imported or created without an explicit owner.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <select
              value={leadAssignmentRule}
              onChange={(e) => setLeadAssignmentRule(e.target.value as any)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="MANUAL">Manual (Assigning Rep retains ownership)</option>
              <option value="DEFAULT_OWNER">Default Dedicated Lead Owner</option>
            </select>

            {leadAssignmentRule === 'DEFAULT_OWNER' && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                  Select Default Owner
                </label>
                <select
                  value={defaultLeadOwnerId || ''}
                  onChange={(e) => setDefaultLeadOwnerId(e.target.value || null)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="">Select a team member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Duplicate Detection */}
        <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.35rem' }}>
            Duplicate Ingestion Protection
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Enforce unique prospect validation during creation and import to prevent duplicate records.
          </p>

          <select
            value={duplicateLeadDetection}
            onChange={(e) => setDuplicateLeadDetection(e.target.value as any)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="EMAIL_AND_PHONE">Email Address & Phone Number (Recommended)</option>
            <option value="EMAIL_ONLY">Email Address Only</option>
            <option value="OFF">Disabled (Allow Duplicates)</option>
          </select>
        </div>
      </div>

      {/* 3. Deal Lost Reasons Manager */}
      <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.35rem' }}>
          Deal Loss Attribution Reasons
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
          When reps drag a deal to Closed Lost in the Pipeline Kanban, they are prompted with these reasons for win/loss analytics.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {dealLossReasons.map((reason) => (
            <span
              key={reason}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontSize: '0.8rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              {reason}
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => handleRemoveLossReason(reason)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>

        {isOwnerOrAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Add loss reason..."
              value={newReasonInput}
              onChange={(e) => setNewReasonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLossReason();
                }
              }}
              style={{ flex: 1, padding: '0.45rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            />
            <button
              type="button"
              onClick={handleAddLossReason}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Add Reason
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
