'use client';

import React, { useState } from 'react';
import { Sparkles, Trash2, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SampleDataBanner() {
  const { isSampleData, clearSampleData } = useAuth();
  const [clearing, setClearing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isSampleData || dismissed) return null;

  const handleClear = async () => {
    setClearing(true);
    await clearSampleData();
    setClearing(false);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(78, 222, 163, 0.15) 0%, rgba(192, 193, 255, 0.12) 100%)',
        borderBottom: '1px solid rgba(78, 222, 163, 0.3)',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        zIndex: 50,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--on-surface)' }}>
        <div
          style={{
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            background: 'var(--secondary)',
            color: 'var(--on-secondary)',
            fontWeight: 800,
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Demo Mode
        </div>
        <span>
          You're viewing <strong>sample demonstration data</strong>. Feel free to explore how deals, deliverables, and invoices work.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={handleClear}
          disabled={clearing}
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '0.375rem',
            background: 'rgba(255, 180, 171, 0.15)',
            border: '1px solid rgba(255, 180, 171, 0.35)',
            color: '#ffb4ab',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Trash2 size={13} />
          {clearing ? 'Clearing Demo Data...' : 'Clear Sample Data'}
        </button>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0.2rem',
          }}
          title="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
