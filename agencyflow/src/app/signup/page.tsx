'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Briefcase,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Building2,
  Zap,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Check,
  Key,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AgencyFlowLogo from '@/components/AgencyFlowLogo';

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Multi-step state: 1 = Form & Persona, 2 = OTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState<'AGENCY' | 'FREELANCER'>('AGENCY');
  const [workspaceName, setWorkspaceName] = useState('');
  const [niche, setNiche] = useState('Web & AI Development');
  const [targetRevenue, setTargetRevenue] = useState('$5k - $20k/mo');

  // OTP Fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    let interval: any;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Update default workspace name when persona or fullName changes
  useEffect(() => {
    if (!workspaceName) {
      if (persona === 'FREELANCER') {
        setWorkspaceName(fullName ? `${fullName} Studio` : 'Freelance Studio');
      } else {
        setWorkspaceName('Apex Digital Agency');
      }
    }
  }, [persona, fullName]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !workspaceName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Failed to send verification code.');
        setLoading(false);
        return;
      }

      if (json.debugOtp) {
        setDevOtpHint(json.debugOtp);
      }

      setStep(2);
      setResendTimer(45);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Network error sending verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input box
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP and Finish Signup
  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/verify-otp-and-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          otpCode: fullCode,
          persona,
          workspaceName: workspaceName.trim(),
          niche,
          targetRevenue,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Verification failed.');
        setLoading(false);
        return;
      }

      // Hard redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await res.json();
      if (json.success) {
        setResendTimer(45);
        setCanResend(false);
        if (json.debugOtp) setDevOtpHint(json.debugOtp);
      } else {
        setError(json.error?.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setError(err.message || 'Error resending verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Back to Home Link */}
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--on-surface-variant)',
          fontSize: '0.875rem',
          fontWeight: 600,
          textDecoration: 'none',
          zIndex: 10,
        }}
      >
        <ArrowLeft size={16} /> Back to home
      </Link>

      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '-10%', right: '20%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '15%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: step === 1 ? '520px' : '460px',
          background: '#161922',
          borderRadius: '1rem',
          padding: '2.5rem 2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
          zIndex: 1,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <AgencyFlowLogo height={38} href="/" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 1 ? '#38bdf8' : '#4edea3', color: '#003355', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {step === 1 ? '1' : '✓'}
            </div>
            <div style={{ width: '40px', height: '2px', background: step === 2 ? '#4edea3' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === 2 ? '#38bdf8' : 'var(--surface-container-high)', color: step === 2 ? '#003355' : 'var(--on-surface-variant)', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              2
            </div>
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '1rem', color: '#fff', margin: '0.75rem 0 0 0' }}>
            {step === 1 ? 'Create Your Account' : 'Verify Your Email'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            {step === 1
              ? 'Choose your profile type to customize your CRM workspace.'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255, 180, 171, 0.12)', border: '1px solid rgba(255, 180, 171, 0.3)', color: '#ffb4ab', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Account Details & Persona Selection */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Persona Selector Cards */}
            <div>
              <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                I AM A:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Agency Card */}
                <div
                  onClick={() => setPersona('AGENCY')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: persona === 'AGENCY' ? 'rgba(56, 189, 248, 0.15)' : 'var(--surface-container-high)',
                    border: persona === 'AGENCY' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Building2 size={20} color={persona === 'AGENCY' ? '#38bdf8' : 'var(--on-surface-variant)'} />
                    {persona === 'AGENCY' && <CheckCircle2 size={16} color="#38bdf8" />}
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: '#fff', marginTop: '0.2rem' }}>Digital Agency</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', lineHeight: 1.3 }}>
                    Team collaboration, multi-client pipelines & SOWs.
                  </span>
                </div>

                {/* Freelancer Card */}
                <div
                  onClick={() => setPersona('FREELANCER')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: persona === 'FREELANCER' ? 'rgba(168, 85, 247, 0.15)' : 'var(--surface-container-high)',
                    border: persona === 'FREELANCER' ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Zap size={20} color={persona === 'FREELANCER' ? '#a855f7' : 'var(--on-surface-variant)'} />
                    {persona === 'FREELANCER' && <CheckCircle2 size={16} color="#a855f7" />}
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: '#fff', marginTop: '0.2rem' }}>Solo Freelancer</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', lineHeight: 1.3 }}>
                    Direct lead scraping, fast proposals & milestone billing.
                  </span>
                </div>
              </div>
            </div>

            {/* Full Name & Workspace Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {persona === 'FREELANCER' ? 'Studio / Brand' : 'Agency Name'}
                </label>
                <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                  <Briefcase size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                  <input
                    type="text"
                    required
                    placeholder={persona === 'FREELANCER' ? 'Rivera Studio' : 'Apex Agency'}
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address (Gmail / Work Email)</label>
              <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password (min 8 characters)</label>
              <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Industry & Target Revenue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.7rem 0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                >
                  <option value="Web & AI Development">Web & AI Development</option>
                  <option value="Real Estate Marketing">Real Estate & Construction</option>
                  <option value="B2B SaaS & Growth">B2B SaaS & Tech</option>
                  <option value="UI/UX & Branding">UI/UX & Branding</option>
                  <option value="Digital Marketing & Ads">Digital Marketing & Ads</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Target</label>
                <select
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.7rem 0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                >
                  <option value="< $5k/mo">&lt; $5,000 / mo</option>
                  <option value="$5k - $20k/mo">$5,000 – $20,000 / mo</option>
                  <option value="$20k - $50k/mo">$20,000 – $50,000 / mo</option>
                  <option value="$50k+/mo">$50,000+ / mo</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                marginTop: '0.5rem',
                background: persona === 'AGENCY' ? 'linear-gradient(135deg, #38bdf8, #2563eb)' : 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Sending Verification Code...' : 'Continue to Email Verification'}
            </button>
          </form>
        )}

        {/* STEP 2: 6-Digit Email OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <Mail size={32} color="#38bdf8" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
              <p style={{ fontSize: '0.85rem', color: '#e2e2e8', margin: 0 }}>
                A 6-digit confirmation code was sent to:
              </p>
              <strong style={{ fontSize: '0.95rem', color: '#38bdf8', display: 'block', marginTop: '0.2rem' }}>
                {email}
              </strong>
            </div>

            {/* Dev hint if available */}
            {devOtpHint && (
              <div style={{ padding: '0.5rem', background: 'rgba(78, 222, 163, 0.1)', border: '1px dashed #4edea3', borderRadius: '6px', textAlign: 'center', fontSize: '0.75rem', color: '#4edea3' }}>
                🔑 Dev Mode Verification Code: <strong>{devOtpHint}</strong>
              </div>
            )}

            {/* 6-Box OTP Input */}
            <div>
              <label style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Enter 6-Digit Code
              </label>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: '46px',
                      height: '52px',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      background: 'var(--surface-container-high)',
                      border: digit ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
              {loading ? 'Verifying & Setting Up Workspace...' : 'Verify & Launch Workspace'}
            </button>

            {/* Resend OTP Button / Timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--on-surface-variant)', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <ArrowLeft size={13} /> Change details
              </button>

              <div>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Resend Code
                  </button>
                ) : (
                  <span>Resend code in {resendTimer}s</span>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
