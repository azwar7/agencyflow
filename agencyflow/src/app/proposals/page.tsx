'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Printer,
  Plus,
  Search,
  X,
  ShieldCheck,
  Building2,
  UserCheck,
  Check,
  AlertCircle,
  FileCheck,
  Sparkles,
  RefreshCw,
  Layers,
  DollarSign,
  Calendar,
  Trash2,
  ArrowRight,
  Target,
  Edit3,
  ExternalLink,
} from 'lucide-react';

interface ScopePhase {
  phase: string;
  duration: string;
  description: string;
  deliverables: string[];
}

interface PricingItem {
  item: string;
  description: string;
  price: number;
}

interface ProposalItem {
  id: string;
  title: string;
  client: string;
  value: number;
  valueFormatted: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  summary?: string;
  scopeOfWork?: ScopePhase[];
  deliverables?: string[];
  pricingItems?: PricingItem[];
  paymentTerms?: string;
  leadId?: string;
  preparedBy: string;
  acceptedBy?: string;
  acceptedTitle?: string;
  date: string;
  createdAt: string;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<any[]>([]);

  // AI Proposal Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [aiClientName, setAiClientName] = useState('');
  const [aiBudget, setAiBudget] = useState('24000');
  const [aiTimeline, setAiTimeline] = useState('6');
  const [aiCustomScope, setAiCustomScope] = useState('');
  const [generating, setGenerating] = useState(false);

  // Blank Proposal Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newValue, setNewValue] = useState('25000');

