'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { Sparkles, X, CheckCircle, AlertTriangle, ArrowRight, FolderKanban, Settings } from 'lucide-react';

export default function ProjectsOverviewPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Default realistic AgencyFlow project data
  const defaultProjects = [
    {
      id: 'proj-1',
      clientName: 'TechFlow Systems',
      title: 'TechFlow Cloud Portal Re-architecture',
      status: 'ON TRACK',
      statusType: 'success',
      progress: 68,
      nextMilestone: 'Phase 3 API Security Audit',
      dueDate: 'Aug 18, 2026',
      team: [
        { name: 'Sarah Jenkins', avatar: 'SJ', color: 'var(--primary)' },
        { name: 'Alex Rivera', avatar: 'AR', color: 'var(--secondary)' },
      ],
      budget: '$48,000',
    },
    {
      id: 'proj-2',
      clientName: 'Acme Digital',
      title: 'Acme Brand Identity Refresh',
      status: 'AT RISK',
      statusType: 'warning',
      progress: 42,
      nextMilestone: 'Concept Presentation',
      dueDate: 'Aug 22, 2026',
      team: [{ name: 'Elena Rostova', avatar: 'ER', color: 'var(--tertiary)' }],
      budget: '$32,500',
    },
    {
      id: 'proj-3',
      clientName: 'Horizon Media Group',
      title: 'Horizon Media SEO Campaign',
      status: 'ON TRACK',
      statusType: 'success',
      progress: 85,
      nextMilestone: 'Final Report Delivery',
      dueDate: 'Aug 15, 2026',
      team: [
        { name: 'David Patel', avatar: 'DP', color: 'var(--primary)' },
        { name: 'Marcus Vance', avatar: 'MV', color: 'var(--secondary)' },
      ],
      budget: '$18,000',
    },
    {
      id: 'proj-4',
      clientName: 'Nexus Cloud Infrastructure',
      title: 'Nexus Cloud Infrastructure Agency Project',
      status: 'ON TRACK',
      statusType: 'success',
      progress: 15,
      nextMilestone: 'Infrastructure Setup',
      dueDate: 'Sep 05, 2026',
      team: [{ name: 'Sarah Jenkins', avatar: 'SJ', color: 'var(--primary)' }],
      budget: '$65,000',
    },
  ];

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/projects');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setProjects(json.data);
      } else {
        setProjects(defaultProjects);
      }
    } catch (err: any) {
      setProjects(defaultProjects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle Escape key to close Details modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppShell>
      <div className="page-content">
        {/* Command Center Title & KPI Summary Row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '0.25rem' }}>
              COMMAND CENTER
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--on-surface)' }}>
              Project Overview
            </h1>
          </div>

          {/* Top Metric Summary Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Active Projects */}
            <div
              style={{
                background: 'rgba(28, 31, 42, 0.7)',
                backdropFilter: 'blur(12px)',
                padding: '0.6rem 1.25rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
                account_tree
              </span>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', display: 'block', fontWeight: 500 }}>Active Projects</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface)' }}>{projects.length}</span>
              </div>
            </div>

            {/* Milestones On Track */}
            <div
              style={{
                background: 'rgba(28, 31, 42, 0.7)',
                backdropFilter: 'blur(12px)',
                padding: '0.6rem 1.25rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '20px' }}>
                check_circle
              </span>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', display: 'block', fontWeight: 500 }}>Milestones On Track</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface)' }}>92%</span>
              </div>
            </div>

            {/* Overdue Tasks */}
            <div
              style={{
                background: 'rgba(202, 129, 0, 0.15)',
                backdropFilter: 'blur(12px)',
                padding: '0.6rem 1.25rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid rgba(255, 185, 95, 0.3)',
                boxShadow: '0 0 15px rgba(202, 129, 0, 0.15)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '20px' }}>
                warning
              </span>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--tertiary)', display: 'block', fontWeight: 600 }}>Overdue Tasks</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--tertiary)' }}>1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projects 2x2 Desktop Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card skeleton-pulse" style={{ height: '240px' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchProjects} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem' }}>
            {projects.map((proj) => {
              const isOnTrack = proj.status === 'ON TRACK';

              return (
                <div
                  key={proj.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'rgba(28, 31, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                  }}
                >
                  {/* Decorative Background Glow Orb */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-40px',
                      right: '-40px',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: isOnTrack ? 'rgba(78, 222, 163, 0.15)' : 'rgba(255, 185, 95, 0.15)',
                      filter: 'blur(30px)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Card Top: Client & Status Pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', zIndex: 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500, marginBottom: '0.2rem' }}>
                        {proj.clientName}
                      </p>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.3 }}>
                        {proj.title}
                      </h2>
                    </div>

                    <div
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        background: isOnTrack ? 'rgba(0, 165, 114, 0.2)' : 'rgba(202, 129, 0, 0.2)',
                        color: isOnTrack ? 'var(--secondary)' : 'var(--tertiary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexShrink: 0,
                        border: isOnTrack ? '1px solid rgba(78, 222, 163, 0.3)' : '1px solid rgba(255, 185, 95, 0.3)',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isOnTrack ? 'var(--secondary)' : 'var(--tertiary)',
                        }}
                      />
                      {proj.status}
                    </div>
                  </div>

                  {/* Progress Bar Section */}
                  <div style={{ zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Progress</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)' }}>{proj.progress}%</span>
                    </div>

                    <div
                      style={{
                        height: '8px',
                        width: '100%',
                        background: 'var(--surface-container-high)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${proj.progress}%`,
                          background: isOnTrack
                            ? 'linear-gradient(90deg, #4edea3, #6ffbbe)'
                            : 'linear-gradient(90deg, #ca8100, #ffb95f)',
                          borderRadius: '9999px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Next Milestone Box */}
                  <div
                    style={{
                      background: 'rgba(10, 14, 24, 0.6)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 1,
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700 }}>
                        NEXT MILESTONE
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 600, marginTop: '0.15rem' }}>
                        {proj.nextMilestone}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700 }}>
                        DUE
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 600, marginTop: '0.15rem' }}>
                        {proj.dueDate}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Team & Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      zIndex: 1,
                    }}
                  >
                    {/* Overlapping Team Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {proj.team?.map((m: any, idx: number) => (
                        <div
                          key={idx}
                          title={m.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: m.color || 'var(--primary)',
                            color: 'var(--on-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '2px solid var(--surface-container)',
                            marginLeft: idx > 0 ? '-8px' : 0,
                          }}
                        >
                          {m.avatar}
                        </div>
                      ))}
                    </div>

                    {/* Distinct Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* MANAGE BUTTON: Opens dedicated Project Management interface */}
                      <button
                        onClick={() => router.push(`/projects/${proj.id}/manage`)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Settings size={14} /> Manage
                      </button>

                      {/* DETAILS BUTTON: Opens read-only summary modal for this specific project */}
                      <button
                        onClick={() => setSelectedProject(proj)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Read-Only Details Modal */}
      {selectedProject && (
        <div
          className="drawer-backdrop"
          onClick={() => setSelectedProject(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '100%',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              background: 'var(--surface-container-low)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {selectedProject.clientName}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.2rem', margin: 0 }}>
                  {selectedProject.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(10,14,24,0.5)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>CONTRACT VALUE</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.2rem 0 0 0' }}>
                  {selectedProject.budget}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>HEALTH STATUS</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: selectedProject.status === 'ON TRACK' ? 'var(--secondary)' : 'var(--tertiary)', margin: '0.2rem 0 0 0' }}>
                  ● {selectedProject.status}
                </p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
                Active Deliverables
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--on-surface-variant)', paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {selectedProject.deliverables?.map((del: any) => (
                  <li key={del.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--secondary)" /> {del.title}
                  </li>
                )) || (
                  <>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} color="var(--secondary)" /> Initial Architecture Blueprint & DB Schema
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} color="var(--secondary)" /> Next.js 16 Glassmorphism Interface Setup
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={16} color="var(--tertiary)" /> Phase 3 API Security Audit & Pen Testing
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Modal Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <button onClick={() => setSelectedProject(null)} className="btn btn-secondary">
                Close
              </button>
              {/* OPEN FULL WORKSPACE BUTTON: Navigates using selectedProject.id */}
              <button
                onClick={() => router.push(`/projects/${selectedProject.id}`)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Open Full Workspace <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
