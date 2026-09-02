'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Save,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sliders,
  Shield,
} from 'lucide-react';

interface AiConfigTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AiConfigTab({ currentUserRole = 'MEMBER', showToast }: AiConfigTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [aiProvider, setAiProvider] = useState<string>('system');
  const [aiLeadAnalysisEnabled, setAiLeadAnalysisEnabled] = useState(true);
  const [aiLeadScoringEnabled, setAiLeadScoringEnabled] = useState(true);
  const [aiEmailGenerationEnabled, setAiEmailGenerationEnabled] = useState(true);
  const [aiFollowUpSuggestionsEnabled, setAiFollowUpSuggestionsEnabled] = useState(true);
  const [aiAutoAnalyzeLeads, setAiAutoAnalyzeLeads] = useState(false);
  const [aiModelTemperature, setAiModelTemperature] = useState(0.7);

  // Server Info & Metrics
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [defaultSystemProvider, setDefaultSystemProvider] = useState<string>('gemini');
  const [usage, setUsage] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/settings/ai');
      const json = await res.json();
      if (json.success && json.data) {
        const { settings, configuredProviders, defaultSystemProvider, usage } = json.data;
        setAiProvider(settings.aiProvider || 'system');
        setAiLeadAnalysisEnabled(settings.aiLeadAnalysisEnabled ?? true);
        setAiLeadScoringEnabled(settings.aiLeadScoringEnabled ?? true);
        setAiEmailGenerationEnabled(settings.aiEmailGenerationEnabled ?? true);
        setAiFollowUpSuggestionsEnabled(settings.aiFollowUpSuggestionsEnabled ?? true);
        setAiAutoAnalyzeLeads(settings.aiAutoAnalyzeLeads ?? false);
        setAiModelTemperature(settings.aiModelTemperature ?? 0.7);

        setConfiguredProviders(configuredProviders || []);
        setDefaultSystemProvider(defaultSystemProvider || 'gemini');
        setUsage(usage);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading AI settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;

    try {
      setSaving(true);
      const res = await fetch('/api/v1/settings/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiProvider,
          aiLeadAnalysisEnabled,
          aiLeadScoringEnabled,
          aiEmailGenerationEnabled,
          aiFollowUpSuggestionsEnabled,
          aiAutoAnalyzeLeads,
          aiModelTemperature,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('AI feature toggles and provider preferences saved.');
      } else {
        showToast(json.error?.message || 'Failed to save settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            AI Engine & Feature Gates
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Provider-independent AI architecture: Controls model selection, pipeline evaluation gates, and lead intelligence.
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
          {saving ? 'Saving...' : 'Save AI Settings'}
        </button>
      </div>

      {/* 1. Feature Gates (Pipeline Switches) */}
      <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Zap size={18} color="#c4b5fd" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Pipeline Feature Gates
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
          Disabled features are strictly blocked across the CRM API layer to prevent unwanted API requests.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          
          {/* Toggle: AI Lead Analysis */}
          <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                AI Lead Intelligence
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Synthesize pain points, ICP match, and custom pitch
              </span>
            </div>
            <input
              type="checkbox"
              disabled={!isOwnerOrAdmin}
              checked={aiLeadAnalysisEnabled}
              onChange={(e) => setAiLeadAnalysisEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
          </div>

          {/* Toggle: AI Lead Scoring */}
          <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                AI Predictive Scoring
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                0-100 intent calibration and auto-qualification
              </span>
            </div>
            <input
              type="checkbox"
              disabled={!isOwnerOrAdmin}
              checked={aiLeadScoringEnabled}
              onChange={(e) => setAiLeadScoringEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
          </div>

          {/* Toggle: AI Email Generation */}
          <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                AI Email Copywriter
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Generate anti-spam, tone-calibrated B2B pitches
              </span>
            </div>
            <input
              type="checkbox"
              disabled={!isOwnerOrAdmin}
              checked={aiEmailGenerationEnabled}
              onChange={(e) => setAiEmailGenerationEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
          </div>

          {/* Toggle: Auto-Analyze New Leads */}
          <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c4b5fd', display: 'block' }}>
                Auto-Analyze Inbound Leads
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Immediately run intelligence upon lead creation or import
              </span>
            </div>
            <input
              type="checkbox"
              disabled={!isOwnerOrAdmin}
              checked={aiAutoAnalyzeLeads}
              onChange={(e) => setAiAutoAnalyzeLeads(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* 2. Provider Selection & Parameters */}
      <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Model Provider & Execution Parameters
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Active AI Provider
            </label>
            <select
              disabled={!isOwnerOrAdmin}
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="system">System Default ({defaultSystemProvider})</option>
              {configuredProviders.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)} (Server Configured)
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '0.35rem' }}>
              Secret API keys remain secured in server-side environment (.env).
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Sampling Temperature: {aiModelTemperature}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              disabled={!isOwnerOrAdmin}
              value={aiModelTemperature}
              onChange={(e) => setAiModelTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
              <span>0.0 (Strict / Deterministic)</span>
              <span>1.0 (Creative Pitching)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real Usage & Activity Statistics */}
      {usage && (
        <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={18} color="#10b981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Live Workspace Usage Statistics
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
            Reliably aggregated from real LeadAiAnalysis and OutreachEmail database records.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Lead Analyses</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {usage.totalAnalyses}
              </div>
            </div>

            <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Outreach Generated</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {usage.totalEmails}
              </div>
            </div>

            <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Delivery Success Rate</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                {usage.successRate}%
              </div>
            </div>
          </div>

          {/* Provider Distribution Badges */}
          {usage.providerCounts && Object.keys(usage.providerCounts).length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Provider Distribution:</span>
              {Object.entries(usage.providerCounts).map(([prov, count]) => (
                <span
                  key={prov}
                  style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', color: '#c4b5fd', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}
                >
                  {prov}: {String(count)} runs
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
