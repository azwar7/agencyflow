'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Kanban,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Percent,
  Shield,
  Star,
  Archive,
  RotateCcw,
} from 'lucide-react';

interface StageItem {
  id: string;
  name: string;
  key: string;
  probability: number;
  color: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  requiredFields?: string[] | null;
  _count?: { deals: number };
}

interface PipelineItem {
  id: string;
  name: string;
  isDefault: boolean;
  isArchived: boolean;
  order: number;
  stages: StageItem[];
  _count?: { deals: number };
}

interface PipelineStagesTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function PipelineStagesTab({ currentUserRole = 'MEMBER', showToast }: PipelineStagesTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Edit / Create Stage Modal
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageItem | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageProb, setStageProb] = useState(50);
  const [stageColor, setStageColor] = useState('#8b5cf6');
  const [stageIsWon, setStageIsWon] = useState(false);
  const [stageIsLost, setStageIsLost] = useState(false);
  const [stageReqValue, setStageReqValue] = useState(false);
  const [stageReqDate, setStageReqDate] = useState(false);
  const [savingStage, setSavingStage] = useState(false);

  // New Pipeline Modal
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  // Rename Pipeline State
  const [isRenamingPipeline, setIsRenamingPipeline] = useState(false);
  const [renamePipelineValue, setRenamePipelineValue] = useState('');

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/settings/pipelines');
      const json = await res.json();
      if (json.success && json.data) {
        setPipelines(json.data);
        if (!activePipelineId && json.data.length > 0) {
          const defaultPipe = json.data.find((p: PipelineItem) => p.isDefault) || json.data[0];
          setActivePipelineId(defaultPipe.id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading pipelines', 'error');
    } finally {
      setLoading(false);
    }
  }, [activePipelineId, showToast]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];

  // Stage Reordering
  const handleMoveStage = async (index: number, direction: 'up' | 'down') => {
    if (!activePipeline) return;
    const stages = [...activePipeline.stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const temp = stages[index];
    stages[index] = stages[targetIndex];
    stages[targetIndex] = temp;

    // Optimistically update
    const stageIds = stages.map((s) => s.id);
    setPipelines((prev) =>
      prev.map((p) => (p.id === activePipeline.id ? { ...p, stages } : p))
    );

    try {
      await fetch(`/api/v1/settings/pipelines/${activePipeline.id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageIds }),
      });
      showToast('Stage order updated.');
    } catch (err: any) {
      showToast(err.message, 'error');
      fetchPipelines();
    }
  };

  // Save / Update Stage
  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePipeline || !stageName.trim()) return;

    const requiredFields: string[] = [];
    if (stageReqValue) requiredFields.push('value');
    if (stageReqDate) requiredFields.push('expectedCloseDate');

    try {
      setSavingStage(true);
      const url = editingStage
        ? `/api/v1/settings/pipelines/${activePipeline.id}/stages/${editingStage.id}`
        : `/api/v1/settings/pipelines/${activePipeline.id}/stages`;

      const method = editingStage ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stageName.trim(),
          probability: stageProb,
          color: stageColor,
          isWon: stageIsWon,
          isLost: stageIsLost,
          requiredFields,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Stage saved successfully.');
        setIsStageModalOpen(false);
        fetchPipelines();
      } else {
        showToast(json.error?.message || 'Failed to save stage', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingStage(false);
    }
  };

  // Delete Stage
  const handleDeleteStage = async (stageId: string, stageName: string) => {
    if (!confirm(`Delete stage '${stageName}'? Any active deals in this stage will be automatically moved to a fallback stage.`)) return;

    try {
      const res = await fetch(`/api/v1/settings/pipelines/${activePipeline.id}/stages/${stageId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchPipelines();
      } else {
        showToast(json.error?.message || 'Failed to delete stage', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Set Default Pipeline
  const handleSetDefault = async (pipelineId: string) => {
    try {
      const res = await fetch(`/api/v1/settings/pipelines/${pipelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Default pipeline updated.');
        fetchPipelines();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Create Pipeline
  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) return;

    try {
      setCreatingPipeline(true);
      const res = await fetch('/api/v1/settings/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPipelineName.trim(),
          stages: [
            { name: 'Discovery', probability: 20, color: '#38bdf8' },
            { name: 'Proposal Sent', probability: 50, color: '#8b5cf6', requiredFields: ['value'] },
            { name: 'Negotiation', probability: 80, color: '#f59e0b' },
            { name: 'Closed Won', probability: 100, color: '#10b981', isWon: true },
            { name: 'Closed Lost', probability: 0, color: '#ef4444', isLost: true },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setIsPipelineModalOpen(false);
        setNewPipelineName('');
        setActivePipelineId(json.data.id);
        fetchPipelines();
      } else {
        showToast(json.error?.message || 'Failed to create pipeline', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCreatingPipeline(false);
    }
  };

  const openEditStage = (st: StageItem) => {
    setEditingStage(st);
    setStageName(st.name);
    setStageProb(st.probability);
    setStageColor(st.color);
    setStageIsWon(st.isWon);
    setStageIsLost(st.isLost);
    setStageReqValue(Boolean(st.requiredFields?.includes('value')));
    setStageReqDate(Boolean(st.requiredFields?.includes('expectedCloseDate')));
    setIsStageModalOpen(true);
  };

  const openNewStage = () => {
    setEditingStage(null);
    setStageName('');
    setStageProb(50);
    setStageColor('#8b5cf6');
    setStageIsWon(false);
    setStageIsLost(false);
    setStageReqValue(false);
    setStageReqDate(false);
    setIsStageModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Deal Pipelines & Stage Rules
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Single source of truth: Stage renames and win probabilities propagate immediately to live deals and pipeline Kanban.
          </p>
        </div>

        <button
          onClick={() => setIsPipelineModalOpen(true)}
          disabled={!isOwnerOrAdmin}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <Plus size={16} /> New Pipeline
        </button>
      </div>

      {/* Pipeline Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {pipelines.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePipelineId(p.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: activePipelineId === p.id ? 'rgba(139, 92, 246, 0.2)' : 'var(--surface-container)',
              border: `1px solid ${activePipelineId === p.id ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
              color: activePipelineId === p.id ? '#fff' : '#94a3b8',
              fontWeight: activePipelineId === p.id ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <Kanban size={15} />
            {p.name}
            {p.isDefault && (
              <span style={{ fontSize: '0.65rem', background: '#8b5cf6', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                Default
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Pipeline Detail & Stages */}
      {activePipeline && (
        <div style={{ background: 'var(--surface-container)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                {activePipeline.name}
              </h3>
              {!activePipeline.isDefault && isOwnerOrAdmin && (
                <button
                  onClick={() => handleSetDefault(activePipeline.id)}
                  style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Set as Default
                </button>
              )}
            </div>

            <button
              onClick={openNewStage}
              disabled={!isOwnerOrAdmin}
              className="btn btn-primary"
              style={{ background: '#8b5cf6', border: 'none', padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={14} /> Add Stage
            </button>
          </div>

          {/* Stages List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activePipeline.stages.map((st, index) => (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Color pill */}
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color }} />
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                        {index + 1}. {st.name}
                      </span>
                      {st.isWon && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          Won
                        </span>
                      )}
                      {st.isLost && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          Lost
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      <span>Win Probability: <strong>{st.probability}%</strong></span>
                      {st.requiredFields && st.requiredFields.length > 0 && (
                        <span>Requires: <strong>{st.requiredFields.join(', ')}</strong></span>
                      )}
                      <span>Active Deals: <strong>{st._count?.deals || 0}</strong></span>
                    </div>
                  </div>
                </div>

                {isOwnerOrAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {/* Reorder Arrows */}
                    <button
                      onClick={() => handleMoveStage(index, 'up')}
                      disabled={index === 0}
                      style={{ padding: '0.3rem', background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '4px', color: index === 0 ? '#475569' : '#cbd5e1', cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveStage(index, 'down')}
                      disabled={index === activePipeline.stages.length - 1}
                      style={{ padding: '0.3rem', background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '4px', color: index === activePipeline.stages.length - 1 ? '#475569' : '#cbd5e1', cursor: index === activePipeline.stages.length - 1 ? 'not-allowed' : 'pointer' }}
                    >
                      <ArrowDown size={14} />
                    </button>

                    {/* Edit Stage */}
                    <button
                      onClick={() => openEditStage(st)}
                      style={{ padding: '0.35rem 0.6rem', background: 'rgba(139, 92, 246, 0.15)', border: 'none', borderRadius: '4px', color: '#c4b5fd', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>

                    {/* Delete Stage */}
                    {activePipeline.stages.length > 2 && (
                      <button
                        onClick={() => handleDeleteStage(st.id, st.name)}
                        style={{ padding: '0.35rem 0.45rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT / CREATE STAGE */}
      {/* ------------------------------------------------------------- */}
      {isStageModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 7, 14, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#161922', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                {editingStage ? `Edit Stage: ${editingStage.name}` : 'Add Pipeline Stage'}
              </h3>
              <button onClick={() => setIsStageModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                  Stage Name *
                </label>
                <input
                  type="text"
                  required
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="e.g. Solution Review"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Win Probability (0-100%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={stageProb}
                    onChange={(e) => setStageProb(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Stage Color
                  </label>
                  <input
                    type="color"
                    value={stageColor}
                    onChange={(e) => setStageColor(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '2px', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Stage Specific Required Fields */}
              <div style={{ background: 'var(--surface-container)', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Stage Movement Gate (Required Fields)
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={stageReqValue}
                    onChange={(e) => setStageReqValue(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#8b5cf6' }}
                  />
                  Deal Value required before entering this stage
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={stageReqDate}
                    onChange={(e) => setStageReqDate(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#8b5cf6' }}
                  />
                  Expected Close Date required before entering this stage
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsStageModalOpen(false)} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingStage} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {savingStage ? 'Saving...' : 'Save Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE PIPELINE */}
      {/* ------------------------------------------------------------- */}
      {isPipelineModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 7, 14, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '420px', background: '#161922', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Create New Sales Pipeline
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Will initialize with standard default stages that you can customize freely.
            </p>

            <form onSubmit={handleCreatePipeline} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                required
                placeholder="e.g. Enterprise Retainers"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setIsPipelineModalOpen(false)} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={creatingPipeline} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {creatingPipeline ? 'Creating...' : 'Create Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
