'use client';

import React from 'react';
import { AlertCircle, ShieldAlert, Inbox, WifiOff, RefreshCw } from 'lucide-react';

interface UIStateCardProps {
  type: 'empty' | 'error' | 'permission' | 'offline' | 'no-results';
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionText?: string;
  onAction?: () => void;
}

export function UIStateCard({ type, title, description, onRetry, actionText, onAction }: UIStateCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle style={{ color: 'var(--accent-danger)' }} />;
      case 'permission':
        return <ShieldAlert style={{ color: 'var(--accent-warning)' }} />;
      case 'offline':
        return <WifiOff style={{ color: 'var(--accent-warning)' }} />;
      case 'no-results':
      case 'empty':
      default:
        return <Inbox style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'error':
        return 'Unable to Load Data';
      case 'permission':
        return 'Access Permission Required';
      case 'offline':
        return 'Working Offline';
      case 'no-results':
        return 'No Matching Results';
      case 'empty':
      default:
        return 'No Data Found';
    }
  };

  const getDefaultDesc = () => {
    switch (type) {
      case 'error':
        return 'A server or network error occurred while synchronizing records. Please try again.';
      case 'permission':
        return 'Your current role does not have administrative permission to view or modify this resource.';
      case 'offline':
        return 'Your device is disconnected from the internet. Local changes will sync when reconnected.';
      case 'no-results':
        return 'No records match your active search term or filter criteria.';
      case 'empty':
      default:
        return 'There are currently no records logged in this view.';
    }
  };

  return (
    <div className="ui-state-card">
      {getIcon()}
      <h3>{title || getDefaultTitle()}</h3>
      <p>{description || getDefaultDesc()}</p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-secondary">
            <RefreshCw size={16} /> Retry
          </button>
        )}
        {onAction && actionText && (
          <button onClick={onAction} className="btn btn-primary">
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}
