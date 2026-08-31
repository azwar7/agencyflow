'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
import { X, Sparkles, Send, ArrowRight, Users, Trash2, MoreVertical, ExternalLink } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterTab, setFilterTab] = useState<'all' | 'my'>('all');
  const [sourceFilter, setSourceFilter] = useState('');

  // Selected Lead Drawer State
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [scoringLoading, setScoringLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active Dropdown Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteLead = async (leadId: string, leadName?: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${leadName || 'this lead'}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    setActiveMenuId(null);
    setDeletingId(leadId);

    // Optimistic UI update
    const previousLeads = [...leads];
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);

    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || 'Failed to delete lead');
      }
    } catch (err: any) {
      alert(`Failed to delete lead: ${err.message}`);
      setLeads(previousLeads); // Revert on failure
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setActiveMenuId(null);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    try {
      await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchLeads();
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (sourceFilter) query.set('source', sourceFilter);

      const res = await fetch(`/api/v1/leads?${query.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to fetch leads');
      setLeads(json.data);
    } catch (err: any) {
      setError(err.message || 'Error loading leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const handleRefresh = () => fetchLeads();
    window.addEventListener('agencyflow-refresh', handleRefresh);
    return () => window.removeEventListener('agencyflow-refresh', handleRefresh);
  }, [sourceFilter]);

  // Check URL query parameters for leadId
  useEffect(() => {
    if (typeof window !== 'undefined' && leads.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const leadParam = params.get('leadId') || params.get('id');
      if (leadParam) {
        const match = leads.find(
          (l) =>
            l.id === leadParam ||
            l.companyName?.toLowerCase().includes(leadParam.toLowerCase()) ||
            `${l.firstName} ${l.lastName}`.toLowerCase().includes(leadParam.toLowerCase())
        );
        if (match) {
          openLeadDrawer(match.id);
        } else {
          openLeadDrawer(leadParam);
        }
      }
    }
  }, [leads]);

  const openLeadDrawer = async (leadId: string) => {
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedLead(json.data);
      } else {
        const match = leads.find(
          (l) =>
            l.id === leadId ||
            l.companyName?.toLowerCase().includes(leadId.toLowerCase()) ||
            l.firstName?.toLowerCase().includes(leadId.toLowerCase())
        );
        if (match) setSelectedLead(match);
      }
    } catch (err) {
      const match = leads.find(
        (l) =>
          l.id === leadId ||
          l.companyName?.toLowerCase().includes(leadId.toLowerCase()) ||
          l.firstName?.toLowerCase().includes(leadId.toLowerCase())
      );
      if (match) setSelectedLead(match);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleRunAIScoring = async () => {
    if (!selectedLead) return;
    setScoringLoading(true);
    try {
      const res = await fetch('/api/v1/ai/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.id }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedLead({
          ...selectedLead,
          leadScore: json.data.score,
          aiSummary: json.data.summary,
        });
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScoringLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedLead) return;

    try {
      const res = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.id, type: 'NOTE', content: noteContent }),
      });
      const json = await res.json();
      if (json.success) {
        setNoteContent('');
        openLeadDrawer(selectedLead.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/v1/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealTitle: `${selectedLead.companyName || selectedLead.firstName} Project`,
          dealValue: '35000',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedLead(null);
        fetchLeads();
        alert(`Lead successfully converted into Deal!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConverting(false);
    }
  };

  // Group leads into pipeline stages
  const stages = [
    { id: 'NEW', label: 'New Leads', dotColor: '#c0c1ff' },
    { id: 'QUALIFIED', label: 'Qualified', dotColor: '#4edea3' },
    { id: 'PROPOSAL', label: 'Proposal Sent', dotColor: '#ffb95f' },
    { id: 'NEGOTIATION', label: 'Negotiation', dotColor: '#ffb4ab' },
    { id: 'CONVERTED', label: 'Closed Won', dotColor: '#6ffbbe' },
  ];

  return (
    <AppShell>
      <div className="page-content">
        {/* Page Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--on-surface)' }}>
              Leads Pipeline
            </h1>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: '3px', borderRadius: 'var(--radius-DEFAULT)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button
                onClick={() => setFilterTab('all')}
                style={{
                  padding: '0.35rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  color: filterTab === 'all' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  background: filterTab === 'all' ? 'var(--surface-container-high)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                All Leads
              </button>
              <button
                onClick={() => setFilterTab('my')}
                style={{
                  padding: '0.35rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  color: filterTab === 'my' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  background: filterTab === 'my' ? 'var(--surface-container-high)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                My Leads
              </button>
            </div>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Filter by Source */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{
                padding: '0.45rem 1rem',
                background: 'var(--surface-container-low)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-DEFAULT)',
                color: 'var(--on-surface-variant)',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Filter by Source</option>
              <option value="n8n">n8n Lead Gen</option>
              <option value="Website Inbound">Website Inbound</option>
              <option value="LinkedIn Outbound">LinkedIn Outbound</option>
              <option value="Executive Referral">Executive Referral</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: '3px', borderRadius: 'var(--radius-DEFAULT)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  background: viewMode === 'kanban' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: viewMode === 'kanban' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  view_kanban
                </span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  background: viewMode === 'table' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  table_rows
                </span>
              </button>
            </div>

            {/* New Lead Button */}
            <button
              onClick={() => window.dispatchEvent(new Event('agencyflow-open-new-lead'))}
              className="btn btn-primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add
              </span>
              New Lead
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="kanban-row">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="kanban-col skeleton-pulse" style={{ height: '450px' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchLeads} />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads yet"
            description="Capture inbound inquiries, qualify prospective accounts, and score opportunities with AI."
            actionLabel="+ Add First Lead"
            onAction={() => window.dispatchEvent(new Event('agencyflow-open-new-lead'))}
          />
        ) : viewMode === 'kanban' ? (
          <div className="kanban-row">
            {stages.map((stg) => {
              const stageLeads = leads.filter((l) => l.status === stg.id);
              const totalVal = stageLeads.reduce((acc, l) => acc + (l.leadScore > 80 ? 28000 : 18500), 0);

              return (
                <div key={stg.id} className="kanban-col">
                  {/* Clean Non-Colliding Stage Header Structure */}
                  <div style={{ paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {/* Row 1: [Dot] [Stage Title] ... [Count Badge] */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stg.dotColor, flexShrink: 0 }} />
                        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {stg.label}
                        </h2>
                      </div>
                      <span style={{ padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'var(--surface-container-high)', fontSize: '10px', fontWeight: 700, color: 'var(--on-surface-variant)', flexShrink: 0 }}>
                        {stageLeads.length}
                      </span>
                    </div>

                    {/* Row 2: Dedicated Pipeline Monetary Value */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, paddingLeft: '1rem' }}>
                      ${totalVal > 0 ? totalVal.toLocaleString() : '0'}
                    </div>
                  </div>

                  {/* Lead Cards */}
                  {stageLeads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--outline)', fontSize: '0.75rem' }}>
                      No leads in stage
                    </div>
                  ) : (
                    stageLeads.map((l) => (
                      <div
                        key={l.id}
                        className="kanban-card"
                        onClick={() => openLeadDrawer(l.id)}
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.25rem' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {l.companyName || `${l.firstName} ${l.lastName}`}
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {l.firstName} {l.lastName}
                            </p>
                          </div>
                          
                          {/* 3-Dot Options Menu */}
                          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === l.id ? null : l.id);
                              }}
                              style={{
                                background: activeMenuId === l.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: activeMenuId === l.id ? 'var(--primary)' : 'var(--outline)',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.15s ease',
                              }}
                              title="Lead options"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuId === l.id && (
                              <div
                                ref={dropdownRef}
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  zIndex: 50,
                                  minWidth: '160px',
                                  background: '#1e2026',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                                  padding: '4px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    openLeadDrawer(l.id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    color: '#e2e2e8',
                                    fontSize: '12px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: '100%',
                                  }}
                                >
                                  <ExternalLink size={14} color="#c0c1ff" /> View Details
                                </button>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '2px 0' }} />

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLead(l.id, l.companyName || `${l.firstName} ${l.lastName}`);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    color: '#ffb4ab',
                                    fontSize: '12px',
                                    background: 'rgba(255, 180, 171, 0.08)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: '100%',
                                    fontWeight: 600,
                                  }}
                                >
                                  <Trash2 size={14} color="#ffb4ab" /> Remove Lead
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* AI Score Badge */}
                          <span
                            style={{
                              padding: '0.15rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(0, 165, 114, 0.2)',
                              border: '1px solid rgba(78, 222, 163, 0.2)',
                              color: 'var(--secondary)',
                              fontSize: '10px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                              auto_awesome
                            </span>
                            AI {l.leadScore}
                          </span>

                          {/* Source Badge */}
                          <span
                            style={{
                              padding: '0.15rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--surface-container-high)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              color: 'var(--on-surface-variant)',
                              fontSize: '10px',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100px',
                            }}
                          >
                            {l.source || 'Inbound'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                            ${l.leadScore > 80 ? '28,000' : '18,500'}
                          </span>
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              color: 'var(--on-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 700,
                            }}
                          >
                            {l.assignedTo?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'AR'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Lead Action Button */}
                  <button
                    onClick={() => window.dispatchEvent(new Event('agencyflow-open-new-lead'))}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      color: 'var(--on-surface-variant)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginTop: 'auto',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      add
                    </span>
                    Add Lead
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View Alternative */
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>AI Score</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Assigned Rep</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} onClick={() => openLeadDrawer(l.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>
                      {l.firstName} {l.lastName}
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 400 }}>{l.email}</span>
                    </td>
                    <td>{l.companyName || '—'}</td>
                    <td>
                      <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{l.leadScore}/100</span>
                    </td>
                    <td>
                      <span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span>
                    </td>
                    <td>{l.source}</td>
                    <td>{l.assignedTo?.fullName || 'Alex Rivera'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openLeadDrawer(l.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '12px' }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteLead(l.id, l.companyName || `${l.firstName} ${l.lastName}`)}
                          title="Remove Lead"
                          style={{
                            padding: '0.25rem 0.45rem',
                            fontSize: '12px',
                            background: 'rgba(255, 180, 171, 0.1)',
                            border: '1px solid rgba(255, 180, 171, 0.25)',
                            color: '#ffb4ab',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Lead Slide-Over Drawer */}
      {selectedLead && (
        <div className="drawer-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(144, 143, 160, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {selectedLead.firstName} {selectedLead.lastName}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{selectedLead.email} • {selectedLead.companyName}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} style={{ color: 'var(--on-surface-variant)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {/* AI Lead Qualification Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(192, 193, 255, 0.15), rgba(78, 222, 163, 0.1))',
                  border: '1px solid rgba(192, 193, 255, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Sparkles size={16} /> AI Qualification Inspector
                  </div>
                  <button
                    onClick={handleRunAIScoring}
                    disabled={scoringLoading}
                    className="btn btn-primary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    {scoringLoading ? 'Evaluating...' : 'Re-Score AI'}
                  </button>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.4rem' }}>
                  Score: {selectedLead.leadScore}/100
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface)', lineHeight: 1.4 }}>
                  {selectedLead.aiSummary || 'AI score evaluation complete.'}
                </p>
              </div>

              {/* Convert Lead to Deal Button */}
              {selectedLead.status !== 'CONVERTED' && (
                <button onClick={handleConvertLead} disabled={converting} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                  {converting ? 'Converting...' : 'Convert to Active Deal'} <ArrowRight size={16} />
                </button>
              )}

              {/* Danger Zone: Remove Lead Button */}
              <button
                onClick={() => handleDeleteLead(selectedLead.id, selectedLead.companyName || `${selectedLead.firstName} ${selectedLead.lastName}`)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 180, 171, 0.08)',
                  border: '1px solid rgba(255, 180, 171, 0.25)',
                  color: '#ffb4ab',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Trash2 size={16} /> Remove Lead Permanently
              </button>

              {/* Fast Activity Note Logger */}
              <form onSubmit={handleAddNote} style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Log quick call note..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.8rem' }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

