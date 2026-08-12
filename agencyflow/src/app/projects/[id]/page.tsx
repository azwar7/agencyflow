'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Settings,
  Calendar,
  DollarSign,
  AlertTriangle,
  FolderKanban,
  FileText,
  ExternalLink,
  Plus,
} from 'lucide-react';

export default function ProjectFullWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'team' | 'activity'>('overview');

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/v1/projects/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProject(json.data);
        } else {
          setError('Project not found or invalid ID.');
        }
      } catch (err: any) {
        setError('Failed to load project workspace.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

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

  if (error || !project) {
    return (
      <AppShell>
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center', background: 'var(--surface-container)' }}>
            <FolderKanban size={48} style={{ color: 'var(--on-surface-variant)', opacity: 0.5, marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 0.5rem 0' }}>
              Project Not Found
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>
              The project workspace you are looking for (ID: <code style={{ color: 'var(--primary)' }}>{id}</code>) does not exist or has been archived.
            </p>
            <Link href="/projects" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Return to Projects Overview
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const isOnTrack = project.status === 'ON TRACK';

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Back Link */}
        <div>
          <Link
            href="/projects"
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
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>

        {/* Workspace Top Header Card */}
        <div
          className="glass-card"
          style={{
            padding: '1.75rem',
            borderRadius: '1rem',
            background: 'var(--surface-container)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ flex: 1, minWidth: '280px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 0.3rem 0' }}>
              FULL WORKSPACE • {project.clientName}
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', margin: 0, lineHeight: 1.2 }}>
              {project.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: isOnTrack ? 'rgba(0, 165, 114, 0.2)' : 'rgba(255, 185, 95, 0.2)',
                  color: isOnTrack ? 'var(--secondary)' : 'var(--tertiary)',
                  border: isOnTrack ? '1px solid rgba(0, 165, 114, 0.35)' : '1px solid rgba(255, 185, 95, 0.35)',
                }}
              >
                ● {project.status}
              </span>

              <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                Budget: <strong style={{ color: 'var(--on-surface)' }}>{project.budget}</strong>
              </span>

              <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                Due Date: <strong style={{ color: 'var(--on-surface)' }}>{project.dueDate}</strong>
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href={`/projects/${project.id}/manage`}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.15rem' }}
            >
              <Settings size={18} /> Manage Interface
            </Link>
            <Link
              href="/clients/portal"
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.15rem' }}
            >
              <ExternalLink size={18} /> Client Portal View
            </Link>
          </div>
        </div>

        {/* Progress Card Banner */}
        <div
          className="glass-card"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '0.85rem',
            background: 'var(--surface-container-high)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface)' }}>
              Overall Project Completion
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: isOnTrack ? 'var(--secondary)' : 'var(--tertiary)' }}>
              {project.progress}% Complete
            </span>
          </div>

          <div
            style={{
              height: '10px',
              width: '100%',
              background: 'var(--surface-container-highest)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${project.progress}%`,
                background: isOnTrack
                  ? 'linear-gradient(90deg, var(--secondary), #6ffbbe)'
                  : 'linear-gradient(90deg, var(--tertiary), #ffb95f)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'overview', label: 'Overview & Milestones' },
            { id: 'deliverables', label: `Deliverables (${project.deliverables?.length || 0})` },
            { id: 'team', label: `Team (${project.team?.length || 0})` },
            { id: 'activity', label: 'Activity Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Milestones */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Project Milestones
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.milestones?.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      background: 'var(--surface-container-high)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {m.completed ? (
                        <CheckCircle2 size={20} color="var(--secondary)" />
                      ) : (
                        <Clock size={20} color="var(--tertiary)" />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.9rem' }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                          Target Date: {m.date}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: m.completed ? 'rgba(0, 165, 114, 0.2)' : 'rgba(255, 185, 95, 0.2)',
                        color: m.completed ? 'var(--secondary)' : 'var(--tertiary)',
                      }}
                    >
                      {m.completed ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Milestone Box */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Next Deliverable Target
              </h3>

              <div style={{ padding: '1rem', borderRadius: '0.6rem', background: 'rgba(10, 14, 24, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>UPCOMING</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginTop: '0.2rem' }}>
                  {project.nextMilestone}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '0.4rem' }}>
                  Target Delivery: <strong>{project.dueDate}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Deliverables */}
        {activeTab === 'deliverables' && (
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1rem' }}>
              Project Deliverables & Specs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {project.deliverables?.map((del: any) => (
                <div
                  key={del.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-high)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.9rem' }}>
                        {del.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                        Target Date: {del.date}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: del.status === 'COMPLETED' ? 'rgba(0, 165, 114, 0.2)' : 'rgba(192, 193, 255, 0.15)',
                      color: del.status === 'COMPLETED' ? 'var(--secondary)' : 'var(--primary)',
                    }}
                  >
                    {del.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Team */}
        {activeTab === 'team' && (
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1rem' }}>
              Assigned Agency Team
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {project.team?.map((mem: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'var(--surface-container-high)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: mem.color || 'var(--primary)',
                      color: 'var(--on-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                    }}
                  >
                    {mem.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.9rem' }}>
                      {mem.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                      {mem.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Activity Log */}
        {activeTab === 'activity' && (
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '1rem' }}>
              Recent Workspace Updates
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {project.activities?.map((act: any) => (
                <div
                  key={act.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-high)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--on-surface)', fontSize: '0.85rem' }}>{act.user}</strong>{' '}
                    <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>{act.action}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
