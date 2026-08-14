'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, X, Check } from 'lucide-react';

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    title: 'Sales Pipeline & Deals',
    path: '/pipeline',
    tip: 'Drag & drop deals across customized stages (Discovery, Proposal, Negotiation, Closed Won) with instant monetary sums.',
    icon: 'filter_list',
  },
  {
    title: 'Deliverables & Client Review',
    path: '/deliverables',
    tip: 'Submit deliverables, PDF specs, and design assets for direct client review, approvals, and revision loops.',
    icon: 'inventory_2',
  },
  {
    title: 'Invoicing & Retainers',
    path: '/invoices',
    tip: 'Track agency cash flow, pending invoices, and monthly retainer billing in real time.',
    icon: 'receipt_long',
  },
  {
    title: 'Team & Organization Settings',
    path: '/settings',
    tip: 'Invite team members, assign roles (Owner, Manager, Sales Rep), and customize your client portal domain.',
    icon: 'settings',
  },
];

export function ProductTour({ isOpen, onClose }: ProductTourProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      router.push(TOUR_STEPS[nextIdx].path);
    } else {
      onClose();
      router.push('/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      router.push(TOUR_STEPS[prevIdx].path);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#161922',
          borderRadius: '1rem',
          padding: '1.75rem',
          border: '1px solid var(--primary)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(192, 193, 255, 0.25)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
          }}
          title="Skip Tour"
        >
          <X size={18} />
        </button>

        {/* Step Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(192, 193, 255, 0.15)',
              color: 'var(--primary)',
              fontSize: '0.725rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
          {step.title}
        </h3>

        <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {step.tip}
        </p>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--on-surface-variant)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip Tour
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.375rem',
                  background: 'var(--surface-container-high)',
                  color: 'var(--on-surface)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>Finish <Check size={14} /></>
              ) : (
                <>Next <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
