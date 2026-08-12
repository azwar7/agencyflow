'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING_INVITE' | 'INACTIVE';
  title: string;
  assignedCount: number;
  lastActive: string;
  avatarInitials: string;
}

const initialTeamMembers: TeamMember[] = [
  {
    id: 'USR-001',
    fullName: 'Alex Sterling',
    email: 'alex@agencyflow.io',
    role: 'OWNER',
    status: 'ACTIVE',
    title: 'Agency Owner & CEO',
    assignedCount: 14,
    lastActive: 'Active now',
    avatarInitials: 'AS',
  },
  {
    id: 'USR-002',
    fullName: 'David Miller',
    email: 'david@agencyflow.io',
    role: 'ADMIN',
    status: 'ACTIVE',
    title: 'Lead Solutions Architect',
    assignedCount: 9,
    lastActive: '12 mins ago',
    avatarInitials: 'DM',
  },
  {
    id: 'USR-003',
    fullName: 'Alex Rivera',
    email: 'arivera@agencyflow.io',
    role: 'SALES_REP',
    status: 'ACTIVE',
    title: 'Senior Account Executive',
    assignedCount: 12,
    lastActive: '1 hour ago',
    avatarInitials: 'AR',
  },
  {
    id: 'USR-004',
    fullName: 'Elena Rostova',
    email: 'elena@agencyflow.io',
    role: 'MANAGER',
    status: 'ACTIVE',
    title: 'Senior UX & Product Strategist',
    assignedCount: 6,
    lastActive: '3 hours ago',
    avatarInitials: 'ER',
  },
  {
    id: 'USR-005',
    fullName: 'Marcus Vance',
    email: 'marcus@agencyflow.io',
    role: 'MEMBER',
    status: 'ACTIVE',
    title: 'DevOps & Infrastructure Engineer',
    assignedCount: 5,
    lastActive: 'Yesterday',
    avatarInitials: 'MV',
  },
  {
    id: 'USR-006',
    fullName: 'Sarah Chen',
    email: 'sarah.c@elevate.co',
    role: 'MEMBER',
    status: 'PENDING_INVITE',
    title: 'Client Marketing Specialist',
    assignedCount: 0,
    lastActive: 'Invited Aug 11',
    avatarInitials: 'SC',
  },
];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(initialTeamMembers);
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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const initials = inviteName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newMember: TeamMember = {
      id: `USR-00${team.length + 1}`,
      fullName: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'PENDING_INVITE',
      title: inviteTitle || 'Team Member',
      assignedCount: 0,
      lastActive: 'Invited just now',
      avatarInitials: initials,
    };

    setTeam([newMember, ...team]);
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

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return (
          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '0.25rem',
              background: 'rgba(192, 193, 255, 0.12)',
              border: '1px solid rgba(192, 193, 255, 0.25)',
              color: 'var(--primary)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            OWNER
          </span>
        );
      case 'ADMIN':
        return (
          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '0.25rem',
              background: 'rgba(255, 185, 95, 0.12)',
              border: '1px solid rgba(255, 185, 95, 0.25)',
              color: 'var(--tertiary)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            ADMIN
          </span>
        );
      case 'MANAGER':
        return (
          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '0.25rem',
              background: 'rgba(78, 222, 163, 0.12)',
              border: '1px solid rgba(78, 222, 163, 0.25)',
              color: 'var(--secondary)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            MANAGER
          </span>
        );
      case 'SALES_REP':
        return (
          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '0.25rem',
              background: 'rgba(128, 131, 255, 0.12)',
              border: '1px solid rgba(192, 193, 255, 0.2)',
              color: 'var(--on-surface)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            SALES REP
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '0.25rem',
              background: 'var(--surface-container-high)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--on-surface-variant)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            MEMBER
          </span>
        );
    }
  };

  const getStatusBadge = (status: TeamMember['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)' }} /> Active
          </span>
        );
      case 'PENDING_INVITE':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tertiary)' }} /> Pending
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--outline)' }} /> Inactive
          </span>
        );
    }
  };

  // KPI Metrics
  const totalMembers = team.length;
  const activeMembers = team.filter((m) => m.status === 'ACTIVE').length;
  const adminMembers = team.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length;
  const pendingInvites = team.filter((m) => m.status === 'PENDING_INVITE').length;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        
        {/* 1. Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              TEAM MANAGEMENT
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: '0.1rem 0 0 0' }}>
              Team Directory
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
              Manage agency team members, permissions, access roles, and workspace capacity.
            </p>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <UserPlus size={18} /> Invite Member
          </button>
        </div>

        {/* 2. Compact Team Overview Summary Bar */}
        <div className="glass-card" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.65rem', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--on-surface)' }}>{totalMembers}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Total Members</span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={16} color="var(--secondary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--secondary)' }}>{activeMembers}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Active Workers</span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{adminMembers}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Admins & Owners</span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--tertiary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--tertiary)' }}>{pendingInvites}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Pending Invites</span>
          </div>
        </div>

        {/* 3. Search & Filter Control Toolbar */}
        <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: '0.65rem', background: 'var(--surface-container-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', maxWidth: '420px', background: 'var(--surface-container-high)', padding: '0.45rem 0.85rem', borderRadius: '0.4rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Search size={15} color="var(--on-surface-variant)" />
            <input
              type="text"
              placeholder="Search team members by name, email, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '0.8rem', outline: 'none', width: '100%' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.4rem',
                padding: '0.45rem 0.75rem',
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.4rem',
                padding: '0.45rem 0.75rem',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_INVITE">Pending Invite</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.4rem',
                padding: '0.45rem 0.75rem',
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

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* 4. Polished Team Member Directory Table */}
        <div className="glass-card" style={{ padding: '0', borderRadius: '0.75rem', background: 'var(--surface-container-low)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em' }}>MEMBER</th>
                  <th style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em' }}>ROLE</th>
                  <th style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em' }}>STATUS</th>
                  <th style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em' }}>ASSIGNED WORK</th>
                  <th style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em' }}>LAST ACTIVE</th>
                  <th style={{ textAlign: 'right', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={32} color="var(--on-surface-variant)" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface)' }}>No team members match your criteria</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Try adjusting your search query or filter selections.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isMenuOpen = activeMenuId === member.id;
                    return (
                      <tr
                        key={member.id}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        onClick={() => setSelectedMember(member)}
                      >
                        {/* Member Profile info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: member.role === 'OWNER' ? 'var(--primary-container)' : 'var(--surface-container-high)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: member.role === 'OWNER' ? '#fff' : 'var(--on-surface)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                flexShrink: 0,
                              }}
                            >
                              {member.avatarInitials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.fullName}
                              </p>
                              <p style={{ fontSize: '0.725rem', color: 'var(--on-surface-variant)', margin: '0.1rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {member.email} • <span style={{ color: 'var(--outline)' }}>{member.title}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td>{getRoleBadge(member.role)}</td>

                        {/* Status */}
                        <td>{getStatusBadge(member.status)}</td>

                        {/* Assigned Workload */}
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                            {member.assignedCount} items
                          </span>
                        </td>

                        {/* Last Active */}
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                            {member.lastActive}
                          </span>
                        </td>

                        {/* Actions & Three-Dot Overflow Menu */}
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setEditRoleValue(member.role);
                                setIsEditRoleModalOpen(true);
                              }}
                              style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '0.35rem',
                                background: 'var(--surface-container-high)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--on-surface)',
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Edit Role
                            </button>

                            <button
                              onClick={() => setActiveMenuId(isMenuOpen ? null : member.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.2rem' }}
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
                                  borderRadius: '0.4rem',
                                  padding: '0.3rem',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  zIndex: 60,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.15rem',
                                  boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setActiveMenuId(null);
                                  }}
                                  style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: 'var(--on-surface)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <Users size={13} /> View Profile
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setEditRoleValue(member.role);
                                    setIsEditRoleModalOpen(true);
                                  }}
                                  style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: 'var(--on-surface)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
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
                                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: 'var(--error)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
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
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.1rem',
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
