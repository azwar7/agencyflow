'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/v1/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      setError('Unable to load latest dashboard data.');
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

  // Handle Task Checkbox Toggle with Optimistic UI & Database Persistence
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (updatingTaskId === taskId) return;
    setUpdatingTaskId(taskId);

    const nextStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';

    // Optimistically update local state
    setData((prev: any) => {
      if (!prev || !prev.urgentTasks) return prev;
      return {
        ...prev,
        urgentTasks: prev.urgentTasks.map((t: any) =>
          t.id === taskId ? { ...t, status: nextStatus } : t
        ),
      };
    });

    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update task status');
      }

      // Re-fetch to synchronize state
      fetchDashboard();
    } catch (err: any) {
      console.error('Task update failed:', err);
      // Revert optimistic change
      setData((prev: any) => {
        if (!prev || !prev.urgentTasks) return prev;
        return {
          ...prev,
          urgentTasks: prev.urgentTasks.map((t: any) =>
            t.id === taskId ? { ...t, status: currentStatus } : t
          ),
        };
      });
      alert(err.message || 'Unable to update task. Please try again.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Extract pipeline leads or fallback to initial seeded leads
  const urgentTasksList = data?.urgentTasks && data.urgentTasks.length > 0
    ? data.urgentTasks
    : [
        {
          id: 'TSK-001',
          title: 'Send MSA proposal - Michael Chang',
          dueDate: 'Due today',
          priority: 'HIGH',
          status: 'PENDING',
          leadId: 'Michael Chang',
        },
        {
          id: 'TSK-002',
          title: 'Follow up on DTC proposal - Rachel Green',
          dueDate: 'Due tomorrow',
          priority: 'MED',
          status: 'PENDING',
          leadId: 'Rachel Green',
        },
        {
          id: 'TSK-003',
          title: 'Prepare client presentation - Sarah Jenkins',
          dueDate: 'Due Friday',
          priority: 'MED',
          status: 'PENDING',
          leadId: 'Sarah Jenkins',
        },
      ];

  const recentActivitiesList = data?.recentActivities && data.recentActivities.length > 0
    ? data.recentActivities
    : [
        {
          id: 'act-1',
          user: 'Alex Rivera',
          userColor: 'var(--primary-fixed-dim)',
          icon: 'sync_alt',
          iconBg: 'var(--primary)',
          iconColor: 'var(--on-primary)',
          text: 'moved TechFlow Cloud Portal to Contract Negotiation',
          time: '12m ago',
          target: '/pipeline',
        },
        {
          id: 'act-2',
          user: 'Sarah Jenkins',
          userColor: 'var(--secondary)',
          icon: 'monetization_on',
          iconBg: 'var(--secondary)',
          iconColor: 'var(--on-secondary)',
          text: 'closed $75k Retainer deal',
          time: '1h ago',
          target: '/pipeline',
        },
        {
          id: 'act-3',
          user: 'Marcus Vance',
          userColor: 'var(--on-surface)',
          icon: 'call',
          iconBg: 'var(--surface-container-highest)',
          iconColor: 'var(--on-surface)',
          text: 'logged discovery call with Michael Chang',
          time: '3h ago',
          target: '/leads?leadId=Michael Chang',
        },
      ];

  // Revenue chart data series (Current Month vs Previous Month)
  const chartPoints = [
    { label: 'Week 1', current: 8500, previous: 7200, cx: 80, cyCurrent: 140, cyPrev: 150 },
    { label: 'Week 2', current: 18200, previous: 15400, cx: 270, cyCurrent: 105, cyPrev: 120 },
    { label: 'Week 3', current: 31400, previous: 26800, cx: 460, cyCurrent: 60, cyPrev: 80 },
    { label: 'Week 4', current: 42600, previous: 36040, cx: 650, cyCurrent: 25, cyPrev: 50 },
  ];

  // Top Clients list from server or fallback real seeded accounts
  const topClientsList = data?.topClients && data.topClients.length > 0
    ? data.topClients
    : [
        { name: 'TechFlow Systems', totalValue: 123500, projectsCount: 2 },
        { name: 'Summit Global Logistics', totalValue: 62000, projectsCount: 1 },
        { name: 'Elevate Creative Co', totalValue: 46500, projectsCount: 2 },
        { name: 'Nexus Cloud Infrastructure', totalValue: 45000, projectsCount: 1 },
      ];

  // Pipeline funnel stage breakdown
  const stageBreakdown = [
    { name: 'New Leads', count: data?.stageCounts?.newLeads ?? 4, width: '100%', color: '#c0c1ff', status: 'NEW' },
    { name: 'Qualified', count: data?.stageCounts?.qualified ?? 3, width: '75%', color: '#4edea3', status: 'QUALIFIED' },
    { name: 'Proposal Sent', count: data?.stageCounts?.proposal ?? 2, width: '50%', color: '#ffb95f', status: 'PROPOSAL' },
    { name: 'Negotiation', count: data?.stageCounts?.negotiation ?? 1, width: '25%', color: '#ffb4ab', status: 'NEGOTIATION' },
    { name: 'Closed Won', count: data?.stageCounts?.closedWon ?? 2, width: '50%', color: '#6ffbbe', status: 'CONVERTED' },
  ];

  return (
    <AppShell>
      <div className="page-content" style={{ position: 'relative', zIndex: 0 }}>
        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '25%',
            width: '500px',
            height: '500px',
            background: 'rgba(192, 193, 255, 0.05)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        {/* 1. Welcome Header & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--on-surface)' }}>
              Good morning, Alex
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
              Here's what's happening across your agency today.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/clients')} className="btn btn-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                person_add
              </span>
              New Client
            </button>

            <button onClick={() => router.push('/projects')} className="btn btn-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                account_tree
              </span>
              New Project
            </button>

            <button onClick={() => router.push('/proposals')} className="btn btn-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                description
              </span>
              Create Proposal
            </button>

            <button
              onClick={() => window.dispatchEvent(new Event('agencyflow-open-new-lead'))}
              className="btn btn-primary"
              style={{ marginLeft: '0.25rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add
              </span>
              New Lead
            </button>
          </div>
        </div>

        {/* 2. KPI Summary Cards */}
        <div className="kpi-grid">
          {/* Card 1: Pipeline Value */}
          <div
            className="kpi-card"
            onClick={() => router.push('/pipeline')}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
            title="View Pipeline"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                PIPELINE VALUE
              </span>
              <div style={{ background: 'rgba(0, 165, 114, 0.2)', color: 'var(--secondary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  trending_up
                </span>
                12.4%
              </div>
            </div>
            <div className="kpi-metric">${data?.metrics?.totalPipelineValue?.toLocaleString() || '138,500'}</div>
          </div>

          {/* Card 2: Active Projects */}
          <div
            className="kpi-card"
            onClick={() => router.push('/projects')}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
            title="View Projects"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ACTIVE PROJECTS
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>
                account_tree
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="kpi-metric" style={{ marginTop: 0 }}>
                {data?.metrics?.activeDealsCount || '12'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--tertiary)' }}>3 due this week</span>
            </div>
          </div>

          {/* Card 3: Outstanding Invoices */}
          <div
            className="kpi-card"
            onClick={() => router.push('/invoices')}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
            title="View Invoices"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                OUTSTANDING
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>
                receipt_long
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span className="kpi-metric" style={{ marginTop: 0 }}>
                $27,850
              </span>
              <span style={{ fontSize: '13px', color: 'var(--error)' }}>4 awaiting</span>
            </div>
          </div>

          {/* Card 4: Monthly Revenue */}
          <div
            className="kpi-card"
            onClick={() => router.push('/analytics')}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
            title="View Revenue Analytics"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                MONTHLY REV
              </span>
              <div style={{ background: 'rgba(0, 165, 114, 0.2)', color: 'var(--secondary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  trending_up
                </span>
                18.2%
              </div>
            </div>
            <div className="kpi-metric">${data?.metrics?.wonRevenue?.toLocaleString() || '42,600'}</div>
          </div>

          {/* Card 5: Conversion Win Rate */}
          <div
            className="kpi-card"
            onClick={() => router.push('/analytics')}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
            title="View Conversion Analytics"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                CONVERSION
              </span>
              <div style={{ background: 'rgba(0, 165, 114, 0.2)', color: 'var(--secondary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  trending_up
                </span>
                3.1%
              </div>
            </div>
            <div className="kpi-metric">{data?.metrics?.winRate || '24.8'}%</div>
          </div>
        </div>

        {/* 3. Active Pipeline Overview Snippet */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--on-surface)' }}>
              Active Pipeline
            </h2>
            <button
              onClick={() => router.push('/pipeline')}
              style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View Full Pipeline →
            </button>
          </div>

          <div className="kanban-row">
            {/* Col 1: New Leads */}
            <div className="kanban-col">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                <span>New Leads</span>
                <span style={{ background: 'var(--surface-container)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '11px' }}>3</span>
              </div>
              <div
                className="kanban-card"
                onClick={() => router.push('/leads?leadId=ABC Digital')}
                style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                title="Open ABC Digital in Leads"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                    A
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>ABC Digital</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Website Redesign</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>$8,500</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/leads?leadId=ABC Digital');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Open ABC Digital details"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Col 2: Qualified */}
            <div className="kanban-col">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                <span>Qualified</span>
                <span style={{ background: 'var(--surface-container)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '11px' }}>1</span>
              </div>
              <div
                className="kanban-card"
                onClick={() => router.push('/leads?leadId=Sarah Jenkins')}
                style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                title="Open Sarah Jenkins in Leads"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--secondary)', color: 'var(--on-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                    S
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>Sarah Jenkins</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Marketing Automation</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>$12,000</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/leads?leadId=Sarah Jenkins');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Open Sarah Jenkins details"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Col 3: Drop Lead Target Area */}
            <div
              className="kanban-col"
              style={{
                border: '1px dashed rgba(144, 143, 160, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--outline)' }}>Drop lead here</span>
            </div>

            {/* Col 4: Negotiation */}
            <div className="kanban-col">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                <span>Negotiation</span>
                <span style={{ background: 'var(--surface-container)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '11px' }}>1</span>
              </div>
              <div
                className="kanban-card"
                onClick={() => router.push('/leads?leadId=TechFlow')}
                style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                title="Open TechFlow Inc in Leads"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--tertiary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                    T
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>TechFlow Inc</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>Enterprise Portal</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--tertiary)', fontWeight: 700 }}>$45,000</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/leads?leadId=TechFlow');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Open TechFlow details"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--tertiary)' }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Col 5: Closed Deals Area */}
            <div
              className="kanban-col"
              onClick={() => router.push('/pipeline')}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.85,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease, background 0.15s ease',
              }}
              title="View Closed Deals in Pipeline"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--secondary)' }}>
                verified
              </span>
              <span style={{ fontSize: '12px', color: 'var(--secondary)', textAlign: 'center', marginTop: '0.25rem', fontWeight: 600 }}>
                {data?.metrics?.closedWonCount ? `${data.metrics.closedWonCount} deals closed this month` : '4 deals closed this month'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Middle Grid: Tasks & Live Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--spacing-gutter)' }}>
          
          {/* Urgent Tasks */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)' }}>Urgent Tasks</h3>
              <button
                onClick={() => router.push('/tasks')}
                style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {urgentTasksList.map((task: any) => {
                const isCompleted = task.status === 'COMPLETED';
                const isUpdating = updatingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/tasks?taskId=${encodeURIComponent(task.id)}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-DEFAULT)',
                      background: 'var(--surface-container-high)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      opacity: isUpdating ? 0.6 : 1,
                    }}
                  >
                    {/* Interactive Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id, task.status);
                      }}
                      disabled={isUpdating}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: isCompleted ? 'none' : '1px solid var(--outline)',
                        background: isCompleted ? 'var(--secondary)' : 'transparent',
                        color: isCompleted ? 'var(--on-secondary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isUpdating ? 'wait' : 'pointer',
                        flexShrink: 0,
                      }}
                      title={isCompleted ? 'Mark task pending' : 'Mark task completed'}
                      aria-label="Toggle task status"
                    >
                      {isCompleted && (
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          check
                        </span>
                      )}
                    </button>

                    {/* Task Title & Due Date */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          color: isCompleted ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                          fontWeight: 500,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.title}
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                        {typeof task.dueDate === 'string' && task.dueDate.includes('T')
                          ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : task.dueDate || 'Due soon'}
                      </span>
                    </div>

                    {/* Priority Badge */}
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          task.priority === 'HIGH'
                            ? 'rgba(255, 180, 171, 0.15)'
                            : 'rgba(255, 185, 95, 0.15)',
                        color: task.priority === 'HIGH' ? 'var(--error)' : 'var(--tertiary)',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {task.priority || 'MED'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)' }}>Live Activity</h3>
              <button
                onClick={() => router.push('/analytics')}
                style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View History
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentActivitiesList.map((act: any, idx: number) => {
                const targetUrl = act.target || (act.leadId ? `/leads?leadId=${act.leadId}` : '/pipeline');
                const userName = act.user?.fullName || act.user || 'Team Member';
                const actText = act.content || act.text || 'performed an update';
                const timeAgo = act.createdAt
                  ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : act.time || 'recently';

                return (
                  <div
                    key={act.id || idx}
                    onClick={() => router.push(targetUrl)}
                    style={{
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'flex-start',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: act.iconBg || 'var(--primary)',
                        color: act.iconColor || 'var(--on-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                        {act.icon || 'sync_alt'}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', color: 'var(--on-surface)', margin: 0, lineHeight: 1.4 }}>
                        <strong style={{ color: act.userColor || 'var(--primary)' }}>{userName} </strong>
                        {actText}
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{timeAgo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Recent Projects Table */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)' }}>Recent Projects</h3>
            <button
              onClick={() => router.push('/projects')}
              style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All Projects
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>PROJECT NAME</th>
                <th>CLIENT</th>
                <th>PROGRESS</th>
                <th>DUE DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr
                onClick={() => router.push('/projects')}
                style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
              >
                <td style={{ fontWeight: 600 }}>
                  TechFlow Cloud Portal
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 400 }}>4 team members</span>
                </td>
                <td>TechFlow Inc.</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '120px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--surface-container-highest)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: '78%', height: '100%', background: 'var(--primary)', borderRadius: '9999px' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>78%</span>
                  </div>
                </td>
                <td>Aug 24</td>
                <td>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(0, 165, 114, 0.2)', color: 'var(--secondary)', fontSize: '11px', fontWeight: 600 }}>
                    On Track
                  </span>
                </td>
              </tr>
              <tr
                onClick={() => router.push('/projects')}
                style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
              >
                <td style={{ fontWeight: 600 }}>
                  Acme Brand Redesign
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 400 }}>3 team members</span>
                </td>
                <td>Acme Digital</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '120px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--surface-container-highest)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: '54%', height: '100%', background: 'var(--error)', borderRadius: '9999px' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>54%</span>
                  </div>
                </td>
                <td>Sep 02</td>
                <td>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 180, 171, 0.15)', color: 'var(--error)', fontSize: '11px', fontWeight: 600 }}>
                    At Risk
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. ENHANCED ANALYTICS SECTION (2x2 Cohesive BI Grid) */}
        
        {/* ROW 1: Revenue Overview Chart & Performance Snapshot Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--spacing-gutter)' }}>
          
          {/* Revenue Overview Chart Card */}
          <div
            className="glass-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Revenue Overview</h3>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Current vs Previous month performance</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '3px', background: 'var(--primary)', borderRadius: '2px' }} />
                  <span style={{ color: 'var(--on-surface)', fontWeight: 600 }}>Current (${data?.metrics?.wonRevenue?.toLocaleString() || '42,600'})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '3px', background: '#4edea3', borderRadius: '2px', opacity: 0.8 }} />
                  <span style={{ color: 'var(--on-surface-variant)' }}>Prev ($36,040)</span>
                </div>
                <span style={{ background: 'rgba(0, 165, 114, 0.2)', color: 'var(--secondary)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                  +18.2%
                </span>
              </div>
            </div>

            {/* SVG Dual-Series Chart */}
            <div style={{ position: 'relative', height: '180px', width: '100%', marginTop: '0.5rem' }}>
              {/* Y-Axis Grid Lines & Values */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.15 }}>
                {['$60k', '$45k', '$30k', '$15k', '$0'].map((label, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '10px', width: '32px', color: 'var(--on-surface-variant)' }}>{label}</span>
                    <div style={{ flex: 1, height: '1px', background: '#fff' }} />
                  </div>
                ))}
              </div>

              {/* Chart SVG */}
              <svg viewBox="0 0 740 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="currentGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c0c1ff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#c0c1ff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Area Fill for Current Month */}
                <path d="M80,140 Q270,105 460,60 T650,25 L650,160 L80,160 Z" fill="url(#currentGlow)" />

                {/* Previous Month Line (Green Dashed) */}
                <path d="M80,150 Q270,120 460,80 T650,50" fill="none" stroke="#4edea3" strokeWidth="2" strokeDasharray="5,5" opacity="0.85" />

                {/* Current Month Line (Purple Solid) */}
                <path d="M80,140 Q270,105 460,60 T650,25" fill="none" stroke="var(--primary)" strokeWidth="3" />

                {/* Data Points */}
                {chartPoints.map((pt, idx) => (
                  <g key={idx} onMouseEnter={() => setHoveredChartIndex(idx)} onMouseLeave={() => setHoveredChartIndex(null)} style={{ cursor: 'pointer' }}>
                    <circle cx={pt.cx} cy={pt.cyCurrent} r={hoveredChartIndex === idx ? '6' : '4'} fill="var(--primary)" stroke="#fff" strokeWidth="2" />
                    <circle cx={pt.cx} cy={pt.cyPrev} r="3.5" fill="#4edea3" stroke="#1c1f2a" strokeWidth="1" />
                  </g>
                ))}
              </svg>

              {/* Interactive Tooltip Overlay */}
              {hoveredChartIndex !== null && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${chartPoints[hoveredChartIndex].cyCurrent - 45}px`,
                    left: `${(hoveredChartIndex / 3) * 75 + 10}%`,
                    background: '#1c1f2a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface)' }}>
                    {chartPoints[hoveredChartIndex].label} Revenue
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                    Current: ${chartPoints[hoveredChartIndex].current.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4edea3' }}>
                    Previous: ${chartPoints[hoveredChartIndex].previous.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '2.5rem', paddingRight: '2rem', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>

          {/* Performance Snapshot Panel Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Performance Snapshot</h3>
              <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Agency business intelligence metrics</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flex: 1 }}>
              {/* Metric 1: Profitability */}
              <div style={{ background: 'var(--surface-container-high)', padding: '0.85rem', borderRadius: 'var(--radius-DEFAULT)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Profitability</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--secondary)' }}>
                    pie_chart
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.3rem 0' }}>
                  {data?.metrics?.projectProfitability || '64.2'}%
                </div>
                <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>+3.4% vs last Qtr</span>
              </div>

              {/* Metric 2: Retention */}
              <div style={{ background: 'var(--surface-container-high)', padding: '0.85rem', borderRadius: 'var(--radius-DEFAULT)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Client Retention</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>
                    verified_user
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.3rem 0' }}>
                  {data?.metrics?.clientRetention || '92.5'}%
                </div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>+1.2% YoY</span>
              </div>

              {/* Metric 3: Avg Deal Value */}
              <div style={{ background: 'var(--surface-container-high)', padding: '0.85rem', borderRadius: 'var(--radius-DEFAULT)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Avg Deal Value</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--tertiary)' }}>
                    payments
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.3rem 0' }}>
                  ${data?.metrics?.avgDealValue ? data.metrics.avgDealValue.toLocaleString() : '34,625'}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Contract baseline</span>
              </div>

              {/* Metric 4: MRR */}
              <div style={{ background: 'var(--surface-container-high)', padding: '0.85rem', borderRadius: 'var(--radius-DEFAULT)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Monthly Rec. Rev</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--secondary)' }}>
                    stacked_bar_chart
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.3rem 0' }}>
                  ${data?.metrics?.mrr ? data.metrics.mrr.toLocaleString() : '42,600'}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>+18.2% growth</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Pipeline Conversion & Top Clients */}
        <div style={{ display: 'grid', gridTemplateColumns: '6fr 6fr', gap: 'var(--spacing-gutter)', marginBottom: '1rem' }}>
          
          {/* Pipeline Conversion Analytics Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Pipeline Conversion</h3>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Lead progression to Closed Won</span>
              </div>
              <span style={{ padding: '0.25rem 0.6rem', borderRadius: '9999px', background: 'rgba(78, 222, 163, 0.15)', color: 'var(--secondary)', fontSize: '11px', fontWeight: 700 }}>
                {data?.metrics?.winRate || '24.8'}% Lead-to-Won
              </span>
            </div>

            {/* Funnel Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {stageBreakdown.map((stg, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/leads?status=${stg.status}`)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  title={`View ${stg.name} leads`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--on-surface)' }}>{stg.name}</span>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{stg.count} leads</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--surface-container-highest)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: stg.width, height: '100%', background: stg.color, borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clients Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Top Clients</h3>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Highest revenue client accounts</span>
              </div>
              <button
                onClick={() => router.push('/clients')}
                style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View All Clients →
              </button>
            </div>

            {/* Client Ranking List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topClientsList.map((client: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => router.push('/clients')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--surface-container-high)',
                    borderRadius: 'var(--radius-DEFAULT)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-container-high)')}
                  title={`View ${client.name} details`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--primary)' : idx === 1 ? 'var(--secondary)' : 'var(--surface-container-highest)',
                        color: idx === 0 ? 'var(--on-primary)' : idx === 1 ? 'var(--on-secondary)' : 'var(--on-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                        {client.projectsCount || 1} active {client.projectsCount === 1 ? 'project' : 'projects'}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)', flexShrink: 0 }}>
                    ${client.totalValue ? client.totalValue.toLocaleString() : '28,000'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
