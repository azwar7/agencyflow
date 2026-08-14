'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
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
} from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING_INVITE' | 'AWAY' | 'INACTIVE';
  title: string;
  assignedCount: number; // Out of max e.g. 20
  lastActive: string;
  avatarInitials: string;
}

// Helper to generate consistent avatar gradient based on user name string
const getAvatarGradient = (name: string) => {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo to Purple
    'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue to Cyan
    'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald to Green
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber to Orange
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Pink to Purple
    'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // Violet to Indigo
  ];
  let charCodeSum = 0;
  for (let i = 0; i < name.length; i++) charCodeSum += name.charCodeAt(i);
  return gradients[charCodeSum % gradients.length];
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'assigned'>('name');

  // Modals & Drawers
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form States
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('SALES_REP');
  const [editRoleValue, setEditRoleValue] = useState<TeamMember['role']>('MEMBER');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/team');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTeam(json.data);
      } else {
        setTeam([]);
      }
    } catch {
      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    try {
      await fetch('/api/v1/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      fetchTeam();
    } catch (err) {
      console.error(err);
    }

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteTitle('');
  };

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setTeam((prev) =>
      prev.map((m) => (m.id === selectedMember.id ? { ...m, role: editRoleValue } : m))
    );
    setSelectedMember({ ...selectedMember, role: editRoleValue });
    setIsEditRoleModalOpen(false);
    setActiveMenuId(null);
  };

  const confirmDeleteMember = () => {
    if (!memberToDelete) return;
    setTeam((prev) => prev.filter((m) => m.id !== memberToDelete.id));
    if (selectedMember?.id === memberToDelete.id) setSelectedMember(null);
    setMemberToDelete(null);
    setActiveMenuId(null);
  };

  // Filter & Sort Members
  const filteredMembers = team
    .filter((m) => {
      const matchesSearch =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'assigned') return b.assignedCount - a.assignedCount;
      return a.role.localeCompare(b.role);
    });

  // Standardized Role Badges
  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return (
          <span
            style={{
              padding: '0.22rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(192, 193, 255, 0.14)',
              border: '1px solid rgba(192, 193, 255, 0.3)',
              color: '#c0c1ff',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            OWNER
          </span>
        );
      case 'ADMIN':
        return (
          <span
            style={{
              padding: '0.22rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(255, 185, 95, 0.14)',
              border: '1px solid rgba(255, 185, 95, 0.3)',
              color: '#ffb95f',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ADMIN
          </span>
        );
      case 'MANAGER':
        return (
          <span
            style={{
              padding: '0.22rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(78, 222, 163, 0.14)',
              border: '1px solid rgba(78, 222, 163, 0.3)',
              color: '#4edea3',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            MANAGER
          </span>
        );
      case 'SALES_REP':
        return (
          <span
            style={{
              padding: '0.22rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(144, 146, 254, 0.14)',
              border: '1px solid rgba(144, 146, 254, 0.3)',
              color: '#9092fe',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            SALES REP
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '0.22rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(160, 165, 181, 0.14)',
              border: '1px solid rgba(160, 165, 181, 0.25)',
              color: '#a0a5b5',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            MEMBER
          </span>
        );
    }
  };

  // Status Indicators with Glow Effects
  const getStatusBadge = (status: TeamMember['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#4edea3', fontWeight: 600 }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#4edea3',
                boxShadow: '0 0 8px rgba(78, 222, 163, 0.8)',
              }}
            />{' '}
            Active
          </span>
        );
      case 'AWAY':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#ffd500', fontWeight: 600 }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#ffd500',
                boxShadow: '0 0 8px rgba(255, 213, 0, 0.6)',
              }}
            />{' '}
            Away
          </span>
        );
      case 'PENDING_INVITE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#ffb95f', fontWeight: 600 }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#ffb95f',
                boxShadow: '0 0 8px rgba(255, 185, 95, 0.6)',
              }}
            />{' '}
            Pending Invite
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#8e919e', fontWeight: 600 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#8e919e' }} /> Offline
          </span>
        );
    }
  };

  // KPI Metrics
  const totalMembers = team.length;
  const activeMembers = team.filter((m) => m.status === 'ACTIVE').length;
  const adminMembers = team.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length;
  const pendingInvites = team.filter((m) => m.status === 'PENDING_INVITE').length;

  const activeFilterCount = (roleFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        
        {/* 1. Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              TEAM MANAGEMENT
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: '0.1rem 0 0 0' }}>
              Team Directory
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
              Manage members, roles, permissions, and workspace access.
            </p>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '0.5rem', boxShadow: '0 4px 14px rgba(128, 131, 255, 0.3)' }}
          >
            <UserPlus size={17} /> Invite Member
          </button>
        </div>

        {/* 2. Redesigned Stat Cards Row (Distinct Cards with Tinted Low-Opacity Backgrounds) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          
          {/* Stat Card 1: Total Members */}
          <div
            className="glass-card hover:border-primary/40"
            style={{
              padding: '0.95rem 1.15rem',
              borderRadius: '0.75rem',
              background: 'rgba(192, 193, 255, 0.06)',
              border: '1px solid rgba(192, 193, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                TOTAL MEMBERS
              </p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.2rem' }}>
                {totalMembers}
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--primary)', fontWeight: 600 }}>Registered accounts</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '0.6rem', background: 'rgba(192, 193, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
              <Users size={20} />
            </div>
          </div>

          {/* Stat Card 2: Active Workers */}
          <div
            className="glass-card hover:border-secondary/40"
            style={{
              padding: '0.95rem 1.15rem',
              borderRadius: '0.75rem',
              background: 'rgba(78, 222, 163, 0.06)',
              border: '1px solid rgba(78, 222, 163, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                ACTIVE WORKERS
              </p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4edea3', marginTop: '0.2rem' }}>
                {activeMembers}
              </div>
              <span style={{ fontSize: '0.725rem', color: '#4edea3', fontWeight: 600 }}>Active in workspace</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '0.6rem', background: 'rgba(78, 222, 163, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4edea3', flexShrink: 0 }}>
              <UserCheck size={20} />
            </div>
          </div>

          {/* Stat Card 3: Admins & Owners */}
          <div
            className="glass-card hover:border-tertiary/40"
            style={{
              padding: '0.95rem 1.15rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 185, 95, 0.06)',
              border: '1px solid rgba(255, 185, 95, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                ADMINS & OWNERS
              </p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffb95f', marginTop: '0.2rem' }}>
                {adminMembers}
              </div>
              <span style={{ fontSize: '0.725rem', color: '#ffb95f', fontWeight: 600 }}>Full workspace privileges</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '0.6rem', background: 'rgba(255, 185, 95, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb95f', flexShrink: 0 }}>
              <Shield size={20} />
            </div>
          </div>

          {/* Stat Card 4: Pending Invites */}
          <div
            className="glass-card hover:border-error/40"
            style={{
              padding: '0.95rem 1.15rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 180, 171, 0.06)',
              border: '1px solid rgba(255, 180, 171, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                PENDING INVITES
              </p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffb4ab', marginTop: '0.2rem' }}>
                {pendingInvites}
              </div>
              <span style={{ fontSize: '0.725rem', color: '#ffb4ab', fontWeight: 600 }}>Awaiting confirmation</span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '0.6rem', background: 'rgba(255, 180, 171, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb4ab', flexShrink: 0 }}>
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* 3. Improved Filter & Search Bar with Clear Separation */}
        <div className="glass-card" style={{ padding: '0.85rem 1.15rem', borderRadius: '0.75rem', background: '#191c26', border: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
          {/* Search Box Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '260px', maxWidth: '440px', background: 'var(--surface-container-high)', padding: '0.5rem 0.9rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Search size={15} color="var(--on-surface-variant)" />
            <input
              type="text"
              placeholder="Search team members by name, email, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '0.825rem', outline: 'none', width: '100%' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Distinct Filter & Sort Controls Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {activeFilterCount > 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(192, 193, 255, 0.15)', color: 'var(--primary)', border: '1px solid rgba(192, 193, 255, 0.3)' }}>
                {activeFilterCount} Active Filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-container-high)', borderRadius: '0.5rem', padding: '0.15rem 0.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Filter size={13} color="var(--on-surface-variant)" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--on-surface)',
                  border: 'none',
                  padding: '0.35rem 0.3rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="SALES_REP">Sales Rep</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-container-high)', borderRadius: '0.5rem', padding: '0.15rem 0.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <SlidersHorizontal size={13} color="var(--on-surface-variant)" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'var(--on-surface)',
                  border: 'none',
                  padding: '0.35rem 0.3rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="AWAY">Away</option>
                <option value="PENDING_INVITE">Pending Invite</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--surface-container-high)', borderRadius: '0.5rem', padding: '0.15rem 0.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <ArrowUpDown size={13} color="var(--on-surface-variant)" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  background: 'transparent',
                  color: 'var(--on-surface)',
                  border: 'none',
                  padding: '0.35rem 0.3rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <option value="name">Sort: Name</option>
                <option value="role">Sort: Role</option>
                <option value="assigned">Sort: Workload</option>
              </select>
            </div>

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '0.35rem 0.5rem' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 4. Polished Team Member Directory Table & Cards */}
        <div className="glass-card" style={{ padding: '0', borderRadius: '0.85rem', background: '#171a24', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.07)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          
          {/* Desktop Table View */}
          <div className="hidden-mobile" style={{ width: '100%', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>MEMBER</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>ROLE</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>STATUS</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>ASSIGNED WORKLOAD</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>LAST ACTIVE</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(192, 193, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Users size={26} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>No team members found</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          Try adjusting your search criteria or clear active filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member, idx) => {
                    const isMenuOpen = activeMenuId === member.id;
                    const workloadPercent = Math.min(100, Math.round((member.assignedCount / 15) * 100));

                    return (
                      <tr
                        key={member.id}
                        style={{
                          background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                          transition: 'background 0.15s ease',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                        className="hover-row"
                        onClick={() => setSelectedMember(member)}
                      >
                        {/* Member Avatar + Name + Title */}
                        <td style={{ padding: '0.95rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: getAvatarGradient(member.fullName),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.2)',
                              }}
                            >
                              {member.avatarInitials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                                {member.fullName}
                              </p>
                              <p style={{ fontSize: '0.725rem', color: 'var(--on-surface-variant)', margin: '0.15rem 0 0 0' }}>
                                {member.email} • <span style={{ color: 'var(--outline)' }}>{member.title}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Standardized Role Badge */}
                        <td style={{ padding: '0.95rem 1.25rem' }}>{getRoleBadge(member.role)}</td>

                        {/* Status with Glow Effect */}
                        <td style={{ padding: '0.95rem 1.25rem' }}>{getStatusBadge(member.status)}</td>

                        {/* Workload Progress Bar & Badge */}
                        <td style={{ padding: '0.95rem 1.25rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '140px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{member.assignedCount} items</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)' }}>{workloadPercent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${workloadPercent}%`,
                                  height: '100%',
                                  borderRadius: '9999px',
                                  background: workloadPercent > 80 ? 'var(--tertiary)' : 'var(--primary)',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Last Active */}
                        <td style={{ padding: '0.95rem 1.25rem' }}>
                          <span style={{ fontSize: '0.775rem', color: 'var(--on-surface-variant)' }}>
                            {member.lastActive}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '0.95rem 1.25rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setEditRoleValue(member.role);
                                setIsEditRoleModalOpen(true);
                              }}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.4rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--on-surface)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              Edit Role
                            </button>

                            <button
                              onClick={() => setActiveMenuId(isMenuOpen ? null : member.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.25rem' }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div
                                className="glass-card"
                                style={{
                                  position: 'absolute',
                                  top: '110%',
                                  right: 0,
                                  width: '160px',
                                  background: '#1c1f2a',
                                  borderRadius: '0.5rem',
                                  padding: '0.35rem',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  zIndex: 60,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.15rem',
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setActiveMenuId(null);
                                  }}
                                  style={{ padding: '0.4rem 0.65rem', borderRadius: '0.35rem', textAlign: 'left', background: 'transparent', color: 'var(--on-surface)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <Users size={13} /> View Profile
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setEditRoleValue(member.role);
                                    setIsEditRoleModalOpen(true);
                                  }}
                                  style={{ padding: '0.4rem 0.65rem', borderRadius: '0.35rem', textAlign: 'left', background: 'transparent', color: 'var(--on-surface)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <Edit2 size={13} /> Change Role
                                </button>

                                {member.role !== 'OWNER' && (
                                  <>
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />
                                    <button
                                      onClick={() => {
                                        setMemberToDelete(member);
                                        setActiveMenuId(null);
                                      }}
                                      style={{ padding: '0.4rem 0.65rem', borderRadius: '0.35rem', textAlign: 'left', background: 'transparent', color: 'var(--error)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                      <Trash2 size={13} /> Remove Member
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Member Details Slide-Over Drawer */}
      {selectedMember && !isEditRoleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              background: '#171b26',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>TEAM MEMBER PROFILE</span>
              <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: getAvatarGradient(selectedMember.fullName),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {selectedMember.avatarInitials}
              </div>

              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  {selectedMember.fullName}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.15rem 0' }}>
                  {selectedMember.title}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.3rem' }}>
                  {getRoleBadge(selectedMember.role)}
                  {getStatusBadge(selectedMember.status)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.85rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-container-low)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>EMAIL ADDRESS</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface)', marginTop: '0.15rem', fontWeight: 600, margin: 0 }}>{selectedMember.email}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>ASSIGNED WORKLOAD</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.15rem', fontWeight: 700, margin: 0 }}>{selectedMember.assignedCount} active deals & tasks</p>
              </div>

              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>LAST WORKSPACE ACTIVITY</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface)', marginTop: '0.15rem', margin: 0 }}>{selectedMember.lastActive}</p>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => {
                  setEditRoleValue(selectedMember.role);
                  setIsEditRoleModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Edit2 size={15} /> Edit Member Role
              </button>
              {selectedMember.role !== 'OWNER' && (
                <button
                  onClick={() => setMemberToDelete(selectedMember)}
                  className="btn btn-secondary"
                  style={{ color: 'var(--error)', border: '1px solid rgba(255, 180, 171, 0.2)' }}
                  title="Remove Member"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Role Modal */}
      {isEditRoleModalOpen && selectedMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#1c1f2a',
              borderRadius: '0.85rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Edit Role — {selectedMember.fullName}
              </h2>
              <button onClick={() => setIsEditRoleModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Select Access Level</label>
                <select
                  value={editRoleValue}
                  onChange={(e) => setEditRoleValue(e.target.value as any)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.3rem', outline: 'none' }}
                >
                  <option value="OWNER">Owner (Full administrative rights)</option>
                  <option value="ADMIN">Admin (Workspace & team management)</option>
                  <option value="MANAGER">Manager (Project & lead management)</option>
                  <option value="SALES_REP">Sales Rep (Deals & pipeline focus)</option>
                  <option value="MEMBER">Member (Standard team member)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsEditRoleModalOpen(false)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Destructive Delete Confirmation Modal */}
      {memberToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#1c1f2a',
              borderRadius: '0.85rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 180, 171, 0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--error)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--on-surface)' }}>Remove Team Member?</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.4, margin: '0 0 1.25rem 0' }}>
              Are you sure you want to remove <strong style={{ color: 'var(--on-surface)' }}>{memberToDelete.fullName}</strong> from the workspace? They will lose access to all client accounts and assigned deals.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button onClick={() => setMemberToDelete(null)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                Cancel
              </button>
              <button
                onClick={confirmDeleteMember}
                className="btn btn-secondary"
                style={{ background: 'rgba(255,180,171,0.2)', border: '1px solid rgba(255,180,171,0.4)', color: 'var(--error)', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#1c1f2a',
              borderRadius: '0.85rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Invite Team Member</h2>
              <button onClick={() => setIsInviteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@agencyflow.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Client Marketing Specialist"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Access Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                >
                  <option value="ADMIN">Admin (Full workspace management)</option>
                  <option value="MANAGER">Manager (Team & project leads)</option>
                  <option value="SALES_REP">Sales Rep (Deals & pipelines)</option>
                  <option value="MEMBER">Member (Standard team access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
