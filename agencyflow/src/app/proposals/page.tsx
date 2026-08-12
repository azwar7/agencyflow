'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
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
} from 'lucide-react';

interface ProposalItem {
  id: string;
  title: string;
  client: string;
  value: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  preparedBy: string;
  acceptedBy?: string;
  acceptedTitle?: string;
  date: string;
}

const initialProposals: ProposalItem[] = [
  {
    id: 'prop-1',
    title: 'Elevate DTC Brand Campaign Engine SOW',
    client: 'Elevate Creative Co.',
    value: '$36,000',
    status: 'SENT',
    preparedBy: 'David Miller',
    acceptedBy: 'Rachel Green',
    acceptedTitle: 'CEO, Elevate Creative Co.',
    date: 'Aug 10, 2026',
  },
  {
    id: 'prop-2',
    title: 'Summit Logistics Operations Architecture',
    client: 'Summit Logistics',
    value: '$48,000',
    status: 'ACCEPTED',
    preparedBy: 'Marcus Vance',
    acceptedBy: 'John Summit',
    acceptedTitle: 'VP Operations',
    date: 'Aug 05, 2026',
  },
  {
    id: 'prop-3',
    title: 'Vanguard FinTech Mobile MVP Retainer',
    client: 'Vanguard FinTech',
    value: '$65,000',
    status: 'DRAFT',
    preparedBy: 'Elena Rostova',
    date: 'Aug 02, 2026',
  },
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>(initialProposals);
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem>(initialProposals[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newValue, setNewValue] = useState('25000');

  // E-Signature Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState('Rachel Green');
  const [signerTitle, setSignerTitle] = useState('CEO, Elevate Creative Co.');
  const [isSigned, setIsSigned] = useState(false);

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/v1/proposals');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const mapped = json.data.map((d: any) => ({
          id: d.id,
          title: d.title,
          client: d.company?.name || 'Client Account',
          value: `$${d.value?.toLocaleString() || '25,000'}`,
          status: d.stage === 'CLOSED_WON' ? 'ACCEPTED' : d.stage === 'PROPOSAL' ? 'SENT' : 'DRAFT',
          preparedBy: 'David Miller',
          acceptedBy: d.stage === 'CLOSED_WON' ? 'Rachel Green' : undefined,
          acceptedTitle: d.stage === 'CLOSED_WON' ? 'CEO, Elevate Creative Co.' : undefined,
          date: 'Aug 2026',
        }));
        setProposals(mapped);
        setSelectedProposal(mapped[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newClient) return;

    try {
      await fetch('/api/v1/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, value: newValue }),
      });
    } catch (err) {
      console.error(err);
    }

    const created: ProposalItem = {
      id: `prop-${Date.now()}`,
      title: newTitle,
      client: newClient,
      value: `$${Number(newValue).toLocaleString()}`,
      status: 'DRAFT',
      preparedBy: 'Alex Sterling',
      date: 'Just now',
    };

    setProposals([created, ...proposals]);
    setSelectedProposal(created);
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewClient('');
  };

  const handleSignProposal = async () => {
    try {
      await fetch('/api/v1/proposals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProposal.id, stage: 'CLOSED_WON' }),
      });
    } catch (err) {
      console.error(err);
    }

    const updated = proposals.map((p) =>
      p.id === selectedProposal.id
        ? { ...p, status: 'ACCEPTED' as const, acceptedBy: signerName, acceptedTitle: signerTitle }
        : p
    );

    setProposals(updated);
    setSelectedProposal((prev) => ({ ...prev, status: 'ACCEPTED', acceptedBy: signerName, acceptedTitle: signerTitle }));
    setIsSignModalOpen(false);
    setIsSigned(true);
    setTimeout(() => setIsSigned(false), 3000);
  };

  const handleSendProposal = async () => {
    const updated = proposals.map((p) => (p.id === selectedProposal.id ? { ...p, status: 'SENT' as const } : p));
    setProposals(updated);
    setSelectedProposal((prev) => ({ ...prev, status: 'SENT' }));
  };

  const filteredProposals = proposals.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '0.25rem' }}>
              CONTRACT ENGINE
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>Proposals & E-Signatures</h1>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
          >
            <Plus size={18} /> New Proposal
          </button>
        </div>

        {/* Master Detail Split Pane Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left Master Proposals List */}
          <div className="glass-card" style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--surface-container)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-container-high)', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={16} color="var(--on-surface-variant)" />
              <input
                type="text"
                placeholder="Filter proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredProposals.map((p) => {
                const isSelected = selectedProposal.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProposal(p)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '0.75rem',
                      background: isSelected ? 'rgba(192, 193, 255, 0.12)' : 'var(--surface-container-low)',
                      border: isSelected ? '1px solid rgba(192, 193, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{p.client}</span>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          background: p.status === 'ACCEPTED' ? 'rgba(78, 222, 163, 0.2)' : 'rgba(255, 185, 95, 0.2)',
                          color: p.status === 'ACCEPTED' ? 'var(--secondary)' : 'var(--tertiary)',
                        }}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>{p.title}</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)', margin: 0 }}>{p.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Document Preview Workspace */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', background: '#ffffff', color: '#111827', display: 'flex', flexDirection: 'column', gap: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            
            {/* Toolbar Header (Dark Overlay Actions) */}
            <div style={{ background: '#1c1f2a', padding: '0.85rem 1.25rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedProposal.title}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedProposal.status === 'DRAFT' && (
                  <button onClick={handleSendProposal} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}>
                    <Send size={14} /> Send Proposal
                  </button>
                )}

                {selectedProposal.status !== 'ACCEPTED' && (
                  <button onClick={() => setIsSignModalOpen(true)} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', background: 'rgba(78, 222, 163, 0.2)', color: 'var(--secondary)', border: '1px solid rgba(78, 222, 163, 0.3)' }}>
                    <CheckCircle2 size={14} /> Sign E-Signature
                  </button>
                )}

                <button onClick={() => alert(`Downloading ${selectedProposal.title}.pdf`)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={14} /> Download
                </button>
              </div>
            </div>

            {/* Proposal Document Paper Content */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>AGENCYFLOW SERVICES AGREEMENT</h2>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Statement of Work & Commercial Terms</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f46e5' }}>{selectedProposal.value}</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Date: {selectedProposal.date}</p>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>1. Scope of Engagement</h3>
                <p style={{ fontSize: '0.9rem', color: '#374151' }}>
                  This Master Services Agreement outlines the strategic deliverables, technical architecture, and milestones provided for {selectedProposal.client}. AgencyFlow will allocate dedicated engineering and design capacity to ensure completion per milestones.
                </p>
              </div>

              {/* Complete Signature Section (100% Contained Inside White Document) */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* Prepared By */}
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '1rem' }}>PREPARED BY:</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>{selectedProposal.preparedBy}</p>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0 }}>Lead Solutions Architect</p>
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #9ca3af', paddingTop: '0.4rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    Authorized Agency Representative Signature
                  </div>
                </div>

                {/* Accepted By */}
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '1rem' }}>ACCEPTED BY:</p>
                  {selectedProposal.acceptedBy ? (
                    <>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: '#059669', margin: 0 }}>✓ {selectedProposal.acceptedBy}</p>
                      <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0 }}>{selectedProposal.acceptedTitle || 'Authorized Client Signer'}</p>
                      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #059669', paddingTop: '0.4rem', fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                        Electronically Signed & Validated
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 700, margin: 0 }}>AWAITING CLIENT E-SIGNATURE</p>
                      <div style={{ marginTop: '2.5rem', borderTop: '1px dashed #9ca3af', paddingTop: '0.4rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Client Authorized Signature Line
                      </div>
                    </>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* New Proposal Modal */}
      {isNewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', background: '#1c1f2a', borderRadius: '1rem', padding: '1.75rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>Create Proposal</h2>
              <button onClick={() => setIsNewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Proposal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elevate DTC Campaign Architecture SOW"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Client Account *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elevate Creative Co."
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Commercial Value ($)</label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Signature Approval Modal */}
      {isSignModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', background: '#1c1f2a', borderRadius: '1rem', padding: '1.75rem', border: '1px solid rgba(78, 222, 163, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="var(--secondary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>E-Signature Approval</h2>
              </div>
              <button onClick={() => setIsSignModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Signer Full Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Title & Organization</label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'rgba(78, 222, 163, 0.15)', border: '1px solid rgba(78, 222, 163, 0.3)', color: 'var(--secondary)', fontSize: '0.75rem' }}>
                By clicking "Approve & Sign", you confirm authorization to accept commercial terms on behalf of {selectedProposal.client}.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsSignModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSignProposal} className="btn btn-primary" style={{ background: 'var(--secondary-container)', color: '#000', fontWeight: 700 }}>
                  Approve & Sign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
