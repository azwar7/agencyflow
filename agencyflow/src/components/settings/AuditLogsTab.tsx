'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
}

interface AuditLogsTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function AuditLogsTab({ currentUserRole = 'MEMBER', showToast }: AuditLogsTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...(search ? { search } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(entityFilter ? { entityType: entityFilter } : {}),
      });

      const res = await fetch(`/api/v1/settings/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.logs || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotalCount(json.data.pagination?.total || 0);
      } else {
        showToast(json.error?.message || 'Failed to load audit logs', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, entityFilter, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('INVITE') || action.includes('REACTIVATE')) {
      return { bg: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', border: 'rgba(78, 222, 163, 0.3)' };
    }
    if (action.includes('REMOVE') || action.includes('SUSPEND') || action.includes('DELETE') || action.includes('REVOKE')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (action.includes('ROLE')) {
      return { bg: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', border: 'rgba(139, 92, 246, 0.3)' };
    }
    if (action.includes('POLICY') || action.includes('PASSWORD') || action.includes('SETTINGS')) {
      return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    }
    return { bg: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0', border: 'rgba(255, 255, 255, 0.2)' };
  };

  if (!isOwnerOrAdmin) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--surface-container)', borderRadius: '12px' }}>
        <Lock size={36} color="#94a3b8" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Access Restricted</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Workspace compliance audit logs are strictly reserved for Administrators and Owners.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Compliance & Security Audit Log
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Immutable, workspace-isolated activity log capturing security events, permission modifications, and administrative operations.
          </p>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'var(--surface-container)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Total Events: <strong>{totalCount}</strong>
        </span>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by user, action, or IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.825rem' }}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.825rem' }}
        >
          <option value="">All Actions</option>
          <option value="TEAM_INVITE">Team Invite</option>
          <option value="ROLE_CHANGE">Role Change</option>
          <option value="USER_SUSPEND">User Suspend</option>
          <option value="USER_REACTIVATE">User Reactivate</option>
          <option value="TEAM_REMOVE">Team Remove</option>
          <option value="PASSWORD_CHANGE">Password Change</option>
          <option value="SECURITY_POLICY_UPDATE">Security Policy Update</option>
          <option value="SESSION_REVOKE">Session Revoke</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.825rem' }}
        >
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="Invitation">Invitation</option>
          <option value="Workspace">Workspace</option>
          <option value="Session">Session</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div style={{ overflowX: 'auto', background: 'var(--surface-container)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: 'var(--outline)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>TIMESTAMP</th>
              <th style={{ padding: '0.75rem 1rem' }}>ACTOR</th>
              <th style={{ padding: '0.75rem 1rem' }}>ACTION</th>
              <th style={{ padding: '0.75rem 1rem' }}>ENTITY</th>
              <th style={{ padding: '0.75rem 1rem' }}>DETAILS / METADATA</th>
              <th style={{ padding: '0.75rem 1rem' }}>IP ADDRESS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  Querying audit log records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  No audit events found matching the criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionBadge = getActionBadgeStyle(log.action);
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    {/* Timestamp */}
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Actor */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{log.user.fullName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{log.user.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>System / Automated</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: actionBadge.bg,
                          color: actionBadge.color,
                          border: `1px solid ${actionBadge.border}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                      {log.entityType}
                    </td>

                    {/* Metadata Preview */}
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', maxWidth: '280px' }}>
                      {log.metadata ? (
                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {JSON.stringify(log.metadata)}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Page {page} of {totalPages}
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: 'var(--surface-container)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: page === 1 ? '#64748b' : '#fff',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: 'var(--surface-container)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: page === totalPages ? '#64748b' : '#fff',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
