'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d1017',
            color: '#e2e2e8',
            fontFamily: "'Inter', sans-serif",
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#161922',
              border: '1px solid rgba(255, 180, 171, 0.25)',
              borderRadius: '1rem',
              padding: '2.5rem 2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 180, 171, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#ffb4ab',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Something unexpected happened
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
              We encountered a rendering issue. Your workspace data remains completely safe.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#ffb4ab',
                  marginTop: '1rem',
                  textAlign: 'left',
                  overflowX: 'auto',
                  border: '1px solid rgba(255, 180, 171, 0.15)',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  background: 'var(--primary)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} /> Reload Workspace
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <Home size={15} /> Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
