'use client';

import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showSampleDataPrompt?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showSampleDataPrompt = true,
}: EmptyStateProps) {
  const { loadSampleData } = useAuth();
  const [loadingSample, setLoadingSample] = React.useState(false);

  const handleLoadSample = async () => {
    setLoadingSample(true);
    await loadSampleData();
    setLoadingSample(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'var(--surface-container-low)',
        border: '1px dashed rgba(255, 255, 255, 0.12)',
        borderRadius: '1rem',
        margin: '1.5rem 0',
      }}
    >
      {/* Icon with glowing backdrop */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(192, 193, 255, 0.08)',
          border: '1px solid rgba(192, 193, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          marginBottom: '1.25rem',
          boxShadow: '0 0 24px rgba(192, 193, 255, 0.1)',
        }}
      >
        <Icon size={30} />
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--on-surface-variant)',
          maxWidth: '440px',
          lineHeight: 1.5,
          marginBottom: '1.75rem',
        }}
      >
        {description}
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '0.5rem',
            }}
          >
            {actionLabel}
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'var(--surface-container)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              color: 'var(--on-surface)',
              cursor: 'pointer',
            }}
          >
            {secondaryActionLabel}
          </button>
        )}

        {showSampleDataPrompt && (
          <button
            onClick={handleLoadSample}
            disabled={loadingSample}
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(78, 222, 163, 0.08)',
              border: '1px solid rgba(78, 222, 163, 0.25)',
              borderRadius: '0.5rem',
              color: 'var(--secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={15} />
            {loadingSample ? 'Loading Demo Data...' : 'Explore With Sample Data'}
          </button>
        )}
      </div>
    </div>
  );
}
