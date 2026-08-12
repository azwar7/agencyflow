'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('agencyflow_user', JSON.stringify({ email, name: 'Alex Sterling', role: 'OWNER' }));
        document.cookie = 'agencyflow_auth=true; path=/; max-age=86400';
      }
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      
      {/* Glow Orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(128, 131, 255, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(78, 222, 163, 0.1) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#161922',
          borderRadius: '1rem',
          padding: '2.5rem 2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'var(--on-surface)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '0.6rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '1rem' }}>
              AF
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>AgencyFlow</span>
          </Link>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '1.25rem', color: 'var(--on-surface)' }}>Welcome Back</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>Sign in to your agency operations workspace.</p>
        </div>

        {error && (
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'rgba(255, 180, 171, 0.12)', border: '1px solid rgba(255, 180, 171, 0.3)', color: '#ffb4ab', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', marginTop: '0.35rem' }}>
              <Mail size={16} color="var(--on-surface-variant)" />
              <input
                type="email"
                required
                placeholder="alex@agencyflow.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.875rem', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', marginTop: '0.35rem' }}>
              <Lock size={16} color="var(--on-surface-variant)" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.875rem', width: '100%' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', borderRadius: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : <>Sign In to Dashboard <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
          Don't have an AgencyFlow account?{' '}
          <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Start Free Trial</Link>
        </div>
      </div>
    </div>
  );
}
