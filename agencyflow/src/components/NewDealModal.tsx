'use client';

import React, { useState, useEffect } from 'react';
import { X, Briefcase, Sparkles } from 'lucide-react';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StageOption {
  id: string;
  name: string;
  key: string;
  probability: number;
  requiredFields?: string[] | null;
}

export function NewDealModal({ isOpen, onClose, onSuccess }: NewDealModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stageId: '',
    stageKey: 'DISCOVERY',
    expectedCloseDate: '',
  });

  const [stages, setStages] = useState<StageOption[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 1. Fetch dynamic pipeline and stages
      fetch('/api/v1/settings/pipelines')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data && json.data.length > 0) {
            const defaultPipe = json.data.find((p: any) => p.isDefault) || json.data[0];
            setActivePipelineId(defaultPipe.id);
            setStages(defaultPipe.stages || []);
            if (defaultPipe.stages?.length > 0) {
              setFormData((prev) => ({
                ...prev,
                stageId: defaultPipe.stages[0].id,
                stageKey: defaultPipe.stages[0].key,
              }));
            }
          }
        })
        .catch(() => {});

      // 2. Fetch custom fields for DEAL
      fetch('/api/v1/settings/custom-fields?entityType=DEAL')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setCustomFields(json.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          value: formData.value ? Number(formData.value) : 0,
          pipelineId: activePipelineId,
          stageId: formData.stageId,
          stage: formData.stageKey,
          expectedCloseDate: formData.expectedCloseDate || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create deal');
      }

      // Save custom fields if any
      if (Object.keys(customValues).length > 0) {
        await fetch('/api/v1/crm/custom-field-values', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId: json.data.id,
            entityType: 'DEAL',
            values: customValues,
          }),
        });
      }

      setFormData({ title: '', value: '', stageId: '', stageKey: 'DISCOVERY', expectedCloseDate: '' });
      setCustomValues({});
      onSuccess();
      window.dispatchEvent(new Event('agencyflow-refresh'));
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Briefcase size={22} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add Pipeline Deal</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, overflowY: 'auto' }}>
          {error && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Deal Opportunity Title *
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Apex WebApp Retainer"
              style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Deal Value ($ USD) *
              </label>
              <input
                required
                type="number"
                min={0}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g. 35000"
                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Expected Close Date
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Initial Pipeline Stage
            </label>
            <select
              value={formData.stageId}
              onChange={(e) => {
                const selected = stages.find((s) => s.id === e.target.value);
                setFormData({
                  ...formData,
                  stageId: e.target.value,
                  stageKey: selected?.key || 'DISCOVERY',
                });
              }}
              style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {stages.length > 0 ? (
                stages.map((st, i) => (
                  <option key={st.id} value={st.id}>
                    {i + 1}. {st.name} ({st.probability}% probability)
                  </option>
                ))
              ) : (
                <option value="">Standard Discovery</option>
              )}
            </select>
          </div>

          {/* Dynamic Custom Fields for DEAL */}
          {customFields.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c4b5fd' }}>
                Custom Fields ({customFields.length})
              </span>
              {customFields.map((f) => (
                <div key={f.id}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                    {f.name} {f.isRequired && <span style={{ color: 'var(--error)' }}>*</span>}
                  </label>
                  {f.fieldType === 'DROPDOWN' && f.options ? (
                    <select
                      required={f.isRequired}
                      value={customValues[f.key] || ''}
                      onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    >
                      <option value="">Select option...</option>
                      {f.options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.fieldType === 'CHECKBOX' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(customValues[f.key])}
                        onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                      />
                      {f.placeholder || f.name}
                    </label>
                  ) : (
                    <input
                      type={f.fieldType === 'NUMBER' || f.fieldType === 'CURRENCY' ? 'number' : f.fieldType === 'DATE' ? 'date' : 'text'}
                      required={f.isRequired}
                      placeholder={f.placeholder || ''}
                      value={customValues[f.key] || ''}
                      onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Pipeline Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
