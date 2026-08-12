'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Users,
  Plus,
  Search,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  MoreVertical,
  UserPlus,
  X,
  Trash2,
  Edit2,
  Sparkles,
  Briefcase,
} from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING_INVITE';
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

  // Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('SALES_REP');

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

  const handleRemoveMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  // Filter Members
  const filteredMembers = team.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;

    return true;
  });

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(192, 193, 255, 0.15)', border: '1px solid rgba(192, 193, 255, 0.3)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            OWNER
          </span>
        );
      case 'ADMIN':
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(255, 185, 95, 0.15)', border: '1px solid rgba(255, 185, 95, 0.3)', color: 'var(--tertiary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            ADMIN
          </span>
        );
      case 'MANAGER':
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(78, 222, 163, 0.15)', border: '1px solid rgba(78, 222, 163, 0.3)', color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>
            MANAGER
          </span>
        );
      case 'SALES_REP':
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(128, 131, 255, 0.15)', border: '1px solid rgba(192, 193, 255, 0.2)', color: 'var(--on-surface)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            SALES REP
          </span>
        );
      default:
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            MEMBER
          </span>
        );
    }
  };

  const totalMembers = team.length;
  const activeMembers = team.filter((m) => m.status === 'ACTIVE').length;
  const adminMembers = team.filter((m) => m.role === 'OWNER' || m.role === 'ADMIN').length;
  const pendingInvites = team.filter((m) => m.status === 'PENDING_INVITE').length;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: 'calc(100vh - 4rem)' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Team Management</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
              Manage agency team members, permissions, access roles, and workload capacity.
            </p>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.6rem 1.15rem' }}
          >
            <UserPlus size={18} /> Invite Member
          </button>
        </div>

        {/* KPI Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>TOTAL MEMBERS</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.3rem 0' }}>{totalMembers}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Registered accounts</span>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ACTIVE WORKERS</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)', margin: '0.3rem 0' }}>{activeMembers}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>Active in workspace</span>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ADMINS & OWNERS</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: '0.3rem 0' }}>{adminMembers}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Full workspace privileges</span>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PENDING INVITES</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--tertiary)', margin: '0.3rem 0' }}>{pendingInvites}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 600 }}>Awaiting confirmation</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '0.85rem', background: 'var(--surface-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px', background: 'var(--surface-container-high)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Search size={16} color="var(--on-surface-variant)" />
            <input
              type="text"
              placeholder="Search team by name, email, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.85rem',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
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
                borderRadius: '0.5rem',
                padding: '0.5rem 0.85rem',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_INVITE">Pending Invite</option>
            </select>

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Team Members List / Table */}
        <div className="glass-card" style={{ padding: '0', borderRadius: '0.85rem', background: 'var(--surface-container)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>MEMBER</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>ASSIGNED DEALS / TASKS</th>
                <th>LAST ACTIVE</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  {/* Member Name & Email */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: member.role === 'OWNER' ? 'var(--primary-container)' : 'var(--surface-container-high)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: member.role === 'OWNER' ? '#fff' : 'var(--on-surface)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        {member.avatarInitials}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                          {member.fullName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          {member.email} • <span style={{ color: 'var(--outline)' }}>{member.title}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>{getRoleBadge(member.role)}</td>

                  {/* Status */}
                  <td>
                    {member.status === 'ACTIVE' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                        <CheckCircle2 size={13} /> Active
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 600 }}>
                        <Clock size={13} /> Pending Invite
                      </span>
                    )}
                  </td>

                  {/* Assigned Items */}
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                      {member.assignedCount} items
                    </span>
                  </td>

                  {/* Last Active */}
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                      {member.lastActive}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => alert(`Editing permissions for ${member.fullName}`)}
                        style={{ padding: '0.35rem 0.65rem', borderRadius: '0.35rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Edit Role
                      </button>

                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          style={{ padding: '0.35rem 0.5rem', borderRadius: '0.35rem', background: 'rgba(255, 180, 171, 0.1)', border: '1px solid rgba(255, 180, 171, 0.2)', color: 'var(--error)', fontSize: '0.75rem', cursor: 'pointer' }}
                          title="Remove team member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#1c1f2a',
              borderRadius: '1rem',
              padding: '1.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>Invite Team Member</h2>
              <button onClick={() => setIsInviteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@agencyflow.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Client Marketing Specialist"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Access Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                >
                  <option value="ADMIN">Admin (Full workspace management)</option>
                  <option value="MANAGER">Manager (Team & project leads)</option>
                  <option value="SALES_REP">Sales Rep (Deals & pipelines)</option>
                  <option value="MEMBER">Member (Standard team access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
