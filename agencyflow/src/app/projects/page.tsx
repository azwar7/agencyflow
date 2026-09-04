'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
import {
  Sparkles,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  FolderKanban,
  Settings,
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit3,
  Check,
  ShieldCheck,
  TrendingUp,
  Layers,
  Users,
  Activity,
  Zap,
} from 'lucide-react';
import { getCachedData, setCachedData } from '@/lib/client-cache';

interface ProjectItem {
  id: string;
  clientName: string;
  title: string;
  status: 'ON TRACK' | 'AT RISK' | 'COMPLETED' | 'ON HOLD';
  statusType: 'success' | 'warning' | 'primary' | 'neutral';
  progress: number;
  currentPhase: number;
  nextMilestone: string;
  dueDate: string;
  budget: number;
  budgetFormatted: string;
  invoicedPaid: string;
  remainingBalance: string;
  deliverables?: { id: string; title: string; status: string }[];
  team?: { name: string; avatar: string; color: string }[];
}

export default function ProjectsOverviewPage() {
  const router = useRouter();
  const cached = getCachedData<ProjectItem[]>('/api/v1/projects');
  const [projects, setProjects] = useState<ProjectItem[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  // Filters & View State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON TRACK' | 'AT RISK' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Dropdowns
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);

  // AI Health Check Modal
  const [aiHealthProject, setAiHealthProject] = useState<ProjectItem | null>(null);
  const [analyzingHealth, setAnalyzingHealth] = useState(false);
  const [aiHealthReport, setAiHealthReport] = useState<{ status: string; score: number; summary: string; recommendations: string[] } | null>(null);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newBudget, setNewBudget] = useState('24000');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMilestone, setNewMilestone] = useState('Phase 1: Architecture & UI/UX Design Kickoff');
  const [creating, setCreating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenuProjectId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    if (!cached && (!projects || projects.length === 0)) {
      setLoading(true);
    }
    setError('');
    try {
      const res = await fetch('/api/v1/projects');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
        setCachedData('/api/v1/projects', json.data);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      if (!projects || projects.length === 0) setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Run AI Project Health & Risk Diagnostic
  const handleRunAiHealthCheck = (proj: ProjectItem) => {
    setAiHealthProject(proj);
    setAnalyzingHealth(true);
    setAiHealthReport(null);

    // Simulate real-time diagnostic synthesis
    setTimeout(() => {
      const isOnTrack = proj.status === 'ON TRACK';
      const isCompleted = proj.status === 'COMPLETED';

      setAiHealthReport({
        status: isOnTrack ? 'Optimal Health' : isCompleted ? 'Successfully Delivered' : 'Attention Required',
        score: isCompleted ? 100 : isOnTrack ? 92 : 68,
        summary: isCompleted
          ? `Project "${proj.title}" has been successfully delivered and handed over to ${proj.clientName}. Total contract of ${proj.budgetFormatted} fully invoiced.`
          : isOnTrack
          ? `Delivery velocity for ${proj.clientName} is on schedule. Progress is at ${proj.progress}%, with ${proj.nextMilestone} tracking within estimated sprint deadlines.`
          : `Milestone "${proj.nextMilestone}" requires attention. Estimated completion timeline is close to due date (${proj.dueDate}). Recommend reallocating 1 additional engineer.`,
        recommendations: isOnTrack
          ? [
              'Continue scheduled milestone sprint cadence',
              'Prepare Phase 3 automated n8n webhook test environment',
              'Keep client updated via weekly automated email report',
            ]
          : [
              'Conduct immediate 15-minute blockers sync with engineering lead',
              'Review remaining open tasks on the Task Board',
              'Confirm client approval on current Figma component specs',
            ],
      });
      setAnalyzingHealth(false);
    }, 800);
  };

  // Create New Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClient.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          clientName: newClient.trim(),
          budget: Number(newBudget) || 24000,
          nextMilestone: newMilestone.trim(),
          dueDate: newDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ON TRACK',
          progress: 15,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsNewProjectModalOpen(false);
        setNewTitle('');
        setNewClient('');
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${title}"?`)) return;
    setActiveMenuProjectId(null);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/v1/projects?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      fetchProjects();
    }
  };

  // KPI Metrics Calculation
  const totalProjects = projects.length;
  const onTrackProjects = projects.filter((p) => p.status === 'ON TRACK').length;
  const atRiskProjects = projects.filter((p) => p.status === 'AT RISK').length;
  const totalRevenueInDelivery = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  // Filtered List
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'calc(100vh - 100px)' }}>
        {/* Top Command Center Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FolderKanban size={24} color="#38bdf8" /> Project Command Center
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              Track active delivery roadmaps, budget health, phased milestones, and AI risk diagnostics.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '180px',
                }}
              />
            </div>

            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="btn btn-primary hover-level-1"
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                border: 'none',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
              }}
            >
              <Plus size={16} /> New Project
            </button>
          </div>
        </div>

        {/* Top KPI Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Total Revenue in Delivery */}
          <div className="hover-level-2-spacious cursor-pointer" style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Pipeline</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>${totalRevenueInDelivery.toLocaleString()}</div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="hover-level-2-spacious cursor-pointer" style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Active Projects</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{totalProjects}</div>
            </div>
          </div>

          {/* On Track Rate */}
          <div className="hover-level-2-spacious cursor-pointer" style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Health</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4edea3' }}>
                {totalProjects > 0 ? `${Math.round((onTrackProjects / totalProjects) * 100)}%` : '100%'}
              </div>
            </div>
          </div>

          {/* At Risk Projects */}
          <div className="hover-level-2-spacious cursor-pointer" style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: atRiskProjects > 0 ? 'rgba(255, 185, 95, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: atRiskProjects > 0 ? '#ffb95f' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>At Risk Milestones</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: atRiskProjects > 0 ? '#ffb95f' : '#fff' }}>{atRiskProjects}</div>
            </div>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'ON TRACK', 'AT RISK', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === st ? 'rgba(56, 189, 248, 0.2)' : 'var(--surface-container-low)',
                border: statusFilter === st ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: statusFilter === st ? '#38bdf8' : 'var(--on-surface-variant)',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'ALL' ? 'All Projects' : st}
            </button>
          ))}
        </div>

        {/* Projects 2x2 Desktop Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-pulse" style={{ height: '320px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchProjects} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects match this filter"
            description="Track client delivery milestones, budget health, timelines, and deliverables in real time."
            actionLabel="+ Create Project"
            onAction={() => setIsNewProjectModalOpen(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem', paddingBottom: '2rem' }}>
            {filteredProjects.map((proj) => {
              const isOnTrack = proj.status === 'ON TRACK';
              const isAtRisk = proj.status === 'AT RISK';
              const isCompleted = proj.status === 'COMPLETED';

              return (
                <div
                  key={proj.id}
                  className="hover-level-2"
                  style={{
                    background: 'var(--surface-container)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.1rem',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                  }}
                >
                  {/* Card Top Row: Client, Title & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, margin: '0 0 0.2rem 0' }}>
                        {proj.clientName}
                      </p>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                        {proj.title}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Status Badge */}
                      <span
                        style={{
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: isOnTrack
                            ? 'rgba(78, 222, 163, 0.18)'
                            : isAtRisk
                            ? 'rgba(255, 185, 95, 0.18)'
                            : 'rgba(56, 189, 248, 0.18)',
                          color: isOnTrack ? '#4edea3' : isAtRisk ? '#ffb95f' : '#38bdf8',
                          border: isOnTrack
                            ? '1px solid rgba(78, 222, 163, 0.3)'
                            : isAtRisk
                            ? '1px solid rgba(255, 185, 95, 0.3)'
                            : '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        {proj.status}
                      </span>

                      {/* 3-Dot Menu */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuProjectId(activeMenuProjectId === proj.id ? null : proj.id);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '4px' }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuProjectId === proj.id && (
                          <div
                            ref={dropdownRef}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              zIndex: 50,
                              minWidth: '150px',
                              background: '#1e2026',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                              padding: '4px',
                            }}
                          >
                            <button
                              onClick={() => handleDeleteProject(proj.id, proj.title)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                color: '#ffb4ab',
                                fontSize: '12px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                fontWeight: 600,
                              }}
                            >
                              <Trash2 size={13} /> Delete Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Speed Indicator */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Sprint Velocity</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isOnTrack ? '#4edea3' : isAtRisk ? '#ffb95f' : '#38bdf8' }}>
                        {proj.progress}%
                      </span>
                    </div>
                    <div style={{ height: '7px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${proj.progress}%`,
                          background: isOnTrack
                            ? 'linear-gradient(90deg, #3b82f6, #4edea3)'
                            : isAtRisk
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : 'linear-gradient(90deg, #38bdf8, #10b981)',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Phased Roadmap Timeline Bar (4 Phases) */}
                  <div style={{ background: 'var(--surface-container-lowest)', borderRadius: '8px', padding: '0.75rem 0.9rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Layers size={13} /> Implementation Roadmap
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                      {[
                        { num: 1, label: 'Phase 1: Design' },
                        { num: 2, label: 'Phase 2: Core Dev' },
                        { num: 3, label: 'Phase 3: Workflows' },
                        { num: 4, label: 'Phase 4: Launch' },
                      ].map((step) => {
                        const isCurrent = proj.currentPhase === step.num;
                        const isPast = proj.currentPhase > step.num;
                        return (
                          <div
                            key={step.num}
                            style={{
                              padding: '0.35rem 0.25rem',
                              borderRadius: '4px',
                              textAlign: 'center',
                              background: isCurrent
                                ? 'rgba(56, 189, 248, 0.2)'
                                : isPast
                                ? 'rgba(78, 222, 163, 0.15)'
                                : 'rgba(255, 255, 255, 0.03)',
                              border: isCurrent
                                ? '1px solid #38bdf8'
                                : isPast
                                ? '1px solid rgba(78, 222, 163, 0.3)'
                                : '1px solid rgba(255, 255, 255, 0.04)',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: isCurrent ? '#38bdf8' : isPast ? '#4edea3' : 'var(--outline)',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {isPast ? '✓ ' : ''}{step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Health Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Total Budget</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{proj.budgetFormatted}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Collected</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4edea3' }}>{proj.invoicedPaid}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Remaining</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffb95f' }}>{proj.remainingBalance}</div>
                    </div>
                  </div>

                  {/* Next Milestone Box */}
                  <div style={{ background: 'var(--surface-container-high)', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '0.75rem' }}>
                      <span style={{ fontSize: '0.65rem', color: '#d0bcff', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                        Next Milestone
                      </span>
                      <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {proj.nextMilestone}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700 }}>Due Date</span>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isAtRisk ? '#ffb95f' : '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> {proj.dueDate}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    {/* Team Avatars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--surface-container)' }}>
                          AR
                        </div>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#a855f7', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--surface-container)', marginLeft: '-6px' }}>
                          SJ
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>2 Engineers</span>
                    </div>

                    {/* AI Health Diagnostic Button */}
                    <button
                      onClick={() => handleRunAiHealthCheck(proj)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d0bcff' }}
                    >
                      <Sparkles size={13} color="#d0bcff" /> AI Health Check
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI Project Health Diagnostic Modal */}
        {aiHealthProject && (
          <div className="drawer-backdrop" onClick={() => setAiHealthProject(null)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '520px',
                maxWidth: '95vw',
                background: '#181a20',
                padding: '1.5rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Sparkles size={18} color="#d0bcff" /> AI Project Health Diagnostic
                </h3>
                <button onClick={() => setAiHealthProject(null)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {analyzingHealth ? (
                <div style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <Zap size={28} className="animate-spin" color="#38bdf8" />
                  <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                    Evaluating sprint milestones, velocity, and delivery risks...
                  </p>
                </div>
              ) : aiHealthReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Health Score Banner */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(208, 188, 255, 0.12), rgba(56, 189, 248, 0.1))', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(208, 188, 255, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase' }}>Delivery Health Index</span>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0 0 0' }}>
                        {aiHealthReport.status}
                      </h4>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: aiHealthReport.score >= 80 ? '#4edea3' : '#ffb95f' }}>
                      {aiHealthReport.score}/100
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', margin: '0 0 0.4rem 0' }}>
                      Executive Assessment
                    </h5>
                    <p style={{ fontSize: '0.85rem', color: '#e2e2e8', lineHeight: 1.5, margin: 0, background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                      {aiHealthReport.summary}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', margin: '0 0 0.4rem 0' }}>
                      Key Action Items
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {aiHealthReport.recommendations.map((rec, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Check size={14} color="#4edea3" /> {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Create New Project Modal */}
        {isNewProjectModalOpen && (
          <div className="drawer-backdrop" onClick={() => setIsNewProjectModalOpen(false)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '480px',
                maxWidth: '95vw',
                background: '#181a20',
                padding: '1.5rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>Create New Project</h3>
                <button onClick={() => setIsNewProjectModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Project Title:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Real Estate Web Application & Automation"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Client Organization:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohmand Property Dealers, Apex Heating..."
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Contract Budget ($ USD):
                    </label>
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Target Delivery Date:
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Next Milestone:
                  </label>
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem',
                    background: '#38bdf8',
                    color: '#082f49',
                    border: 'none',
                    fontWeight: 700,
                    marginTop: '0.5rem',
                  }}
                >
                  {creating ? 'Creating Project...' : 'Create Project'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
