'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  Mail,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  RefreshCw,
  Ban,
  RotateCcw,
  Copy,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  avatarUrl?: string | null;
  jobTitle: string;
  phone?: string | null;
  joinedAt: string;
  lastActive: string;
  isSelf: boolean;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: { fullName: string };
}

interface TeamMembersTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function TeamMembersTab({ currentUserRole = 'MEMBER', showToast }: TeamMembersTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MANAGER' | 'SALES_REP' | 'MARKETING' | 'VIEWER'>('SALES_REP');
  const [inviting, setInviting] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active Action Target
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<TeamMember | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<string>('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Remove Confirmation
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/settings/team');
      const json = await res.json();
      if (json.success && json.data) {
        setMembers(json.data.members || []);
        setInvitations(json.data.invitations || []);
      } else {
        showToast(json.error?.message || 'Failed to fetch team members', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading team', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Send Invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    try {
      setInviting(true);
      const res = await fetch('/api/v1/settings/team', {
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
        showToast(json.message || 'Invitation created successfully.');
        setGeneratedInviteUrl(json.data?.inviteUrl || null);
        fetchTeam();
      } else {
        showToast(json.error?.message || 'Failed to send invite', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  // Resend Invitation
  const handleResendInvite = async (invitationId: string) => {
    try {
      const res = await fetch('/api/v1/settings/team/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchTeam();
      } else {
        showToast(json.error?.message || 'Failed to resend invite', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Cancel Invitation
  const handleCancelInvite = async (invitationId: string) => {
    try {
      const res = await fetch('/api/v1/settings/team/cancel-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      } else {
        showToast(json.error?.message || 'Failed to cancel invite', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Change Role
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget || !newSelectedRole) return;
    try {
      setUpdatingRole(true);
      const res = await fetch(`/api/v1/settings/team/members/${roleChangeTarget.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newSelectedRole }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setRoleChangeTarget(null);
        fetchTeam();
      } else {
        showToast(json.error?.message || 'Failed to update role', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Toggle Suspend / Reactivate Status
  const handleToggleStatus = async (member: TeamMember) => {
    const nextStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmPrompt =
      nextStatus === 'SUSPENDED'
        ? `Suspend ${member.fullName}? They will immediately be logged out and cannot access the workspace.`
        : `Reactivate ${member.fullName}'s access to this workspace?`;

    if (!confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/v1/settings/team/members/${member.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchTeam();
      } else {
        showToast(json.error?.message || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Remove Member
  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      const res = await fetch(`/api/v1/settings/team/members/${removeTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setRemoveTarget(null);
        fetchTeam();
      } else {
        showToast(json.error?.message || 'Failed to remove member', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setRemoving(false);
    }
  };

  const copyInviteLink = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
      case 'ADMIN':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', border: 'rgba(139, 92, 246, 0.3)' };
      case 'MANAGER':
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'MARKETING':
        return { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' };
      case 'VIEWER':
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      default:
        return { bg: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', border: 'rgba(78, 222, 163, 0.3)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Team Members & Access Control
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Manage workspace members, role tiers, active status, and pending single-use invitations.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedInviteUrl(null);
            setInviteEmail('');
            setInviteName('');
            setIsInviteOpen(true);
          }}
          disabled={!isOwnerOrAdmin}
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            border: 'none',
            padding: '0.55rem 1.15rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: !isOwnerOrAdmin ? 0.6 : 1,
            cursor: !isOwnerOrAdmin ? 'not-allowed' : 'pointer',
          }}
        >
          <UserPlus size={16} />
          Invite Team Member
        </button>
      </div>

      {/* Active Team Members Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            Active Workspace Members ({members.length})
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Server-enforced RBAC protection active
          </span>
        </div>

        <div style={{ overflowX: 'auto', background: 'var(--surface-container)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: 'var(--outline)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>MEMBER</th>
                <th style={{ padding: '0.75rem 1rem' }}>ROLE</th>
                <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.75rem 1rem' }}>JOINED</th>
                <th style={{ padding: '0.75rem 1rem' }}>LAST ACTIVE</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading workspace members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const roleBadge = getRoleBadgeStyle(m.role);
                  const isOwner = m.role === 'OWNER';
                  const canModify = isOwnerOrAdmin && !m.isSelf && !isOwner;

                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {/* Member Name & Email */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#c4b5fd',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              border: `1px solid ${roleBadge.border}`,
                            }}
                          >
                            {m.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {m.fullName}
                              {m.isSelf && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1', padding: '1px 5px', borderRadius: '4px' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                            display: 'inline-block',
                          }}
                        >
                          {m.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: m.status === 'ACTIVE' ? 'rgba(78, 222, 163, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: m.status === 'ACTIVE' ? '#4edea3' : '#f87171',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.status === 'ACTIVE' ? '#4edea3' : '#f87171' }} />
                          {m.status}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>

                      {/* Last Active */}
                      <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                        {new Date(m.lastActive).toLocaleDateString()}
                      </td>

                      {/* Actions Menu */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        {canModify ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {/* Change Role Button */}
                            <button
                              onClick={() => {
                                setRoleChangeTarget(m);
                                setNewSelectedRole(m.role);
                              }}
                              title="Change Role"
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#e2e8f0',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              Role
                            </button>

                            {/* Suspend / Reactivate */}
                            <button
                              onClick={() => handleToggleStatus(m)}
                              title={m.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate Access'}
                              style={{
                                padding: '0.35rem 0.5rem',
                                borderRadius: '6px',
                                background: m.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(78, 222, 163, 0.1)',
                                border: 'none',
                                color: m.status === 'ACTIVE' ? '#f87171' : '#4edea3',
                                cursor: 'pointer',
                              }}
                            >
                              {m.status === 'ACTIVE' ? <Ban size={14} /> : <RotateCcw size={14} />}
                            </button>

                            {/* Remove */}
                            <button
                              onClick={() => setRemoveTarget(m)}
                              title="Remove Member"
                              style={{
                                padding: '0.35rem 0.5rem',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {isOwner ? 'Workspace Owner' : 'Self'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              Pending Invitations ({invitations.length})
            </h3>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--surface-container)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: 'var(--outline)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>INVITEE EMAIL</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ROLE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>INVITED BY</th>
                  <th style={{ padding: '0.75rem 1rem' }}>EXPIRES IN</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>
                      {inv.email}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
                        {inv.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                      {inv.invitedBy?.fullName || 'Workspace Admin'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                      {Math.max(0, Math.round((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))} hours
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {isOwnerOrAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleResendInvite(inv.id)}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => handleCancelInvite(inv.id)}
                            style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: INVITE MEMBER */}
      {/* ------------------------------------------------------------- */}
      {isInviteOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 7, 14, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: 'linear-gradient(180deg, #181c28 0%, #10131d 100%)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Invite Collaborator to Workspace
              </h3>
              <button onClick={() => setIsInviteOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {generatedInviteUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(78, 222, 163, 0.15)', border: '1px solid rgba(78, 222, 163, 0.3)', color: '#4edea3', fontSize: '0.85rem' }}>
                  Single-use invite token generated and active for 72 hours!
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Direct Onboarding Link
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteUrl}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                    />
                    <button
                      onClick={copyInviteLink}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      {copied ? <CheckCircle2 size={14} color="#4edea3" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button onClick={() => setIsInviteOpen(false)} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jordan@agency.com"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Workspace Role Tier *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    {currentUserRole === 'OWNER' && (
                      <option value="ADMIN">Administrator (Full Access)</option>
                    )}
                    <option value="MANAGER">Manager (Pipeline, Deliverables, Team Lead)</option>
                    <option value="SALES_REP">Sales Rep (Assigned Leads & Deals)</option>
                    <option value="MARKETING">Marketing (Lead Acquisition & Content)</option>
                    <option value="VIEWER">Viewer (Read-Only Observer)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsInviteOpen(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={inviting} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CHANGE ROLE */}
      {/* ------------------------------------------------------------- */}
      {roleChangeTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 7, 14, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#161922', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Update Role for {roleChangeTarget.fullName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Adjusting permissions takes effect immediately on the server.
            </p>

            <select
              value={newSelectedRole}
              onChange={(e) => setNewSelectedRole(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            >
              {currentUserRole === 'OWNER' && (
                <option value="ADMIN">Administrator (Full Access)</option>
              )}
              <option value="MANAGER">Manager (Pipeline, Deliverables, Team Lead)</option>
              <option value="SALES_REP">Sales Rep (Assigned Leads & Deals)</option>
              <option value="MARKETING">Marketing (Lead Acquisition & Content)</option>
              <option value="VIEWER">Viewer (Read-Only Observer)</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setRoleChangeTarget(null)} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                Cancel
              </button>
              <button onClick={handleConfirmRoleChange} disabled={updatingRole} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                {updatingRole ? 'Updating...' : 'Confirm Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REMOVE MEMBER CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {removeTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 7, 14, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#161922', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <AlertCircle size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Remove {removeTarget.fullName}?
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
              This will permanently revoke their access and invalidate all active sessions. Any active leads and deals assigned to them will automatically be transferred to you.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setRemoveTarget(null)} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                Cancel
              </button>
              <button onClick={handleConfirmRemove} disabled={removing} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                {removing ? 'Removing...' : 'Permanently Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