  // E-Signature Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signing, setSigning] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Fetch Proposals & Leads
  const fetchProposals = async () => {
    setLoading(true);
    setError('');
    try {
      const [propRes, leadRes] = await Promise.all([
        fetch('/api/v1/proposals'),
        fetch('/api/v1/leads'),
      ]);

      const propJson = await propRes.json();
      const leadJson = await leadRes.json();

      if (propJson.success && Array.isArray(propJson.data)) {
        setProposals(propJson.data);
        if (propJson.data.length > 0) {
          // Keep current selection if valid, or select the first
          setSelectedProposal((prev) =>
            prev ? propJson.data.find((p: ProposalItem) => p.id === prev.id) || propJson.data[0] : propJson.data[0]
          );
        } else {
          setSelectedProposal(null);
        }
      }

      if (leadJson.success && Array.isArray(leadJson.data)) {
        setLeads(leadJson.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // 1. Generate Proposal with AI
  const handleGenerateAiProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setSuccessBanner(null);
    try {
      const res = await fetch('/api/v1/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId || undefined,
          clientName: aiClientName || undefined,
          budget: Number(aiBudget) || 24000,
          timelineWeeks: Number(aiTimeline) || 6,
          customScope: aiCustomScope || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to generate proposal');

      setIsAiModalOpen(false);
      setSelectedLeadId('');
      setAiClientName('');
      setAiCustomScope('');
      setSuccessBanner(`✨ AI Proposal "${json.data.title}" generated successfully!`);
      fetchProposals();
    } catch (err: any) {
      alert(`AI Proposal Generation Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // 2. Create Blank Proposal
  const handleCreateBlankProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newClient) return;

    try {
      const res = await fetch('/api/v1/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          client: newClient,
          value: Number(newValue) || 25000,
          status: 'DRAFT',
          summary: 'Standard agency services agreement outlining deliverables, milestones, and project execution roadmap.',
          pricingItems: [
            { item: 'Core Application & Strategy', description: 'Primary project architecture and deployment', price: Number(newValue) || 25000 },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsNewModalOpen(false);
        setNewTitle('');
        setNewClient('');
        fetchProposals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Digital Sign & Auto-Project Spawn
  const handleSignProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !signerName.trim() || !signerTitle.trim()) return;
    setSigning(true);

    try {
      const res = await fetch(`/api/v1/proposals/${selectedProposal.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signerTitle: signerTitle.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to sign proposal');

      setIsSignModalOpen(false);
      setSignerName('');
      setSignerTitle('');
      setSuccessBanner(`🎉 Proposal Signed! Active Project spawned and 50% deposit invoice created.`);
      fetchProposals();
    } catch (err: any) {
      alert(`Signing Error: ${err.message}`);
    } finally {
      setSigning(false);
    }
  };

  // 4. Send Proposal to Client (via n8n email)
  const handleSendProposal = async () => {
    if (!selectedProposal) return;
    try {
      await fetch('/api/v1/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProposal.id, status: 'SENT' }),
      });
      setSuccessBanner(`✉️ Proposal marked as SENT to ${selectedProposal.client}!`);
      fetchProposals();
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Delete Proposal
  const handleDeleteProposal = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await fetch(`/api/v1/proposals?id=${id}`, { method: 'DELETE' });
      fetchProposals();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProposals = proposals.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', padding: '1.25rem 2rem 0' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={24} color="#d0bcff" /> Client Proposals & SOW Hub
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
              AI-generated scopes of work, itemized investment roadmaps, and digital e-signatures.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                border: 'none',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
              }}
            >
              <Sparkles size={16} /> Generate AI Proposal
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Plus size={16} /> Blank Proposal
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(78, 222, 163, 0.12)',
              border: '1px solid rgba(78, 222, 163, 0.3)',
              color: '#4edea3',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> {successBanner}
            </div>
            <button onClick={() => setSuccessBanner(null)} style={{ background: 'transparent', border: 'none', color: '#4edea3', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Master-Detail Split Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', flex: 1 }}>
            <div className="skeleton-pulse" style={{ borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton-pulse" style={{ borderRadius: 'var(--radius-lg)' }} />
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchProposals} />
        ) : proposals.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No proposals drafted yet"
            description="Generate high-converting, phased Statement of Work (SOW) documents tailored to your client's needs."
            actionLabel="✨ Generate First AI Proposal"
            onAction={() => setIsAiModalOpen(true)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', flex: 1, minHeight: 0, paddingBottom: '1.5rem' }}>
            {/* Left Sidebar: Proposals Directory */}
            <div
              style={{
                background: 'var(--surface-container-lowest)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Search Bar */}
              <div style={{ padding: '0.9rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                  <input
                    type="text"
                    placeholder="Search proposals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem 0.45rem 2rem',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Proposals List */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {filteredProposals.map((p) => {
                  const isSelected = selectedProposal?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProposal(p)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(208, 188, 255, 0.12)' : 'var(--surface-container)',
                        border: isSelected ? '1px solid rgba(208, 188, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background:
                              p.status === 'ACCEPTED'
                                ? 'rgba(78, 222, 163, 0.18)'
                                : p.status === 'SENT'
                                ? 'rgba(56, 189, 248, 0.18)'
                                : p.status === 'REJECTED'
                                ? 'rgba(255, 180, 171, 0.18)'
                                : 'rgba(208, 188, 255, 0.15)',
                            color:
                              p.status === 'ACCEPTED'
                                ? '#4edea3'
                                : p.status === 'SENT'
                                ? '#38bdf8'
                                : p.status === 'REJECTED'
                                ? '#ffb4ab'
                                : '#d0bcff',
                          }}
                        >
                          {p.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                          {p.valueFormatted || `$${p.value.toLocaleString()}`}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0, lineHeight: 1.3 }}>
                        {p.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                        <span>{p.client}</span>
                        <span>{p.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Live Interactive Proposal Document Viewer */}
            {selectedProposal ? (
              <div
                style={{
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Proposal Top Action Toolbar */}
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--surface-container-low)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background:
                          selectedProposal.status === 'ACCEPTED'
                            ? 'rgba(78, 222, 163, 0.2)'
                            : selectedProposal.status === 'SENT'
                            ? 'rgba(56, 189, 248, 0.2)'
                            : 'rgba(208, 188, 255, 0.15)',
                        color:
                          selectedProposal.status === 'ACCEPTED'
                            ? '#4edea3'
                            : selectedProposal.status === 'SENT'
                            ? '#38bdf8'
                            : '#d0bcff',
                      }}
                    >
                      {selectedProposal.status}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                      Prepared by <strong>{selectedProposal.preparedBy}</strong> on {selectedProposal.date}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Print / Export Button */}
                    <button
                      onClick={() => window.print()}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Printer size={14} /> Print / PDF
                    </button>

                    {/* Send to Client Button */}
                    {selectedProposal.status === 'DRAFT' && (
                      <button
                        onClick={handleSendProposal}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8' }}
                      >
                        <Send size={14} /> Mark as Sent
                      </button>
                    )}

                    {/* Accept & Sign Button */}
                    {selectedProposal.status !== 'ACCEPTED' && (
                      <button
                        onClick={() => {
                          setSignerName(selectedProposal.client);
                          setSignerTitle('Authorized Representative');
                          setIsSignModalOpen(true);
                        }}
                        className="btn btn-primary"
                        style={{
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.75rem',
                          background: '#4edea3',
                          color: '#003822',
                          border: 'none',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <ShieldCheck size={14} /> Sign & Accept Proposal
                      </button>
                    )}

                    {/* Delete Proposal */}
                    <button
                      onClick={() => handleDeleteProposal(selectedProposal.id, selectedProposal.title)}
                      style={{ background: 'transparent', border: 'none', color: '#ffb4ab', cursor: 'pointer', padding: '4px' }}
                      title="Delete Proposal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Printable Document Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {/* Document Title & Client Badge */}
                  <div style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Agency Master Services Agreement & Scope of Work
                      </span>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem', lineHeight: 1.3 }}>
                        {selectedProposal.title}
                      </h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginTop: '0.3rem' }}>
                        Prepared for: <strong style={{ color: '#fff' }}>{selectedProposal.client}</strong>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', background: 'var(--surface-container-high)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Total Project Investment
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4edea3' }}>
                        {selectedProposal.valueFormatted || `$${selectedProposal.value.toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  {/* 1. Executive Summary */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d0bcff', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Target size={18} /> 1. Executive Summary & Strategic Objectives
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#e2e2e8', lineHeight: 1.7, margin: 0, background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {selectedProposal.summary || 'This comprehensive Statement of Work defines the technical architecture, custom application engineering, and automated CRM ingestion pipelines to accelerate business growth and streamline digital customer acquisition.'}
                    </p>
                  </div>

                  {/* 2. Scope of Work (Phased Implementation) */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d0bcff', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Layers size={18} /> 2. Phased Scope of Work (SOW)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {selectedProposal.scopeOfWork && selectedProposal.scopeOfWork.length > 0 ? (
                        selectedProposal.scopeOfWork.map((ph, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--surface-container)',
                              borderRadius: '8px',
                              padding: '1rem 1.25rem',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                                {ph.phase}
                              </h4>
                              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                                {ph.duration}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.825rem', color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: '0 0 0.6rem 0' }}>
                              {ph.description}
                            </p>
                            {ph.deliverables && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {ph.deliverables.map((del, dIdx) => (
                                  <span key={dIdx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: '#e2e2e8' }}>
                                    ✓ {del}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                          Standard 4-phase agile implementation covering Architecture & Design, Full-Stack Engineering, Automated Workflows, and Production Deployment.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Itemized Investment & Pricing Table */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d0bcff', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <DollarSign size={18} /> 3. Itemized Investment & Pricing Breakdown
                    </h3>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--on-surface)', fontWeight: 700 }}>Service / Module</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--on-surface)', fontWeight: 700 }}>Scope Details</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--on-surface)', fontWeight: 700, textAlign: 'right' }}>Investment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProposal.pricingItems && selectedProposal.pricingItems.length > 0 ? (
                            selectedProposal.pricingItems.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'var(--surface-container-lowest)' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>{item.item}</td>
                                <td style={{ padding: '0.75rem 1rem', color: 'var(--on-surface-variant)' }}>{item.description}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#4edea3' }}>
                                  ${item.price.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr style={{ background: 'var(--surface-container-lowest)' }}>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>Full-Stack Digital Transformation</td>
                              <td style={{ padding: '0.75rem 1rem', color: 'var(--on-surface-variant)' }}>End-to-end custom application development & automation</td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#4edea3' }}>
                                {selectedProposal.valueFormatted || `$${selectedProposal.value.toLocaleString()}`}
                              </td>
                            </tr>
                          )}
                          <tr style={{ background: 'var(--surface-container-high)', fontWeight: 800 }}>
                            <td colSpan={2} style={{ padding: '0.85rem 1rem', color: '#fff', fontSize: '0.95rem' }}>Total Contract Value</td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#4edea3', fontSize: '1.1rem' }}>
                              {selectedProposal.valueFormatted || `$${selectedProposal.value.toLocaleString()}`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. Payment Schedule & Terms */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d0bcff', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={18} /> 4. Milestone Payment Terms
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#e2e2e8', lineHeight: 1.6, margin: 0, background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {selectedProposal.paymentTerms || '50% deposit upon contract signing, 25% upon mid-project milestone review, and 25% upon final production deployment and handover.'}
                    </p>
                  </div>

                  {/* 5. Formal E-Signature Block */}
                  <div style={{ borderTop: '2px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Agency Signature */}
                    <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                        Authorized Agency Signature
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#d0bcff', fontWeight: 700, marginBottom: '0.25rem' }}>
                        {selectedProposal.preparedBy}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                        Managing Director, AgencyFlow
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#4edea3', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Check size={14} /> Verified Agency Representative
                      </div>
                    </div>

                    {/* Client Signature */}
                    <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                        Client Acceptance & Signature
                      </div>
                      {selectedProposal.status === 'ACCEPTED' ? (
                        <>
                          <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#4edea3', fontWeight: 700, marginBottom: '0.25rem' }}>
                            {selectedProposal.acceptedBy || selectedProposal.client}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                            {selectedProposal.acceptedTitle || 'Authorized Executive'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#4edea3', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <ShieldCheck size={14} /> Digitally Signed & Accepted
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem' }}>
                            Awaiting client signature
                          </p>
                          <button
                            onClick={() => {
                              setSignerName(selectedProposal.client);
                              setSignerTitle('Authorized Representative');
                              setIsSignModalOpen(true);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%' }}
                          >
                            <ShieldCheck size={15} /> Sign & Accept Proposal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* AI Proposal Generator Modal */}
        {isAiModalOpen && (
          <div className="drawer-backdrop" onClick={() => setIsAiModalOpen(false)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '560px', maxWidth: '95vw', background: '#181a20', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Sparkles size={20} color="#a855f7" /> Generate AI Proposal & SOW
                </h3>
                <button onClick={() => setIsAiModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleGenerateAiProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Select from CRM Leads */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Attach to CRM Lead (Pulls AI Pitch & Bottlenecks):
                  </label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => {
                      setSelectedLeadId(e.target.value);
                      const match = leads.find((l) => l.id === e.target.value);
                      if (match) {
                        setAiClientName(match.companyName || `${match.firstName} ${match.lastName}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Choose a Lead from CRM (Optional) --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.companyName || `${l.firstName} ${l.lastName}`} (Score: {l.leadScore}/100)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Name Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Client / Organization Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohmand Property Dealers, Apex Heating..."
                    value={aiClientName}
                    onChange={(e) => setAiClientName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Budget & Timeline Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Target Budget ($ USD):
                    </label>
                    <input
                      type="number"
                      value={aiBudget}
                      onChange={(e) => setAiBudget(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--surface-container-high)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Target Timeline (Weeks):
                    </label>
                    <input
                      type="number"
                      value={aiTimeline}
                      onChange={(e) => setAiTimeline(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--surface-container-high)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Custom Scope / Instructions */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Special Deliverables or Client Instructions (Optional):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Include interactive property map catalog, WhatsApp booking webhook, and 60 days post-launch support..."
                    value={aiCustomScope}
                    onChange={(e) => setAiCustomScope(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                    border: 'none',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {generating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {generating ? 'Drafting Professional SOW...' : 'Generate AI Proposal Now'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Blank Proposal Modal */}
        {isNewModalOpen && (
          <div className="drawer-backdrop" onClick={() => setIsNewModalOpen(false)}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '95vw', background: '#181a20', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Create Blank Proposal</h3>
                <button onClick={() => setIsNewModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <form onSubmit={handleCreateBlankProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>Proposal Title:</label>
                  <input type="text" required placeholder="e.g. Master Services Agreement SOW" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>Client Organization:</label>
                  <input type="text" required placeholder="e.g. Acme Corp" value={newClient} onChange={(e) => setNewClient(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>Contract Value ($ USD):</label>
                  <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem' }}>Create Proposal</button>
              </form>
            </div>
          </div>
        )}

        {/* Digital E-Signature Modal */}
        {isSignModalOpen && selectedProposal && (
          <div className="drawer-backdrop" onClick={() => setIsSignModalOpen(false)}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ width: '480px', maxWidth: '95vw', background: '#181a20', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4edea3', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <ShieldCheck size={20} /> E-Sign & Accept Proposal
                </h3>
                <button onClick={() => setIsSignModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
                Signing this proposal will automatically mark it as <strong>ACCEPTED</strong>, spawn an active <strong>Project</strong> in your Projects board, and draft a 50% deposit invoice.
              </p>

              <form onSubmit={handleSignProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>Signer Full Name:</label>
                  <input type="text" required placeholder="e.g. Sarah Jenkins" value={signerName} onChange={(e) => setSignerName(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>Signer Title / Role:</label>
                  <input type="text" required placeholder="e.g. Managing Partner, CEO" value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                </div>

                <button
                  type="submit"
                  disabled={signing}
                  style={{
                    padding: '0.75rem',
                    background: '#4edea3',
                    color: '#003822',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {signing ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {signing ? 'Recording Signature & Spawning Project...' : 'Confirm Digital Signature'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
