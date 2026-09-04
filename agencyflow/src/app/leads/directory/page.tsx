'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { X, Sparkles, Send, ArrowRight, Phone, Mail, Building } from 'lucide-react';

export default function LeadsDirectoryPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Selected Lead Slide-Over Drawer State
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [scoringLoading, setScoringLoading] = useState(false);
  const [converting, setConverting] = useState(false);

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
  }, [sourceFilter]);

  const openLeadDrawer = async (lead: any) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/v1/leads/${lead.id}`);
      const json = await res.json();
      if (json.success) setSelectedLead(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedLead(null), 300);
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
        openLeadDrawer(selectedLead);
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
          dealTitle: `${selectedLead.companyName || selectedLead.firstName} Contract`,
          dealValue,
        }),
      });
      const json = await res.json();
      if (json.success) {
        closeDrawer();
        fetchLeads();
        window.dispatchEvent(new Event('agencyflow-refresh'));
        alert(`Lead successfully converted to Active Deal${dealValue > 0 ? ` with value $${dealValue.toLocaleString()}` : ''}!`);
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

  return (
    <AppShell>
      <div className="page-content" style={{ paddingBottom: 0, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          {/* Header Title Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--on-surface)' }}>
                Leads Directory
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
                Manage and qualify inbound prospects.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-DEFAULT)',
                  color: 'var(--on-surface)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Filter by Source</option>
                <option value="Inbound Form">Inbound Form</option>
                <option value="LinkedIn Ads">LinkedIn Ads</option>
                <option value="Referral">Referral</option>
              </select>

              <button className="btn btn-primary">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  add
                </span>
                New Lead
              </button>
            </div>
          </div>

          {/* Leads Table Container */}
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Loading directory...</div>
            ) : error ? (
              <UIStateCard type="error" description={error} onRetry={fetchLeads} />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>LEAD NAME</th>
                    <th>CONTACT</th>
                    <th>COMPANY</th>
                    <th>AI SCORE</th>
                    <th>STATUS</th>
                    <th>SOURCE</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => {
                    const initials = `${l.firstName?.[0] || ''}${l.lastName?.[0] || ''}`;
                    const isSelected = selectedLead?.id === l.id;

                    return (
                      <tr
                        key={l.id}
                        onClick={() => openLeadDrawer(l)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(192, 193, 255, 0.08)' : 'transparent',
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(192, 193, 255, 0.2)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              {initials}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
                              {l.firstName} {l.lastName}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--on-surface-variant)' }}>{l.email}</td>
                        <td style={{ color: 'var(--on-surface)', fontWeight: 500 }}>{l.companyName || '—'}</td>
                        <td>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              background: 'rgba(0, 165, 114, 0.15)',
                              color: 'var(--secondary)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              bolt
                            </span>
                            {l.leadScore}/100
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              background: 'rgba(192, 193, 255, 0.15)',
                              color: 'var(--primary)',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--on-surface-variant)' }}>{l.source || 'Inbound Form'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            style={{
                              color: 'var(--primary)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Slide-Over Overlay Backdrop */}
        {drawerOpen && (
          <div
            onClick={closeDrawer}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
            }}
          />
        )}

        {/* Anchor Screen 3: Slide-Over Detail Drawer */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '520px',
            maxWidth: '100%',
            background: 'var(--surface-container-lowest)',
            borderLeft: '1px solid rgba(144, 143, 160, 0.2)',
            zIndex: 60,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.2, 1, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {selectedLead && (
            <>
              {/* Drawer Header */}
              <div style={{ padding: '1.75rem 2rem 1.25rem 2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative' }}>
                <button
                  onClick={closeDrawer}
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(192, 193, 255, 0.2)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      boxShadow: '0 0 20px rgba(192, 193, 255, 0.15)',
                    }}
                  >
                    {selectedLead.firstName?.[0]}
                    {selectedLead.lastName?.[0]}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                        {selectedLead.firstName} {selectedLead.lastName}
                      </h2>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: 'rgba(192, 193, 255, 0.2)',
                          color: 'var(--primary)',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {selectedLead.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        business
                      </span>
                      {selectedLead.companyName || 'Nexus Cloud'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>EMAIL</span>
                    <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)', marginTop: '0.1rem' }}>{selectedLead.email}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>PHONE</span>
                    <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)', marginTop: '0.1rem' }}>+1 (555) 293-9482</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* AI Qualification Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(128, 131, 255, 0.15), rgba(28, 31, 42, 0.8))',
                    border: '1px solid rgba(192, 193, 255, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          auto_awesome
                        </span>
                        AI QUALIFICATION
                      </span>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.2rem' }}>
                        {selectedLead.leadScore}
                        <span style={{ fontSize: '1.25rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>/100</span>
                      </div>
                    </div>

                    <button onClick={handleRunAIScoring} disabled={scoringLoading} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                      {scoringLoading ? 'Evaluating...' : 'Re-Score'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '18px' }}>
                        check_circle
                      </span>
                      Verified corporate email domain
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '18px' }}>
                        check_circle
                      </span>
                      High-intent budget range <strong style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>$45k-$60k</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '18px' }}>
                        warning
                      </span>
                      Timeline unclear in initial request
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button onClick={handleConvertLead} disabled={converting} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}>
                  {converting ? 'Converting...' : 'Convert to Active Deal'}
                  <ArrowRight size={18} />
                </button>

                {/* Activity Timeline */}
                <div>
                  <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '1rem' }}>
                    ACTIVITY TIMELINE
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-1.35rem', top: '0.2rem', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>Discovery call logged</p>
                      <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>2h ago by Alex Rivera</span>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-1.35rem', top: '0.2rem', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--surface-container-highest)', border: '2px solid rgba(255, 255, 255, 0.2)' }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>Email sent via AI Assistant</p>
                      <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Yesterday</span>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-1.35rem', top: '0.2rem', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--surface-container-highest)', border: '2px solid rgba(255, 255, 255, 0.2)' }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>Lead captured</p>
                      <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Oct 12, 2023 - Inbound Form</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Input Logger */}
              <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(15, 19, 29, 0.8)' }}>
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Add a note or log activity..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '9999px',
                      padding: '0.65rem 3rem 0.65rem 1.25rem',
                      fontSize: '0.875rem',
                      color: 'var(--on-surface)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: 'var(--on-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
