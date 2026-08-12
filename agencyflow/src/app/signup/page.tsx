'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AgencyFlowLogo from '@/components/AgencyFlowLogo';

export default function SignupPage() {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login({
        email,
        name: fullName || 'Alex Sterling',
        agency: agencyName || 'Sterling Digital Agency',
        role: 'OWNER',
      });
    }, 400);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      
      {/* Glow Orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(128, 131, 255, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
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
          <AgencyFlowLogo height={40} href="/" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '1.25rem', color: 'var(--on-surface)' }}>Start Your 14-Day Free Trial</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>No credit card required. Full CRM & Operations workspace access.</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', marginTop: '0.3rem' }}>
              <User size={16} color="var(--on-surface-variant)" />
              <input
                type="text"
                required
                placeholder="Alex Sterling"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.85rem', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Email</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', marginTop: '0.3rem' }}>
              <Mail size={16} color="var(--on-surface-variant)" />
              <input
                type="email"
                required
                placeholder="alex@sterlingagency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.85rem', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agency Name</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', marginTop: '0.3rem' }}>
              <Briefcase size={16} color="var(--on-surface-variant)" />
              <input
                type="text"
                required
                placeholder="Sterling Digital Agency"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.85rem', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', marginTop: '0.3rem' }}>
              <Lock size={16} color="var(--on-surface-variant)" />
              <input
                type="password"
                required
                placeholder="Must be at least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.85rem', width: '100%' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', borderRadius: '0.5rem' }}
          >
            {loading ? 'Creating Workspace...' : <>Create Agency Workspace <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}
