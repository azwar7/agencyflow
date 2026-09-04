'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import {
  TrendingUp,
  FolderKanban,
  Receipt,
  UserPlus,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  DollarSign,
  Zap,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/v1/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const handleRefresh = () => fetchDashboard();
    window.addEventListener('agencyflow-refresh', handleRefresh);
    return () => window.removeEventListener('agencyflow-refresh', handleRefresh);
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (updatingTaskId === taskId) return;
    setUpdatingTaskId(taskId);

    const nextStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';

    setData((prev: any) => {
      if (!prev || !prev.urgentTasks) return prev;
      return {
        ...prev,
        urgentTasks: prev.urgentTasks.filter((t: any) => t.id !== taskId),
      };
    });

    try {
      await fetch('/api/v1/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      fetchDashboard();
    } catch (err) {
      console.error(err);
      fetchDashboard();
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const metrics = data?.metrics || {
    totalPipelineValue: 0,
    activeDealsCount: 0,
    activeProjectsCount: 0,
    projectsDueThisWeek: 0,
    outstandingInvoicesAmount: 0,
    awaitingInvoicesCount: 0,
    monthlyRevenue: 0,
    winRate: 0,
    totalLeads: 0,
    closedWonCount: 0,
  };

  const pipeline = data?.pipeline || {
    newLeads: [],
    qualifiedLeads: [],
    proposalDeals: [],
    negotiationDeals: [],
    closedWonCount: 0,
  };

  const urgentTasksList = data?.urgentTasks || [];
  const projectsList = data?.projects || [];
  const recentActivitiesList = data?.recentActivities || [];

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}>
        {/* Glow Orb Background */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '25%',
            width: '500px',
            height: '500px',
            background: 'rgba(56, 189, 248, 0.04)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        {/* 1. Welcome Header & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--on-surface)', margin: 0, letterSpacing: '-0.02em' }}>
              Good morning, {user?.name ? user.name.split(' ')[0] : 'there'}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
              Here is your live workspace command center.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/projects')} className="btn btn-secondary hover-level-1" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
              + New Project
            </button>

            <button onClick={() => router.push('/proposals')} className="btn btn-secondary hover-level-1" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}>
              Create Proposal
            </button>

            <button
              onClick={() => router.push('/leads')}
              className="btn btn-primary hover-level-1"
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                border: 'none',
                fontWeight: 700,
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)',
              }}
            >
              + New Lead
            </button>
          </div>
        </div>

        {/* 2. Real KPI Summary Cards (Level 2 Floating Glassmorphism Interaction) */}
        <div className="kpi-grid">
          {/* Card 1: Pipeline Value */}
          <div
            className="kpi-card hover-level-2-spacious"
            onClick={() => router.push('/pipeline')}
            style={{ cursor: 'pointer' }}
            title="View Pipeline"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                PIPELINE VALUE
              </span>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {metrics.activeDealsCount} Deals
              </div>
            </div>
            <div className="kpi-metric">${Number(metrics.totalPipelineValue || 0).toLocaleString()}</div>
          </div>

          {/* Card 2: Active Projects */}
          <div
            className="kpi-card hover-level-2-spacious"
            onClick={() => router.push('/projects')}
            style={{ cursor: 'pointer' }}
            title="View Projects"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ACTIVE PROJECTS
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>
                account_tree
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="kpi-metric" style={{ marginTop: 0 }}>
                {metrics.activeProjectsCount}
              </span>
              <span style={{ fontSize: '12px', color: metrics.projectsDueThisWeek > 0 ? '#ffb95f' : 'var(--on-surface-variant)' }}>
                {metrics.projectsDueThisWeek > 0 ? `${metrics.projectsDueThisWeek} due this week` : 'on schedule'}
              </span>
            </div>
          </div>

          {/* Card 3: Outstanding Invoices */}
          <div
            className="kpi-card hover-level-2-spacious"
            onClick={() => router.push('/invoices')}
            style={{ cursor: 'pointer' }}
            title="View Invoices"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                OUTSTANDING
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>
                receipt_long
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="kpi-metric" style={{ marginTop: 0, color: metrics.outstandingInvoicesAmount > 0 ? '#ffb4ab' : '#fff' }}>
                ${Number(metrics.outstandingInvoicesAmount || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: metrics.awaitingInvoicesCount > 0 ? '#ffb4ab' : 'var(--on-surface-variant)' }}>
                {metrics.awaitingInvoicesCount} awaiting
              </span>
            </div>
          </div>

          {/* Card 4: Monthly Revenue */}
          <div
            className="kpi-card hover-level-2-spacious"
            onClick={() => router.push('/invoices')}
            style={{ cursor: 'pointer' }}
            title="View Billing"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                COLLECTED REV
              </span>
              <div style={{ background: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                Paid
              </div>
            </div>
            <div className="kpi-metric" style={{ color: '#4edea3' }}>
              ${Number(metrics.monthlyRevenue || 0).toLocaleString()}
            </div>
          </div>

          {/* Card 5: Conversion Win Rate */}
          <div
            className="kpi-card hover-level-2-spacious"
            onClick={() => router.push('/pipeline')}
            style={{ cursor: 'pointer' }}
            title="View Conversion"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                WIN RATE
              </span>
              <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {metrics.closedWonCount} Won
              </div>
            </div>
            <div className="kpi-metric">{metrics.winRate}%</div>
          </div>
        </div>

        {/* 3. Real Active Pipeline Overview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              Active Pipeline
            </h2>
            <button
              onClick={() => router.push('/pipeline')}
              style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View Full Pipeline →
            </button>
          </div>

          <div className="kanban-row" style={{ minHeight: '140px' }}>
            {/* Col 1: New Leads (Level 3 Subtle Container Interaction) */}
            <div className="kanban-col hover-level-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>
                <span>New Leads</span>
                <span style={{ background: 'var(--surface-container)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '11px' }}>
                  {pipeline.newLeads.length}
                </span>
              </div>

              {pipeline.newLeads.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>
                  No new leads
                </div>
              ) : (
                pipeline.newLeads.slice(0, 2).map((lead: any) => (
                  <div
                    key={lead.id}
                    className="kanban-card hover-level-2"
                    onClick={() => router.push('/leads')}
                    style={{ cursor: 'pointer', padding: '0.75rem', marginBottom: '0.5rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#38bdf8', color: '#082f49', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                        {(lead.companyName || lead.firstName || 'L')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                        {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#4edea3', fontWeight: 700 }}>
                      Score: {lead.leadScore || 70}/100
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Col 2: Qualified (Level 3 Subtle Container Interaction) */}
            <div className="kanban-col hover-level-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>
                <span>Qualified</span>
                <span style={{ background: 'var(--surface-container)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '11px' }}>
                  {pipeline.qualifiedLeads.length}
                </span>
              </div>

              {pipeline.qualifiedLeads.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>
                  No qualified leads
                </div>
              ) : (
                pipeline.qualifiedLeads.slice(0, 2).map((lead: any) => (
                  <div
                    key={lead.id}
                    className="kanban-card hover-level-2"
                    onClick={() => router.push('/leads')}
                    style={{ cursor: 'pointer', padding: '0.75rem', marginBottom: '0.5rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#4edea3', color: '#003822', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                        {(lead.companyName || lead.firstName || 'Q')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                        {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                      Ready for Proposal
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Col 3: Proposal Stage (Level 3 Subtle Container Interaction) */}
            <div className="kanban-col hover-level-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>
                <span>Proposal Sent</span>
                <span style={{ background: 'var(--surface-container)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '11px' }}>
                  {pipeline.proposalDeals.length}
                </span>
              </div>

              {pipeline.proposalDeals.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>
                  No active proposals
                </div>
              ) : (
                pipeline.proposalDeals.slice(0, 2).map((deal: any) => (
                  <div
                    key={deal.id}
                    className="kanban-card hover-level-2"
                    onClick={() => router.push('/pipeline')}
                    style={{ cursor: 'pointer', padding: '0.75rem', marginBottom: '0.5rem' }}
                  >
                    <strong style={{ fontSize: '12px', color: '#fff', display: 'block' }}>{deal.title}</strong>
                    <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
                      ${Number(deal.value || 0).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Col 4: Negotiation (Level 3 Subtle Container Interaction) */}
            <div className="kanban-col hover-level-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '0.4rem' }}>
                <span>Negotiation</span>
                <span style={{ background: 'var(--surface-container)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '11px' }}>
                  {pipeline.negotiationDeals.length}
                </span>
              </div>

              {pipeline.negotiationDeals.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>
                  No deals in negotiation
                </div>
              ) : (
                pipeline.negotiationDeals.slice(0, 2).map((deal: any) => (
                  <div
                    key={deal.id}
                    className="kanban-card hover-level-2"
                    onClick={() => router.push('/pipeline')}
                    style={{ cursor: 'pointer', padding: '0.75rem', marginBottom: '0.5rem' }}
                  >
                    <strong style={{ fontSize: '12px', color: '#fff', display: 'block' }}>{deal.title}</strong>
                    <span style={{ fontSize: '12px', color: '#ffb95f', fontWeight: 700 }}>
                      ${Number(deal.value || 0).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Col 5: Closed Won (Level 3 Subtle Container Interaction) */}
            <div
              className="kanban-col hover-level-3"
              onClick={() => router.push('/pipeline')}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'rgba(78, 222, 163, 0.04)',
                border: '1px solid rgba(78, 222, 163, 0.15)',
              }}
              title="View Closed Deals in Pipeline"
            >
              <CheckCircle2 size={24} color="#4edea3" />
              <span style={{ fontSize: '12px', color: '#4edea3', textAlign: 'center', marginTop: '0.35rem', fontWeight: 700 }}>
                {metrics.closedWonCount} deals closed
              </span>
            </div>
          </div>
        </div>

        {/* 4. Middle Grid: Urgent Tasks & Real Recent Projects */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {/* Urgent Tasks */}
          <div className="glass-card hover-level-3" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Urgent Tasks ({urgentTasksList.length})
              </h3>
              <button
                onClick={() => router.push('/tasks')}
                style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View Sprint Board →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {urgentTasksList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.75rem 0' }}>No pending tasks in this workspace.</p>
                  <button onClick={() => router.push('/tasks')} className="btn btn-primary hover-level-1" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                    + Create First Task
                  </button>
                </div>
              ) : (
                urgentTasksList.map((task: any) => (
                  <div
                    key={task.id}
                    className="hover-level-2"
                    onClick={() => router.push('/tasks')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--surface-container-high)',
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id, task.status);
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', color: '#fff', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </p>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', background: task.priority === 'HIGH' ? 'rgba(255, 180, 171, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: task.priority === 'HIGH' ? '#ffb4ab' : '#38bdf8' }}>
                      {task.priority || 'MEDIUM'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real Recent Projects Table */}
          <div className="glass-card hover-level-3" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Recent Projects ({projectsList.length})
              </h3>
              <button
                onClick={() => router.push('/projects')}
                style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View Roadmaps →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {projectsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.75rem 0' }}>No active projects recorded yet.</p>
                  <button onClick={() => router.push('/projects')} className="btn btn-primary hover-level-1" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                    + Create First Project
                  </button>
                </div>
              ) : (
                projectsList.map((p: any) => (
                  <div
                    key={p.id}
                    className="hover-level-2"
                    onClick={() => router.push('/projects')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: '#fff', display: 'block' }}>{p.title}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{p.clientName}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>{p.progress || 0}%</span>
                      <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: p.status === 'ON TRACK' ? 'rgba(78, 222, 163, 0.15)' : 'rgba(255, 185, 95, 0.15)', color: p.status === 'ON TRACK' ? '#4edea3' : '#ffb95f' }}>
                        {p.status || 'ON TRACK'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
