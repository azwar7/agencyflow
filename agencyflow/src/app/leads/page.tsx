'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
import {
  X,
  Sparkles,
  Send,
  ArrowRight,
  Users,
  Trash2,
  MoreVertical,
  ExternalLink,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Flame,
  Zap,
  Snowflake,
  RefreshCw,
  Target,
  Lightbulb,
  GripVertical,
} from 'lucide-react';
import { getCachedData, setCachedData } from '@/lib/client-cache';
import { isEmailAvailable, formatLeadEmail } from '@/lib/lead-utils';

export default function LeadsPage() {
  const cached = getCachedData<any[]>('/api/v1/leads');
  const [leads, setLeads] = useState<any[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterTab, setFilterTab] = useState<'all' | 'my'>('all');
  const [sourceFilter, setSourceFilter] = useState('');

  // Drag-and-Drop Kanban State
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Selected Lead Drawer State
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'intelligence' | 'outreach' | 'history'>('intelligence');
  const [noteContent, setNoteContent] = useState('');
  const [converting, setConverting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI Intelligence & Pitch State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any | null>(null);

  // Outreach & Email Composer State
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'conversational' | 'direct'>('professional');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [currentOutreach, setCurrentOutreach] = useState<any | null>(null);
  const [outreachHistory, setOutreachHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const fetchLeads = async () => {
    if (!cached && (!leads || leads.length === 0)) {
      setLoading(true);
    }
    setError('');
    try {
      const query = new URLSearchParams();
      if (sourceFilter) query.set('source', sourceFilter);

      const res = await fetch(`/api/v1/leads?${query.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to fetch leads');
      setLeads(json.data);
      if (!sourceFilter) {
        setCachedData('/api/v1/leads', json.data);
      }
    } catch (err: any) {
      if (!leads || leads.length === 0) setError(err.message || 'Error loading leads');
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

  // ----------------------------------------------------
  // Drag & Drop Event Handlers
  // ----------------------------------------------------
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    // Only reset if actually leaving the column container
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDraggingLeadId(null);
    setDragOverStageId(null);

    if (!leadId) return;

    const draggedLead = leads.find((l) => l.id === leadId);
    if (!draggedLead || draggedLead.status === targetStageId) return;

    // Optimistically update status
    handleUpdateStatus(leadId, targetStageId);
  };

  // ----------------------------------------------------
  // Status Update & Drawer Handlers
  // ----------------------------------------------------
  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setActiveMenuId(null);

    // Optimistic UI state update
    const previousLeads = [...leads];
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    if (selectedLead?.id === leadId) {
      setSelectedLead((prev: any) => ({ ...prev, status: newStatus }));
    }

    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update stage');
      }
    } catch (err: any) {
      console.error('Failed to update stage:', err);
      setLeads(previousLeads);
    }
  };

  const openLeadDrawer = async (leadId: string) => {
    setDrawerLoading(true);
    setFeedbackMsg(null);
    try {
      const [leadRes, outreachRes] = await Promise.all([
        fetch(`/api/v1/leads/${leadId}`),
        fetch(`/api/v1/leads/${leadId}/outreach`),
      ]);

      const leadJson = await leadRes.json();
      const outreachJson = await outreachRes.json();

      if (leadJson.success && leadJson.data) {
        setSelectedLead(leadJson.data);
      } else {
        const match = leads.find((l) => l.id === leadId);
        if (match) setSelectedLead(match);
      }

      if (outreachJson.success && outreachJson.data) {
        setOutreachHistory(outreachJson.data.outreach || []);
        if (outreachJson.data.analyses?.length > 0) {
          setAnalysisData(outreachJson.data.analyses[0]);
        } else {
          setAnalysisData(null);
        }

        // Pre-fill active draft email if exists
        const draftOrLatest = outreachJson.data.outreach?.[0];
        if (draftOrLatest) {
          setCurrentOutreach(draftOrLatest);
          setEmailSubject(draftOrLatest.subject);
          setEmailBody(draftOrLatest.body);
          if (draftOrLatest.tone) setSelectedTone(draftOrLatest.tone);
        } else {
          setCurrentOutreach(null);
          setEmailSubject('');
          setEmailBody('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // 1. Run AI Intelligence & Pitch Diagnostic
  const handleRunAIAnalysis = async () => {
    if (!selectedLead) return;
    setAnalyzing(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/v1/leads/${selectedLead.id}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Analysis failed');

      setAnalysisData(json.data);
      setSelectedLead((prev: any) => ({
        ...prev,
        leadScore: json.data.score,
        status: json.data.status,
        aiSummary: json.data.companySummary,
      }));
      setFeedbackMsg({ type: 'success', text: `Lead qualified as ${json.data.qualification.toUpperCase()} (Score: ${json.data.score}/100)` });
      fetchLeads();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to analyze lead' });
    } finally {
      setAnalyzing(false);
    }
  };

  // 2. Generate Personalized Outreach Email
  const handleGenerateEmail = async () => {
    if (!selectedLead) return;
    setGeneratingEmail(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/v1/leads/${selectedLead.id}/ai/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone: selectedTone }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Email generation failed');

      setCurrentOutreach(json.data);
      setEmailSubject(json.data.subject);
      setEmailBody(json.data.body);
      setOutreachHistory((prev) => [json.data, ...prev]);
      setDrawerTab('outreach');
      setFeedbackMsg({ type: 'success', text: 'Personalized email draft generated! Review and approve below.' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to generate email' });
    } finally {
      setGeneratingEmail(false);
    }
  };

  // 3. Approve & Send Outreach via n8n
  const handleApproveAndSend = async () => {
    if (!selectedLead || !currentOutreach) return;
    setSendingEmail(true);
    setFeedbackMsg(null);
    try {
      // Step A: Approve draft with any manual edits
      const approveRes = await fetch(`/api/v1/leads/${selectedLead.id}/outreach/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outreachId: currentOutreach.id,
          subject: emailSubject,
          body: emailBody,
          tone: selectedTone,
        }),
      });
      const approveJson = await approveRes.json();
      if (!approveRes.ok || !approveJson.success) throw new Error(approveJson.error?.message || 'Failed to approve email');

      // Step B: Dispatch email via n8n workflow and progress stage to OUTREACH_SENT
      const sendRes = await fetch(`/api/v1/leads/${selectedLead.id}/outreach/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outreachId: currentOutreach.id,
        }),
      });
      const sendJson = await sendRes.json();
      if (!sendRes.ok || !sendJson.success) throw new Error(sendJson.error?.message || 'Failed to dispatch email');

      setCurrentOutreach(sendJson.data.outreach);
      setSelectedLead((prev: any) => ({ ...prev, status: 'OUTREACH_SENT' }));
      setFeedbackMsg({ type: 'success', text: '🚀 Email approved & sent! Lead moved to Outreach Sent stage.' });
      fetchLeads();
      openLeadDrawer(selectedLead.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to send outreach email' });
      if (selectedLead?.id) {
        openLeadDrawer(selectedLead.id);
      }
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    const textToCopy = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteLead = async (leadId: string, leadName?: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${leadName || 'this lead'}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    setActiveMenuId(null);
    setDeletingId(leadId);

    const previousLeads = [...leads];
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);

    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || json.error || 'Failed to delete lead');
      window.dispatchEvent(new Event('agencyflow-refresh'));
    } catch (err: any) {
      alert(`Failed to delete lead: ${err.message}`);
      setLeads(previousLeads);
    } finally {
      setDeletingId(null);
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
    const valueInput = prompt(
      `Convert "${selectedLead.companyName || selectedLead.firstName}" to an Active Deal.\nEnter estimated deal value in USD (e.g. 5000, or 0 if unknown):`,
      '0'
    );
    if (valueInput === null) return; // User cancelled
    const dealValue = Math.max(0, parseFloat(valueInput.replace(/[^0-9.]/g, '')) || 0);

    setConverting(true);
    try {
      const res = await fetch(`/api/v1/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealTitle: `${selectedLead.companyName || selectedLead.firstName} Project`,
          dealValue,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedLead(null);
        fetchLeads();
        window.dispatchEvent(new Event('agencyflow-refresh'));
        alert(`Lead successfully converted into Deal${dealValue > 0 ? ` with value $${dealValue.toLocaleString()}` : ''}!`);
      } else {
        alert(json.error?.message || 'Failed to convert lead');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error converting lead');
    } finally {
      setConverting(false);
    }
  };

  // Pipeline Stages (Preserves backward compatibility & implements modern sales flow)
  const stages = [
    { id: 'NEW', label: 'New Leads', dotColor: '#c0c1ff' },
    { id: 'QUALIFIED', label: 'Qualified', dotColor: '#4edea3' },
    { id: 'OUTREACH_SENT', label: 'Outreach Sent', dotColor: '#38bdf8' },
    { id: 'NEGOTIATION', label: 'Negotiation', dotColor: '#ffb95f' },
    { id: 'CONVERTED', label: 'Closed Won', dotColor: '#6ffbbe' },
    { id: 'CLOSED_LOST', label: 'Closed Lost', dotColor: '#ffb4ab' },
  ];

  return (
    <AppShell>
      <div className="page-content">
        {/* Page Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--on-surface)' }}>
              Leads Pipeline & AI Outreach
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
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_kanban</span>
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
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_rows</span>
              </button>
            </div>

            {/* New Lead Button */}
            <button
              onClick={() => window.dispatchEvent(new Event('agencyflow-open-new-lead'))}
              className="btn btn-primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              New Lead
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="kanban-row">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="kanban-col skeleton-pulse" style={{ height: '450px' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchLeads} />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads yet"
            description="Capture inbound inquiries, qualify prospective accounts with AI, and dispatch personalized outreach."
            actionLabel="+ Add First Lead"
            onAction={() => window.dispatchEvent(new Event('agencyflow-open-new-lead'))}
          />
        ) : viewMode === 'kanban' ? (
          <div className="kanban-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {stages.map((stg) => {
              const stageLeads = leads.filter((l) => l.status === stg.id || (stg.id === 'CONVERTED' && l.status === 'CLOSED_WON') || (stg.id === 'CLOSED_LOST' && l.status === 'UNQUALIFIED'));
              const isOverThisStage = dragOverStageId === stg.id;

              return (
                <div
                  key={stg.id}
                  className="kanban-col"
                  onDragOver={(e) => handleDragOver(e, stg.id)}
                  onDragLeave={(e) => handleDragLeave(e, stg.id)}
                  onDrop={(e) => handleDrop(e, stg.id)}
                  style={{
                    background: isOverThisStage ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface-container-lowest)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    border: isOverThisStage ? '2px dashed #38bdf8' : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: isOverThisStage ? '0 0 25px rgba(56, 189, 248, 0.15)' : 'none',
                    minWidth: '280px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Stage Header */}
                  <div style={{ paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
                  </div>

                  {/* Lead Cards List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', minHeight: '120px' }}>
                    {stageLeads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: isOverThisStage ? '#38bdf8' : 'var(--outline)', fontSize: '0.75rem', border: isOverThisStage ? '1px dashed #38bdf8' : 'none', borderRadius: '6px' }}>
                        {isOverThisStage ? 'Drop lead here to move' : 'No leads in stage'}
                      </div>
                    ) : (
                      stageLeads.map((l) => {
                        const isDraggingThis = draggingLeadId === l.id;
                        return (
                          <div
                            key={l.id}
                            className="kanban-card"
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, l.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => openLeadDrawer(l.id)}
                            style={{
                              cursor: 'grab',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.6rem',
                              position: 'relative',
                              background: isDraggingThis ? 'rgba(56, 189, 248, 0.1)' : 'var(--surface-container)',
                              padding: '0.9rem',
                              borderRadius: 'var(--radius-md)',
                              border: isDraggingThis ? '1px dashed #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                              opacity: isDraggingThis ? 0.4 : 1,
                              transform: isDraggingThis ? 'scale(0.98)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.25rem' }}>
                              <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                                <GripVertical size={14} color="var(--outline)" style={{ marginTop: '3px', flexShrink: 0, opacity: 0.6 }} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {l.companyName || `${l.firstName} ${l.lastName}`}
                                  </h3>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {l.firstName} {l.lastName}
                                  </p>
                                </div>
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

                                    <Link
                                      href={`/clients/portal?clientId=${l.id}`}
                                      target="_blank"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(null);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        color: '#c4b5fd',
                                        fontSize: '12px',
                                        textDecoration: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        width: '100%',
                                      }}
                                    >
                                      <Sparkles size={14} color="#a78bfa" /> Client Portal
                                    </Link>

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
                                  background: l.leadScore >= 75 ? 'rgba(78, 222, 163, 0.18)' : 'rgba(208, 188, 255, 0.15)',
                                  border: l.leadScore >= 75 ? '1px solid rgba(78, 222, 163, 0.3)' : '1px solid rgba(208, 188, 255, 0.25)',
                                  color: l.leadScore >= 75 ? '#4edea3' : '#d0bcff',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  textTransform: 'uppercase',
                                }}
                              >
                                <Sparkles size={11} /> AI {l.leadScore}
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
                                }}
                              >
                                {l.source || 'Inbound'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Clock size={11} style={{ opacity: 0.6 }} />
                                {l.createdAt ? new Date(l.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                              </span>
                              <div
                                title={l.assignedTo?.fullName ? `Assigned to ${l.assignedTo.fullName}` : 'Assigned to AR'}
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
                        );
                      })
                    )}
                  </div>
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
                      <span style={{ display: 'block', fontSize: '12px', color: isEmailAvailable(l.email) ? 'var(--on-surface-variant)' : 'var(--outline)', fontStyle: isEmailAvailable(l.email) ? 'normal' : 'italic', fontWeight: 400 }}>
                        {formatLeadEmail(l.email)}
                      </span>
                    </td>
                    <td>{l.companyName || '—'}</td>
                    <td>
                      <span style={{ color: l.leadScore >= 75 ? '#4edea3' : '#d0bcff', fontWeight: 700 }}>{l.leadScore}/100</span>
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
                        <Link
                          href={`/clients/portal?clientId=${l.id}`}
                          target="_blank"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#c4b5fd' }}
                          title="Open Client Portal"
                        >
                          <ExternalLink size={12} /> Portal
                        </Link>
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

      {/* Selected Lead Slide-Over Drawer with AI Hub */}
      {selectedLead && (
        <div className="drawer-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ width: '560px', maxWidth: '95vw', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-container-low)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedLead.companyName || `${selectedLead.firstName} ${selectedLead.lastName}`}
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                    {selectedLead.status}
                  </span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
                  {selectedLead.firstName} {selectedLead.lastName} •{' '}
                  <span style={{ fontStyle: isEmailAvailable(selectedLead.email) ? 'normal' : 'italic', color: isEmailAvailable(selectedLead.email) ? 'inherit' : 'var(--outline)' }}>
                    {formatLeadEmail(selectedLead.email)}
                  </span>
                  {' '}• {selectedLead.phone || 'No phone'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link
                  href={`/clients/portal?clientId=${selectedLead.id}`}
                  target="_blank"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#c4b5fd',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  title="Open Client Portal for this lead"
                >
                  <ExternalLink size={13} /> Client Portal
                </Link>
                <button onClick={() => setSelectedLead(null)} style={{ color: 'var(--on-surface-variant)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tab Controller */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'var(--surface-container-lowest)', padding: '0 1.25rem' }}>
              <button
                onClick={() => setDrawerTab('intelligence')}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: drawerTab === 'intelligence' ? '#d0bcff' : 'var(--on-surface-variant)',
                  borderBottom: drawerTab === 'intelligence' ? '2px solid #d0bcff' : '2px solid transparent',
                  background: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Sparkles size={15} /> AI Intelligence
              </button>
              <button
                onClick={() => setDrawerTab('outreach')}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: drawerTab === 'outreach' ? '#38bdf8' : 'var(--on-surface-variant)',
                  borderBottom: drawerTab === 'outreach' ? '2px solid #38bdf8' : '2px solid transparent',
                  background: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Mail size={15} /> Outreach Email {currentOutreach && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />}
              </button>
              <button
                onClick={() => setDrawerTab('history')}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: drawerTab === 'history' ? '#4edea3' : 'var(--on-surface-variant)',
                  borderBottom: drawerTab === 'history' ? '2px solid #4edea3' : '2px solid transparent',
                  background: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Clock size={15} /> History ({outreachHistory.length})
              </button>
            </div>

            {/* Notification Banner */}
            {feedbackMsg && (
              <div
                style={{
                  margin: '0.75rem 1.25rem 0',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: feedbackMsg.type === 'success' ? 'rgba(78, 222, 163, 0.12)' : 'rgba(255, 180, 171, 0.12)',
                  border: feedbackMsg.type === 'success' ? '1px solid rgba(78, 222, 163, 0.3)' : '1px solid rgba(255, 180, 171, 0.3)',
                  color: feedbackMsg.type === 'success' ? '#4edea3' : '#ffb4ab',
                }}
              >
                {feedbackMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {feedbackMsg.text}
              </div>
            )}

            {/* Drawer Body Tabs */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {drawerTab === 'intelligence' && (
                <>
                  {/* AI Qualification Hero Card */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(208, 188, 255, 0.12), rgba(56, 189, 248, 0.08))',
                      border: '1px solid rgba(208, 188, 255, 0.25)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={18} color="#d0bcff" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Lead Intelligence & Fit</span>
                      </div>
                      <button
                        onClick={handleRunAIAnalysis}
                        disabled={analyzing}
                        className="btn btn-primary"
                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        {analyzing ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        {analyzing ? 'Analyzing Lead...' : analysisData ? 'Re-Analyze Lead' : 'Run AI Diagnostic'}
                      </button>
                    </div>

                    {/* Score & Tier Indicators */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (analysisData?.score || selectedLead.leadScore) >= 75 ? '#4edea3' : '#d0bcff' }}>
                        {analysisData?.score || selectedLead.leadScore}/100
                      </div>

                      {analysisData?.qualification && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background:
                              analysisData.qualification === 'hot'
                                ? 'rgba(255, 107, 107, 0.2)'
                                : analysisData.qualification === 'warm'
                                ? 'rgba(255, 185, 95, 0.2)'
                                : 'rgba(148, 163, 184, 0.2)',
                            color:
                              analysisData.qualification === 'hot'
                                ? '#ff6b6b'
                                : analysisData.qualification === 'warm'
                                ? '#ffb95f'
                                : '#94a3b8',
                            border: '1px solid currentColor',
                          }}
                        >
                          {analysisData.qualification === 'hot' && <Flame size={12} />}
                          {analysisData.qualification === 'warm' && <Zap size={12} />}
                          {analysisData.qualification === 'cold' && <Snowflake size={12} />}
                          {analysisData.qualification} PROSPECT
                        </div>
                      )}

                      {analysisData?.confidence && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                          Confidence: {analysisData.confidence}%
                        </span>
                      )}
                    </div>

                    {/* Company Summary */}
                    <p style={{ fontSize: '0.85rem', color: '#e2e2e8', lineHeight: 1.5, margin: 0 }}>
                      {analysisData?.companySummary || selectedLead.aiSummary || 'Run AI diagnostic to extract business bottlenecks and tailored pitches.'}
                    </p>
                  </div>

                  {/* Diagnosed Pain Points */}
                  {analysisData?.likelyPainPoints && analysisData.likelyPainPoints.length > 0 && (
                    <div style={{ background: 'var(--surface-container)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Target size={14} /> Identified Bottlenecks & Gaps
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {analysisData.likelyPainPoints.map((pain: string, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              background: 'rgba(255, 185, 95, 0.1)',
                              border: '1px solid rgba(255, 185, 95, 0.25)',
                              color: '#ffb95f',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            • {pain}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Service & Tailored Pitch */}
                  {analysisData?.recommendedPitch && (
                    <div style={{ background: 'var(--surface-container-high)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(208, 188, 255, 0.2)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Lightbulb size={14} /> Recommended Agency Pitch
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                        "{analysisData.recommendedPitch}"
                      </p>
                      {analysisData.recommendedServices && (
                        <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {analysisData.recommendedServices.map((svc: string, i: number) => (
                            <span key={i} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(208, 188, 255, 0.15)', color: '#d0bcff', fontWeight: 600 }}>
                              {svc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explainable Reasoning */}
                  {analysisData?.reasoning && (
                    <div style={{ padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Score Evaluation Factors
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.4, margin: 0 }}>
                        {analysisData.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Call to Action to Outreach Tab */}
                  <button
                    onClick={() => {
                      setDrawerTab('outreach');
                      if (!emailBody) handleGenerateEmail();
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                  >
                    <Mail size={16} /> Compose Personalized Outreach Email <ArrowRight size={16} />
                  </button>
                </>
              )}

              {drawerTab === 'outreach' && (
                <>
                  {/* Email Availability Banner */}
                  {!isEmailAvailable(selectedLead.email) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        color: '#facc15',
                        fontSize: '0.8rem',
                        lineHeight: 1.4,
                        marginBottom: '0.75rem',
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 700 }}>Email not available:</span> Direct automated email dispatch is disabled because no verified email was found for this lead. You can still generate email copy for manual outreach or phone reference.
                      </div>
                    </div>
                  )}

                  {/* Email Settings Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Tone:</span>
                      {(['professional', 'conversational', 'direct'] as const).map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setSelectedTone(tone)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                            background: selectedTone === tone ? 'rgba(56, 189, 248, 0.2)' : 'var(--surface-container-high)',
                            border: selectedTone === tone ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: selectedTone === tone ? '#38bdf8' : 'var(--on-surface-variant)',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontWeight: selectedTone === tone ? 700 : 500,
                          }}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleGenerateEmail}
                      disabled={generatingEmail}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <RefreshCw size={12} className={generatingEmail ? 'animate-spin' : ''} />
                      {generatingEmail ? 'Drafting AI Copy...' : emailBody ? 'Regenerate Copy' : 'Generate Email'}
                    </button>
                  </div>

                  {/* Email Composer & Live Editor */}
                  {generatingEmail ? (
                    <div className="skeleton-pulse" style={{ height: '220px', borderRadius: 'var(--radius-md)' }} />
                  ) : emailBody || emailSubject ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--surface-container-high)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      
                      {/* Delivery Status Banner */}
                      {currentOutreach?.status === 'SENT' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(78, 222, 163, 0.1)',
                            border: '1px solid rgba(78, 222, 163, 0.3)',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4edea3', fontSize: '0.825rem', fontWeight: 600 }}>
                            <CheckCircle2 size={16} />
                            <span>Delivered</span>
                            {currentOutreach.sentAt && (
                              <span style={{ opacity: 0.75, fontWeight: 400, fontSize: '0.75rem' }}>
                                • {new Date(currentOutreach.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(78, 222, 163, 0.2)', color: '#4edea3', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                            DELIVERED
                          </span>
                        </div>
                      )}

                      {currentOutreach?.status === 'FAILED' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#f87171',
                            fontSize: '0.825rem',
                            lineHeight: 1.4,
                          }}
                        >
                          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <span style={{ fontWeight: 700 }}>Delivery Failed: </span>
                            <span>{currentOutreach.failureReason || 'Delivery workflow could not process this email.'}</span>
                          </div>
                        </div>
                      )}

                      {/* Subject Line */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                          Subject Line:
                        </label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          readOnly={currentOutreach?.status === 'SENT'}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--surface-container-lowest)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '6px',
                            color: currentOutreach?.status === 'SENT' ? '#a1a1aa' : '#fff',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Email Body Textarea */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                          Personalized Email Body:
                        </label>
                        <textarea
                          rows={8}
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          readOnly={currentOutreach?.status === 'SENT'}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'var(--surface-container-lowest)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '6px',
                            color: currentOutreach?.status === 'SENT' ? '#a1a1aa' : '#e2e2e8',
                            fontSize: '0.85rem',
                            lineHeight: 1.6,
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                          }}
                        />
                      </div>

                      {/* Actions Toolbar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <button
                          onClick={handleCopyEmail}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'transparent',
                            border: 'none',
                            color: copied ? '#4edea3' : 'var(--on-surface-variant)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'Copied to Clipboard!' : 'Copy Email'}
                        </button>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {currentOutreach?.status === 'SENT' ? (
                            <>
                              <button
                                disabled
                                style={{
                                  padding: '0.5rem 0.9rem',
                                  borderRadius: '6px',
                                  background: 'rgba(78, 222, 163, 0.12)',
                                  color: '#4edea3',
                                  border: '1px solid rgba(78, 222, 163, 0.3)',
                                  fontSize: '0.825rem',
                                  fontWeight: 600,
                                  cursor: 'not-allowed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                }}
                              >
                                <Check size={14} /> Email Sent
                              </button>
                              <button
                                onClick={handleGenerateEmail}
                                disabled={generatingEmail}
                                style={{
                                  padding: '0.5rem 0.9rem',
                                  borderRadius: '6px',
                                  background: 'var(--surface-container-highest)',
                                  color: '#fff',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  fontSize: '0.825rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                }}
                              >
                                <Sparkles size={14} color="#38bdf8" /> Draft Follow-up
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleApproveAndSend}
                              disabled={sendingEmail || !isEmailAvailable(selectedLead.email)}
                              title={!isEmailAvailable(selectedLead.email) ? 'Direct email outreach disabled: Lead email is not available.' : ''}
                              style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                background: !isEmailAvailable(selectedLead.email)
                                  ? '#334155'
                                  : currentOutreach?.status === 'FAILED'
                                  ? '#f87171'
                                  : '#38bdf8',
                                color: !isEmailAvailable(selectedLead.email)
                                  ? '#94a3b8'
                                  : currentOutreach?.status === 'FAILED'
                                  ? '#450a0a'
                                  : '#082f49',
                                border: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: sendingEmail || !isEmailAvailable(selectedLead.email) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: !isEmailAvailable(selectedLead.email)
                                  ? 'none'
                                  : currentOutreach?.status === 'FAILED'
                                  ? '0 0 20px rgba(248, 113, 113, 0.3)'
                                  : '0 0 20px rgba(56, 189, 248, 0.3)',
                              }}
                            >
                              {sendingEmail ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              {sendingEmail
                                ? 'Dispatching email...'
                                : !isEmailAvailable(selectedLead.email)
                                ? 'Email Not Available'
                                : currentOutreach?.status === 'FAILED'
                                ? 'Retry Send 🚀'
                                : 'Approve & Send 🚀'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <Mail size={32} color="var(--outline)" style={{ margin: '0 auto 0.75rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
                        No email drafted yet. Click below to generate a tailored 1-to-1 outreach email based on AI pitch diagnostics.
                      </p>
                      <button onClick={handleGenerateEmail} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                        <Sparkles size={15} /> Generate AI Outreach Copy
                      </button>
                    </div>
                  )}
                </>
              )}

              {drawerTab === 'history' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {outreachHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--outline)', fontSize: '0.85rem' }}>
                        No outreach history recorded for this prospect.
                      </div>
                    ) : (
                      outreachHistory.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: 'var(--surface-container)',
                            padding: '0.9rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                background:
                                  item.status === 'SENT'
                                    ? 'rgba(78, 222, 163, 0.15)'
                                    : item.status === 'APPROVED'
                                    ? 'rgba(56, 189, 248, 0.15)'
                                    : item.status === 'FAILED'
                                    ? 'rgba(255, 180, 171, 0.15)'
                                    : 'rgba(208, 188, 255, 0.15)',
                                color:
                                  item.status === 'SENT'
                                    ? '#4edea3'
                                    : item.status === 'APPROVED'
                                    ? '#38bdf8'
                                    : item.status === 'FAILED'
                                    ? '#ffb4ab'
                                    : '#d0bcff',
                              }}
                            >
                              {item.status}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                              {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                            Subject: {item.subject}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.4, margin: 0 }}>
                            {item.body.length > 150 ? `${item.body.substring(0, 150)}...` : item.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* Convert Lead to Deal Button */}
              {selectedLead.status !== 'CONVERTED' && selectedLead.status !== 'CLOSED_WON' && (
                <button onClick={handleConvertLead} disabled={converting} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
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
              <form onSubmit={handleAddNote} style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="text"
                  placeholder="Log quick call or timeline note..."
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
