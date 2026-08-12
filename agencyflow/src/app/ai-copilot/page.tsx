'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Sparkles,
  Sliders,
  User,
  Layers,
  CheckCircle,
  Copy,
  Send,
  RefreshCw,
  Edit2,
  Check,
  Zap,
} from 'lucide-react';

export default function AICopilotPage() {
  const [selectedTone, setSelectedTone] = useState<'standard' | 'urgent' | 'executive'>('executive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [crmSent, setCrmSent] = useState(false);

  const [subject, setSubject] = useState('Time-sensitive: Next steps for TechFlow Systems');
  const [messageBody, setMessageBody] = useState(
    `David,

Following up on our review of the Architecture Spec this morning. The technical path outlined aligns perfectly with your scaling goals for Q3.

Given the timeline discussed, we need sign-off on the Phase 1 deliverables by Friday to ensure the infrastructure team can begin provisioning next week without delaying the alpha launch.

I've attached the finalized spec document for your executive team's review. Let me know if you need a quick 10-minute sync tomorrow to clarify any of the final integration points.

Best regards,

David Miller
AgencyFlow Lead`
  );

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      if (selectedTone === 'urgent') {
        setSubject('URGENT: Action Required for TechFlow Systems Launch');
        setMessageBody(
          `David,\n\nWe require urgent sign-off on the Architecture Spec by end-of-day today to prevent delaying our launch schedule.\n\nPlease review and approve at your earliest convenience.\n\nBest regards,\nDavid Miller`
        );
      } else if (selectedTone === 'standard') {
        setSubject('Follow-up: Architecture Spec Review');
        setMessageBody(
          `Hi David,\n\nThanks for your time this morning reviewing the Architecture Spec. Please let me know if you have any questions before signing off.\n\nBest,\nDavid Miller`
        );
      } else {
        setSubject('Time-sensitive: Next steps for TechFlow Systems');
        setMessageBody(
          `David,\n\nFollowing up on our review of the Architecture Spec this morning. The technical path outlined aligns perfectly with your scaling goals for Q3.\n\nGiven the timeline discussed, we need sign-off on the Phase 1 deliverables by Friday to ensure the infrastructure team can begin provisioning next week without delaying the alpha launch.\n\nI've attached the finalized spec document for your executive team's review. Let me know if you need a quick 10-minute sync tomorrow to clarify any of the final integration points.\n\nBest regards,\nDavid Miller`
        );
      }
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${subject}\n\n${messageBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToCRM = () => {
    setCrmSent(true);
    setTimeout(() => setCrmSent(false), 3000);
  };

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Workspace Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '0.25rem' }}>
              WORKSPACE
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>
              AI Sales Copilot
            </h1>
          </div>

          <div
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '9999px',
              background: 'var(--surface-container-high)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 10px var(--secondary)',
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
              Copilot Active
            </span>
          </div>
        </div>

        {/* Main Workspace 12-Column Desktop Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', alignItems: 'stretch' }}>
          {/* Left Column: Strategy & Tone Configuration (4 cols) */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                background: 'var(--surface-container)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle top orb blur */}
              <div
                style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(192, 193, 255, 0.15)',
                  filter: 'blur(35px)',
                  pointerEvents: 'none',
                }}
              />

              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <Sliders size={20} color="var(--primary)" /> Strategy & Tone Configuration
              </h3>

              {/* Context Markers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-low)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 185, 95, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="var(--tertiary)" />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Recipient</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>David Miller</p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-low)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(78, 222, 163, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={16} color="var(--secondary)" />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Context</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>Post-Architecture Review</p>
                  </div>
                </div>
              </div>

              {/* Tone Selectors */}
              <div style={{ marginBottom: '1.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500, marginBottom: '0.75rem' }}>Select Tone</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { id: 'standard', label: 'Standard Professional' },
                    { id: 'urgent', label: 'Time-Sensitive Decision' },
                    { id: 'executive', label: 'Executive C-Suite Briefing' },
                  ].map((t) => {
                    const isSel = selectedTone === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTone(t.id as any)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          textAlign: 'left',
                          fontSize: '0.875rem',
                          fontWeight: isSel ? 600 : 400,
                          background: isSel ? 'rgba(128, 131, 255, 0.2)' : 'var(--surface-container-high)',
                          color: isSel ? 'var(--primary)' : 'var(--on-surface)',
                          border: isSel ? '1px solid rgba(192, 193, 255, 0.4)' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          boxShadow: isSel ? '0 0 15px rgba(192, 193, 255, 0.15)' : 'none',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isSel && <CheckCircle size={16} color="var(--primary)" />}
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Draft Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem 1rem',
                  background: 'var(--inverse-primary)',
                  color: 'var(--on-primary)',
                  boxShadow: '0 0 20px rgba(73, 75, 214, 0.4)',
                }}
              >
                <Zap size={18} />
                {isGenerating ? 'Generating Draft...' : 'Generate Follow-up Draft'}
              </button>
            </div>

            {/* Response Rate Probability Widget */}
            <div
              className="glass-card"
              style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                background: 'var(--surface-container)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Response Rate Probability</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.2rem' }}>84%</p>
              </div>

              {/* Simple Donut SVG */}
              <svg width="48" height="48" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--surface-container-highest)" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--secondary)" strokeWidth="4" strokeDasharray="84, 100" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Right Column: AI Draft Output Workspace (8 cols) */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column' }}>
            <div
              className="glass-card"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '1rem',
                background: 'rgba(28, 31, 42, 0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}
            >
              {/* Output Header */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'var(--surface-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)' }}>Generated Draft</h3>
                </div>

                <div
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    background: 'rgba(0, 165, 114, 0.2)',
                    border: '1px solid rgba(78, 222, 163, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <CheckCircle size={14} color="var(--secondary)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary)' }}>AI Confidence: 96%</span>
                </div>
              </div>

              {/* Draft Content Fields */}
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Subject Field */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.4rem' }}>
                    SUBJECT
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--surface-container-low)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'var(--on-surface)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Message Body Field */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      MESSAGE BODY
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Edited 2 mins ago</span>
                  </div>

                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    style={{
                      width: '100%',
                      flex: 1,
                      minHeight: '260px',
                      padding: '1.25rem',
                      background: 'var(--surface-container-low)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      color: 'var(--on-surface)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Action Footer */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(28, 31, 42, 0.3)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                }}
              >
                <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                  {copied ? <Check size={16} color="var(--secondary)" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>

                <button onClick={handleSendToCRM} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  {crmSent ? <Check size={16} color="var(--on-primary)" /> : <Send size={16} />}
                  {crmSent ? 'Sent to CRM!' : 'Send to CRM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
