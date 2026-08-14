'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { DollarSign, Clock, AlertTriangle, CheckCircle, XCircle, Briefcase } from 'lucide-react';

export default function PipelinePage() {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Loss Reason Dialog State
  const [lossModalDeal, setLossModalDeal] = useState<any | null>(null);
  const [lossReason, setLossReason] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  const fetchPipeline = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/deals');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to load pipeline');
      setPipelineData(json.data);
    } catch (err: any) {
      setError(err.message || 'Error loading pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();

    const handleRefresh = () => fetchPipeline();
    window.addEventListener('agencyflow-refresh', handleRefresh);
    return () => window.removeEventListener('agencyflow-refresh', handleRefresh);
  }, []);

  const handleStageChange = async (dealId: string, newStage: string) => {
    if (newStage === 'CLOSED_LOST') {
      const deal = pipelineData?.columns.flatMap((c: any) => c.deals).find((d: any) => d.id === dealId);
      setLossModalDeal(deal || { id: dealId });
      return;
    }

    try {
      const res = await fetch(`/api/v1/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (json.success) fetchPipeline();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmLossReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossModalDeal || !lossReason.trim()) return;

    setUpdatingStage(true);
    try {
      const res = await fetch(`/api/v1/deals/${lossModalDeal.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'CLOSED_LOST', lossReason }),
      });
      const json = await res.json();
      if (json.success) {
        setLossModalDeal(null);
        setLossReason('');
        fetchPipeline();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStage(false);
    }
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Sales Pipeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Visual drag-and-drop Kanban board & deal stage aging tracker
          </p>
        </div>

        <button onClick={fetchPipeline} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          Refresh Pipeline
        </button>
      </div>

      {loading ? (
        <div className="kanban-grid">
          {[1, 2, 3, 4, 5].map((col) => (
            <div key={col} className="kanban-column skeleton-pulse" style={{ height: '500px' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
          <p>{error}</p>
          <button onClick={fetchPipeline} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      ) : !pipelineData?.columns || pipelineData.columns.every((c: any) => !c.deals || c.deals.length === 0) ? (
        <div style={{ marginTop: '1.5rem' }}>
          <EmptyState
            icon={Briefcase}
            title="No active pipeline deals"
            description="Track high-value agency opportunities, milestone probabilities, and projected revenue."
            actionLabel="View Dashboard"
            onAction={() => window.location.href = '/dashboard'}
          />
        </div>
      ) : (
        <div className="kanban-grid">
          {pipelineData.columns.map((col: any) => (
            <div key={col.stageId} className="kanban-column">
              {/* Column Header */}
              <div className="kanban-header">
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{col.label}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    ${col.totalValue.toLocaleString()} ({col.count})
                  </span>
                </div>
              </div>

              {/* Column Cards */}
              <div className="kanban-body">
                {col.deals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No deals in this stage
                  </div>
                ) : (
                  col.deals.map((deal: any) => (
                    <div key={deal.id} className="deal-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {deal.company?.name || 'Independent Prospect'}
                        </span>
                        {deal.lossReason && (
                          <span title={`Loss Reason: ${deal.lossReason}`} style={{ color: 'var(--accent-danger)' }}>
                            <AlertTriangle size={14} />
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                        {deal.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                          ${deal.value.toLocaleString()}
                        </span>

                        {/* Move Stage Selector */}
                        <select
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.4rem',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="DISCOVERY">Discovery</option>
                          <option value="PROPOSAL">Proposal</option>
                          <option value="NEGOTIATION">Negotiation</option>
                          <option value="CLOSED_WON">Closed Won</option>
                          <option value="CLOSED_LOST">Closed Lost</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Loss Reason Modal */}
      {lossModalDeal && (
        <div className="drawer-backdrop" onClick={() => setLossModalDeal(null)}>
          <div className="drawer-content" style={{ maxWidth: '420px', margin: 'auto', height: 'auto', borderRadius: 'var(--radius-lg)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-danger)' }}>Capture Loss Reason</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Why was "{lossModalDeal.title}" closed as lost?
              </p>
            </div>

            <form onSubmit={handleConfirmLossReason} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                required
                rows={3}
                placeholder="e.g. Budget mismatch, chosen competitor, project deferred..."
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setLossModalDeal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={updatingStage} className="btn btn-primary" style={{ background: 'var(--accent-danger)' }}>
                  {updatingStage ? 'Saving...' : 'Confirm Closed Lost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
