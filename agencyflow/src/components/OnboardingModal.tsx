'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Play, LayoutGrid, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AgencyFlowLogo from '@/components/AgencyFlowLogo';

interface OnboardingModalProps {
  onStartTour: () => void;
}

export function OnboardingModal({ onStartTour }: OnboardingModalProps) {
  const { isFirstLogin, user, dismissOnboarding, loadSampleData } = useAuth();
  const [loadingSample, setLoadingSample] = useState(false);

  if (!isFirstLogin) return null;

  const handleLoadSampleAndClose = async () => {
    setLoadingSample(true);
    await loadSampleData();
    setLoadingSample(false);
    dismissOnboarding();
  };

  const handleStartTourAndClose = () => {
    dismissOnboarding();
    onStartTour();
  };

  const agencyName = user?.agency || 'Your Agency';

  const onboardingSteps = [
    { number: '1', title: 'Add your first client', desc: 'Organize organizations, stakeholders, and retainers.' },
    { number: '2', title: 'Create a deal in pipeline', desc: 'Track sales stages from Discovery to Closed Won.' },
    { number: '3', title: 'Submit deliverables & invoices', desc: 'Deliver work with client review & automated billing.' },
    { number: '4', title: 'AI Copilot & Lead Scoring', desc: 'Qualify inbound prospects and draft contextual follow-ups.' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#141824',
          borderRadius: '1.25rem',
          padding: '2.5rem 2rem',
          border: '1px solid rgba(192, 193, 255, 0.25)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(192, 193, 255, 0.1)',
          position: 'relative',
        }}
      >
        <button
          onClick={dismissOnboarding}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <AgencyFlowLogo height={36} />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '1rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(192, 193, 255, 0.12)',
              border: '1px solid rgba(192, 193, 255, 0.25)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Sparkles size={14} /> Workspace Provisioned
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.6rem' }}>
            Welcome to {agencyName}!
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
            Your dedicated multi-tenant workspace is live, secure, and ready for operations.
          </p>
        </div>

        {/* 4 Step Roadmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {onboardingSteps.map((step) => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.6rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(192, 193, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  flexShrink: 0,
                  marginTop: '0.1rem',
                }}
              >
                {step.number}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--on-surface-variant)', marginTop: '0.15rem' }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button
            onClick={handleStartTourAndClose}
            className="btn btn-primary"
            style={{
              padding: '0.8rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '0.5rem',
            }}
          >
            <Play size={16} /> Start 1-Minute Interactive Tour
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              onClick={handleLoadSampleAndClose}
              disabled={loadingSample}
              style={{
                padding: '0.65rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'rgba(78, 222, 163, 0.1)',
                border: '1px solid rgba(78, 222, 163, 0.3)',
                color: 'var(--secondary)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Sparkles size={14} />
              {loadingSample ? 'Loading Data...' : 'Explore Demo Data'}
            </button>

            <button
              onClick={dismissOnboarding}
              style={{
                padding: '0.65rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'var(--surface-container)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--on-surface-variant)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              Start Clean (Empty)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
