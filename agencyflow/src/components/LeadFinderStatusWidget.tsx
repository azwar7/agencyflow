'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLeadFinder } from '@/context/LeadFinderContext';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Minimize2,
  Maximize2,
  ArrowRight,
  RotateCcw,
  MapPin,
  Search,
} from 'lucide-react';

export function LeadFinderStatusWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeJob, isJobRunning, isWidgetOpen, setIsWidgetOpen, dismissJob } = useLeadFinder();

  if (!activeJob) return null;

  const isCompleted = activeJob.status === 'COMPLETED';
  const isFailed = activeJob.status === 'FAILED';
  const isProcessing = activeJob.status === 'PROCESSING';
  const isRunning = activeJob.status === 'RUNNING';
  const isStarting = activeJob.status === 'STARTING';

  const handleViewLeads = () => {
    if (pathname === '/leads') {
      window.dispatchEvent(new Event('agencyflow-refresh'));
    } else {
      router.push('/leads');
    }
  };

  const handleTryAgain = () => {
    dismissJob();
    window.dispatchEvent(new Event('agencyflow-open-new-lead'));
  };

  // Minimized Floating Pill Mode
  if (!isWidgetOpen) {
    return (
      <button
        onClick={() => setIsWidgetOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.6rem 1rem',
          borderRadius: '9999px',
          background: isCompleted
            ? 'linear-gradient(135deg, rgba(78, 222, 163, 0.25) 0%, #1c222e 100%)'
            : isFailed
            ? 'linear-gradient(135deg, rgba(255, 180, 171, 0.25) 0%, #1c222e 100%)'
            : 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, #1c222e 100%)',
          border: isCompleted
            ? '1px solid rgba(78, 222, 163, 0.4)'
            : isFailed
            ? '1px solid rgba(255, 180, 171, 0.4)'
            : '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          color: '#fff',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
        }}
        title="Click to view AI Lead Finder details"
      >
        {isCompleted ? (
          <CheckCircle2 size={16} color="#4edea3" />
        ) : isFailed ? (
          <AlertCircle size={16} color="#ffb4ab" />
        ) : (
          <Loader2 size={16} className="spin" color="#38bdf8" />
        )}
        <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>
          {isCompleted
            ? `AI Finder: ${activeJob.leadsFound} Leads Found`
            : isFailed
            ? 'AI Finder: Failed'
            : isProcessing
            ? `AI Finder: ${activeJob.leadsFound} Discovered...`
            : 'AI Finder: Running...'}
        </span>
        <Maximize2 size={13} style={{ opacity: 0.7 }} />
      </button>
    );
  }

  // Full Expanded Floating Dock
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99,
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        background: '#161922',
        borderRadius: '1rem',
        border: isCompleted
          ? '1px solid rgba(78, 222, 163, 0.35)'
          : isFailed
          ? '1px solid rgba(255, 180, 171, 0.35)'
          : '1px solid rgba(56, 189, 248, 0.35)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.08)',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: isCompleted
                ? 'rgba(78, 222, 163, 0.2)'
                : isFailed
                ? 'rgba(255, 180, 171, 0.2)'
                : 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCompleted ? (
              <CheckCircle2 size={16} color="#4edea3" />
            ) : isFailed ? (
              <AlertCircle size={16} color="#ffb4ab" />
            ) : (
              <Sparkles size={16} color="#38bdf8" />
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              AI Lead Finder
              {isJobRunning && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>
              {isCompleted
                ? 'Search Complete'
                : isFailed
                ? 'Workflow Alert'
                : 'Running in Background'}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setIsWidgetOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
            }}
            title="Minimize"
          >
            <Minimize2 size={15} />
          </button>
          <button
            onClick={dismissJob}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
            }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Target Parameters Summary */}
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#c0c1ff' }}>
          <Search size={12} /> <strong style={{ color: '#fff' }}>Query:</strong> {activeJob.query}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#c0c1ff' }}>
          <MapPin size={12} /> <strong style={{ color: '#fff' }}>Location:</strong> {activeJob.location}
        </div>
      </div>

      {/* Indeterminate Animated Progress Bar (While Running) */}
      {isJobRunning && (
        <div style={{ height: '3px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: '45%',
              background: 'linear-gradient(90deg, #38bdf8, #6ffbbe)',
              borderRadius: '2px',
              animation: 'indeterminateWave 1.8s infinite ease-in-out',
            }}
          />
        </div>
      )}

      {/* Main Status Body */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Status Message */}
        <div>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
            {isStarting && 'Starting AI lead search...'}
            {isRunning && 'AI is searching for potential leads...'}
            {isProcessing && `Discovered ${activeJob.leadsFound} potential leads...`}
            {isCompleted && `Search Completed: ${activeJob.leadsFound} Leads Added`}
            {isFailed && 'Lead search could not be completed'}
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.4 }}>
            {isStarting && 'Connecting to multi-source discovery pipeline & initializing Gemini qualification...'}
            {isRunning && 'Scanning Google Places and web listings. You can navigate around AgencyFlow while this runs.'}
            {isProcessing && 'Extracting business emails, phone numbers, and scoring ICP qualification in CRM...'}
            {isCompleted &&
              (activeJob.leadsFound > 0
                ? `${activeJob.leadsFound} new leads were discovered, scored, and added to your Leads pipeline.`
                : 'No new leads matched the query filters. You can refine your search terms and try again.')}
            {isFailed && (activeJob.error || "We couldn't reach the workflow engine. Please try again.")}
          </p>
        </div>

        {/* Live Lead Counter Badge */}
        {activeJob.leadsFound > 0 && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(78, 222, 163, 0.1)',
              border: '1px solid rgba(78, 222, 163, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#4edea3', fontWeight: 600 }}>
              {isCompleted ? 'Total Leads Added' : 'Leads Ingested So Far'}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4edea3' }}>
              +{activeJob.leadsFound}
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          {isJobRunning && (
            <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Loader2 size={12} className="spin" color="#38bdf8" />
              Running in background... Feel free to continue working.
            </div>
          )}

          {isCompleted && (
            <>
              <button
                onClick={handleViewLeads}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #4edea3 0%, #6ffbbe 100%)',
                  color: '#0a2318',
                  border: 'none',
                }}
              >
                View Leads <ArrowRight size={14} />
              </button>
              <button
                onClick={dismissJob}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              >
                Dismiss
              </button>
            </>
          )}

          {isFailed && (
            <>
              <button
                onClick={handleTryAgain}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <RotateCcw size={14} /> Try Again
              </button>
              <button
                onClick={dismissJob}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
