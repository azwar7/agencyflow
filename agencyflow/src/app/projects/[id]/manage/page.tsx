'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  ArrowLeft,
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  FolderKanban,
  ExternalLink,
} from 'lucide-react';

export default function ProjectManagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Controls
  const [status, setStatus] = useState<'ON TRACK' | 'AT RISK'>('ON TRACK');
  const [progress, setProgress] = useState(50);
  const [nextMilestone, setNextMilestone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/projects/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data;
          setProject(p);
          setStatus(p.status || 'ON TRACK');
          setProgress(p.progress || 50);
          setNextMilestone(p.nextMilestone || '');
          setDueDate(p.dueDate || '');
          setDeliverables(p.deliverables || []);
        }
      } catch (err) {
        console.error('Failed to fetch project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleAddDeliverable = () => {
    if (!newDeliverableTitle.trim()) return;
    const newDel = {
      id: `del-${Date.now()}`,
      title: newDeliverableTitle,
      status: 'IN_PROGRESS',
      date: 'Upcoming',
    };
    setDeliverables([...deliverables, newDel]);
    setNewDeliverableTitle('');
  };

  const handleRemoveDeliverable = (delId: string) => {
    setDeliverables(deliverables.filter((d) => d.id !== delId));
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card skeleton-pulse" style={{ height: '140px', borderRadius: '1rem' }} />
          <div className="glass-card skeleton-pulse" style={{ height: '400px', borderRadius: '1rem' }} />
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="page-content" style={{ padding: '3rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <FolderKanban size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h2>Project Not Found</h2>
          <p>Could not locate project management controls for ID: {id}</p>
          <Link href="/projects" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            Back to Projects
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Navigation Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link
              href={`/projects/${project.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
                marginBottom: '0.5rem',
              }}
            >
              <ArrowLeft size={16} /> Back to Full Workspace
            </Link>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>
              Manage Project Operations
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
              {project.clientName} • {project.title}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href={`/projects/${project.id}`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ExternalLink size={16} /> Open Full Workspace
            </Link>
          </div>
        </div>

        {saveSuccess && (
          <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.5rem', background: 'rgba(0, 165, 114, 0.2)', border: '1px solid rgba(0, 165, 114, 0.4)', color: 'var(--secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
            ✓ Project management settings and deliverables updated successfully!
          </div>
        )}

        {/* Management Form */}
        <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Status & Progress Card */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} color="var(--primary)" /> Project Health & Status Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  Project Health Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--on-surface)',
                    fontSize: '0.875rem',
                    marginTop: '0.35rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ON TRACK">● ON TRACK (Green)</option>
                  <option value="AT RISK">● AT RISK (Amber)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  Completion Progress ({progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '0.75rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  Next Target Milestone
                </label>
                <input
                  type="text"
                  value={nextMilestone}
                  onChange={(e) => setNextMilestone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--on-surface)',
                    fontSize: '0.875rem',
                    marginTop: '0.35rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  Target Delivery Date
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--on-surface)',
                    fontSize: '0.875rem',
                    marginTop: '0.35rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Manage Deliverables Section */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              Manage Active Deliverables
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Enter new deliverable title..."
                value={newDeliverableTitle}
                onChange={(e) => setNewDeliverableTitle(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.5rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--on-surface)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Plus size={16} /> Add Deliverable
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {deliverables.map((del) => (
                <div
                  key={del.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-high)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 600 }}>{del.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(del.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link href={`/projects/${project.id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Management Settings'}
            </button>
          </div>
        </form>

      </div>
    </AppShell>
  );
}
