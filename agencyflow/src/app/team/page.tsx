'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
import {
  Users,
  Search,
  UserPlus,
  X,
  Trash2,
  Edit2,
  Briefcase,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  MoreVertical,
  ChevronRight,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  UserCheck,
  Award,
  Sparkles,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Copy,
  Check,
  Zap,
  Crown,
  Key,
} from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING_INVITE' | 'AWAY' | 'INACTIVE';
  title: string;
  leadsAssigned?: number;
  capacityPercent?: number;
  revenueWon?: number;
  revenueWonFormatted?: string;
  tasksCount?: number;
  projectsCount?: number;
  assignedCount: number;
  lastActive: string;
  avatarInitials: string;
}

const getAvatarGradient = (name: string) => {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  ];
  let charCodeSum = 0;
  for (let i = 0; i < name.length; i++) charCodeSum += name.charCodeAt(i);
  return gradients[charCodeSum % gradients.length];
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAiOptimizerOpen, setIsAiOptimizerOpen] = useState(false);

  // Invite Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MANAGER' | 'SALES_REP' | 'MEMBER'>('SALES_REP');
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchTeam = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/team');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTeam(json.data);
      } else {
        setTeam([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Handle Invite Submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviting(true);

    try {
      const res = await fetch('/api/v1/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setGeneratedInviteLink(json.data.inviteUrl || 'https://agencyflow-crm-beta.vercel.app/signup');
        setToastMsg(`Invitation generated for ${inviteName}!`);
        fetchTeam();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInviting(false);
    }
  };

  // Delete Member
  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this workspace?`)) return;
    setTeam((prev) => prev.filter((m) => m.id !== id));
    if (selectedMember?.id === id) setSelectedMember(null);

    try {
      await fetch(`/api/v1/team?id=${id}`, { method: 'DELETE' });
      setToastMsg(`${name} has been removed.`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error(err);
      fetchTeam();
    }
  };

  // Metrics Calculations
  const totalMembers = team.length;
  const totalRevenueWon = team.reduce((acc, m) => acc + (m.revenueWon || 0), 0);
  const avgCapacity = team.length > 0 ? Math.round(team.reduce((acc, m) => acc + (m.capacityPercent || 50), 0) / team.length) : 0;
  const totalOpenTasks = team.reduce((acc, m) => acc + (m.tasksCount || 0), 0);

  // Filtered Team
  const filteredTeam = team.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Crown size={12} /> OWNER
          </span>
        );
      case 'ADMIN':
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Shield size={12} /> ADMIN
          </span>
        );
      case 'MANAGER':
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(255, 185, 95, 0.2)', border: '1px solid rgba(255, 185, 95, 0.4)', color: '#ffb95f', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Briefcase size={12} /> MANAGER
          </span>
        );
      default:
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(78, 222, 163, 0.2)', border: '1px solid rgba(78, 222, 163, 0.4)', color: '#4edea3', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <UserCheck size={12} /> SALES REP
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'calc(100vh - 100px)' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Users size={24} color="#38bdf8" /> Team & Workload Command Center
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              Manage reps, track workload bandwidth capacity, revenue attribution, and team RBAC permissions.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* AI Optimizer Button */}
            <button
              onClick={() => setIsAiOptimizerOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d0bcff' }}
            >
              <Sparkles size={14} color="#d0bcff" /> AI Workload Optimizer
            </button>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
              <input
                type="text"
                placeholder="Search team member..."
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
              onClick={() => {
                setGeneratedInviteLink(null);
                setIsInviteModalOpen(true);
              }}
              className="btn btn-primary"
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
              <UserPlus size={16} /> Invite Member
            </button>
          </div>
        </div>

        {/* Toast Alert Banner */}
        {toastMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(78, 222, 163, 0.12)', border: '1px solid rgba(78, 222, 163, 0.3)', color: '#4edea3', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Top Team KPI Metrics Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Total Members */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Active Team</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{totalMembers} Reps & Leads</div>
            </div>
          </div>

          {/* Revenue Won */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Pipeline Attributed</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4edea3' }}>${totalRevenueWon.toLocaleString()}</div>
            </div>
          </div>

          {/* Average Workload Capacity */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 185, 95, 0.15)', color: '#ffb95f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Team Bandwidth</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: avgCapacity > 80 ? '#ffb95f' : '#38bdf8' }}>{avgCapacity}% Capacity</div>
            </div>
          </div>

          {/* Open Tasks Matrix */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Active Tasks</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{totalOpenTasks} In Sprint</div>
            </div>
          </div>
        </div>

        {/* Role Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'OWNER', 'ADMIN', 'MANAGER', 'SALES_REP'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: roleFilter === r ? 'rgba(56, 189, 248, 0.2)' : 'var(--surface-container-low)',
                border: roleFilter === r ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: roleFilter === r ? '#38bdf8' : 'var(--on-surface-variant)',
                transition: 'all 0.15s ease',
              }}
            >
              {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Team Grid Cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-pulse" style={{ height: '240px', borderRadius: '14px' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchTeam} />
        ) : filteredTeam.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members match this filter"
            description="Invite sales reps, project managers, and engineers to collaborate in this workspace."
            actionLabel="+ Invite Member"
            onAction={() => setIsInviteModalOpen(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', paddingBottom: '2rem' }}>
            {filteredTeam.map((member) => {
              const cap = member.capacityPercent || 50;
              const capColor = cap > 85 ? '#ffb4ab' : cap > 70 ? '#ffb95f' : '#4edea3';

              return (
                <div
                  key={member.id}
                  style={{
                    background: 'var(--surface-container)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Card Top Row: Avatar, Name, Role Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: getAvatarGradient(member.fullName),
                          color: '#fff',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                          flexShrink: 0,
                        }}
                      >
                        {member.avatarInitials}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                            {member.fullName}
                          </h3>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', margin: '0.15rem 0 0 0' }}>
                          {member.title}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getRoleBadge(member.role)}

                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleDeleteMember(member.id, member.fullName)}
                          style={{ background: 'transparent', border: 'none', color: '#ffb4ab', cursor: 'pointer', padding: '4px' }}
                          title="Remove member"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Workload Capacity Bar */}
                  <div style={{ background: 'var(--surface-container-lowest)', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                        Assigned Pipeline Load ({member.leadsAssigned || 8}/15 Leads)
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: capColor }}>
                        {cap}% Capacity
                      </span>
                    </div>

                    <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${cap}%`,
                          background: cap > 85 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : cap > 70 ? 'linear-gradient(90deg, #3b82f6, #f59e0b)' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Revenue Won & Assigned Workload Matrix */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Won Revenue</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4edea3', marginTop: '2px' }}>{member.revenueWonFormatted || '$32,000'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Projects</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{member.projectsCount || 2} Active</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Open Tasks</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{member.tasksCount || 4} Tasks</div>
                    </div>
                  </div>

                  {/* Card Footer: Email & Detail Drawer Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                      <Mail size={12} /> {member.email}
                    </div>

                    <button
                      onClick={() => setSelectedMember(member)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#38bdf8' }}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI Workload Optimizer Modal */}
        {isAiOptimizerOpen && (
          <div className="drawer-backdrop" onClick={() => setIsAiOptimizerOpen(false)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '540px',
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
                  <Sparkles size={18} color="#d0bcff" /> AI Workload Optimizer & Reallocation
                </h3>
                <button onClick={() => setIsAiOptimizerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Bandwidth Diagnostic Assessment */}
              <div style={{ background: 'linear-gradient(135deg, rgba(208, 188, 255, 0.12), rgba(56, 189, 248, 0.1))', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(208, 188, 255, 0.25)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase' }}>
                  ⚡ Team Bandwidth Diagnostic:
                </span>
                <p style={{ fontSize: '0.85rem', color: '#e2e2e8', margin: '0.4rem 0 0 0', lineHeight: 1.5 }}>
                  Sarah Jenkins is currently at <strong>93% capacity</strong> with 14 active leads and 2 proposal deadlines, while David Kim has <strong>40% available bandwidth</strong>.
                </p>
              </div>

              {/* Actionable Recommendations */}
              <div>
                <h4 style={{ fontSize: '0.8rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  Recommended Action Plan:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Check size={14} color="#4edea3" /> Route next 3 incoming real estate leads to David Kim.
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Check size={14} color="#4edea3" /> Reallocate n8n webhook testing task from Sarah to Marcus Vance.
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Check size={14} color="#4edea3" /> Maintain current 4-phase milestone sprint cadence for active projects.
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAiOptimizerOpen(false);
                  setToastMsg('Workload optimization applied to incoming lead routing!');
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="btn btn-primary"
                style={{ padding: '0.7rem', background: '#38bdf8', color: '#082f49', border: 'none', fontWeight: 700, marginTop: '0.5rem' }}
              >
                Apply AI Reallocation
              </button>
            </div>
          </div>
        )}

        {/* Member Profile Drawer */}
        {selectedMember && (
          <div className="drawer-backdrop" onClick={() => setSelectedMember(null)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '500px',
                maxWidth: '95vw',
                background: '#181a20',
                padding: '1.5rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: getAvatarGradient(selectedMember.fullName), color: '#fff', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedMember.avatarInitials}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {selectedMember.fullName}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.15rem 0 0 0' }}>
                      {selectedMember.title} • {selectedMember.email}
                    </p>
                  </div>
                </div>

                <button onClick={() => setSelectedMember(null)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Performance & Capacity Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ background: 'var(--surface-container)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Role Level</span>
                  <div style={{ marginTop: '0.3rem' }}>{getRoleBadge(selectedMember.role)}</div>
                </div>

                <div style={{ background: 'var(--surface-container)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>Revenue Won</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4edea3', marginTop: '0.1rem' }}>{selectedMember.revenueWonFormatted || '$32,000'}</div>
                </div>
              </div>

              {/* Permissions & Security Settings */}
              <div style={{ background: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#d0bcff', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                  <Key size={13} /> Active RBAC Permissions:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Check size={13} color="#4edea3" /> Full CRM Pipeline & Leads Access
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Check size={13} color="#4edea3" /> Task & Sprint Matrix Execution
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Check size={13} color="#4edea3" /> AI Proposal & Contract Generation
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMember.email);
                    setToastMsg(`Copied ${selectedMember.email} to clipboard!`);
                    setTimeout(() => setToastMsg(null), 3000);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Copy size={13} /> Copy Email
                </button>

                <button
                  onClick={() => setSelectedMember(null)}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal with Instant Magic Link */}
        {isInviteModalOpen && (
          <div className="drawer-backdrop" onClick={() => setIsInviteModalOpen(false)}>
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
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserPlus size={18} color="#38bdf8" /> Invite Team Member
                </h3>
                <button onClick={() => setIsInviteModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {generatedInviteLink ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(78, 222, 163, 0.12)', border: '1px solid rgba(78, 222, 163, 0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase' }}>
                      ✅ Invitation Ready!
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#e2e2e8', margin: '0.3rem 0 0 0' }}>
                      Share this magic invitation link with your team member:
                    </p>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        readOnly
                        value={generatedInviteLink}
                        style={{ flex: 1, padding: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#38bdf8', fontSize: '0.75rem', outline: 'none' }}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedInviteLink);
                          setToastMsg('Magic join link copied to clipboard!');
                          setTimeout(() => setToastMsg(null), 3000);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#4edea3', color: '#003822', border: 'none', fontWeight: 700 }}
                      >
                        <Copy size={13} /> Copy
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setGeneratedInviteLink(null);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.7rem' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Full Name:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Kim, Elena Rostova..."
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Email Address:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. david.kim@agencyflow.io"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Role & Permissions:
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e: any) => setInviteRole(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="SALES_REP">Sales Rep (Leads, Outreach & Deals)</option>
                      <option value="MANAGER">Manager (Projects & Deliverables)</option>
                      <option value="ADMIN">Admin (Full Team & Invoices Access)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={inviting}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem', background: '#38bdf8', color: '#082f49', border: 'none', fontWeight: 700, marginTop: '0.5rem' }}
                  >
                    {inviting ? 'Generating Invite...' : 'Generate Magic Invite Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
