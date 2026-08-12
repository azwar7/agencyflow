'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Zap,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers,
  FileText,
  DollarSign,
  Clock,
  ChevronRight,
  Menu,
  X,
  Star,
  Lock,
  Globe,
  Bot,
  Activity,
  Briefcase,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAuth = document.cookie.includes('agencyflow_auth=true') || localStorage.getItem('agencyflow_user');
      if (hasAuth) setIsAuthenticated(true);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: 'var(--on-surface)', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      
      {/* Background Decorative Glow Orbs */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '1200px', height: '600px', background: 'radial-gradient(ellipse at top, rgba(128, 131, 255, 0.12) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Public Header Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(10, 13, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: 'var(--on-surface)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '0.65rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '1rem', boxShadow: '0 0 15px rgba(192, 193, 255, 0.4)' }}>
              AF
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>AgencyFlow</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.1em' }}>CRM & OPERATIONS</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#features" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }}>Features</a>
            <a href="#how-it-works" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }}>How It Works</a>
            <a href="#analytics" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }}>Analytics</a>
            <a href="#pricing" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }}>Pricing</a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Open Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    padding: '0.55rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--on-surface)',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  Start Free Trial <ArrowRight size={15} />
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="show-mobile-only"
              style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', padding: '0.4rem' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{ background: '#131620', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--on-surface)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--on-surface)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>How It Works</a>
            <a href="#analytics" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--on-surface)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>Analytics</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--on-surface)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>Pricing</a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section style={{ position: 'relative', padding: '5rem 1.5rem 4rem 1.5rem', maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Subhead Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '9999px', background: 'rgba(192, 193, 255, 0.1)', border: '1px solid rgba(192, 193, 255, 0.25)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '0.04em' }}>
          <Sparkles size={14} /> NEXT-GEN AGENCY CRM & OPERATIONS PLATFORM
        </div>

        {/* Main Headline */}
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, color: '#ffffff', maxWidth: '900px', margin: '0 auto' }}>
          Scale Your Agency Revenue with Unified Pipeline & Client Intelligence
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--on-surface-variant)', maxWidth: '720px', margin: '1.5rem auto 2.5rem auto', lineHeight: 1.6 }}>
          AgencyFlow combines deal pipeline tracking, client retainer management, deliverable execution, and automated financial forecasting into a single high-performance workspace.
        </p>

        {/* CTA Button Group */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/signup"
            className="btn btn-primary"
            style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 800, borderRadius: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 6px 20px rgba(128, 131, 255, 0.35)' }}
          >
            Start 14-Day Free Trial <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            style={{
              padding: '0.85rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--on-surface)',
              textDecoration: 'none',
              borderRadius: '0.6rem',
              background: 'var(--surface-container-high)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            Explore Demo Workspace
          </Link>
        </div>

        {/* Trust Points */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '2.5rem', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> No credit card required</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> 2-minute instant onboarding</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> Unlimited team members</span>
        </div>

        {/* Hero Product Screenshot Card Mockup */}
        <div
          className="glass-card"
          style={{
            marginTop: '4rem',
            padding: '1rem',
            borderRadius: '1.25rem',
            background: '#141722',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(128, 131, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ background: '#0e111a', borderRadius: '0.85rem', padding: '1.5rem', textAlign: 'left' }}>
            {/* Top Mock Window Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>agencyflow.io/dashboard</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>● Live Workspace</span>
            </div>

            {/* Dashboard Mock Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-container-high)', padding: '1rem', borderRadius: '0.65rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>MONTHLY RECURRING REVENUE</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--secondary)', marginTop: '0.2rem' }}>$148,500.00</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>↑ +14.2% vs previous month</span>
              </div>

              <div style={{ background: 'var(--surface-container-high)', padding: '1rem', borderRadius: '0.65rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>ACTIVE RETENTION RATE</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.2rem' }}>96.8%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Top 5% Agency Benchmark</span>
              </div>

              <div style={{ background: 'var(--surface-container-high)', padding: '1rem', borderRadius: '0.65rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>PIPELINE CONVERSION</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--tertiary)', marginTop: '0.2rem' }}>38.4%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--tertiary)' }}>14 deals in qualified stage</span>
              </div>
            </div>

            {/* Mock Table Row Preview */}
            <div style={{ background: 'var(--surface-container)', padding: '1rem', borderRadius: '0.65rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--on-surface)' }}>ACTIVE CLIENT RETAINERS</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>View All Accounts →</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700 }}>Apex Digital Group</span>
                <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>$18,000 / mo</span>
                <span style={{ color: 'var(--secondary)' }}>● Healthy</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700 }}>Vanguard FinTech</span>
                <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>$24,500 / mo</span>
                <span style={{ color: 'var(--secondary)' }}>● Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '5rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BUILT FOR HIGH-GROWTH AGENCIES</span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
            Everything You Need to Run & Scale Operations
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', maxWidth: '600px', margin: '0.75rem auto 0 auto' }}>
            Eliminate fragmented tools. Manage your agency pipeline, clients, projects, deliverables, and invoices from one unified hub.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Feature 1: Deal Pipeline */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(128, 131, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.25rem' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Visual Deal Kanban Pipeline</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Track deal velocity across lead qualification, proposal delivery, negotiation, and closed retainers with instant value calculations.
            </p>
          </div>

          {/* Feature 2: Client Management */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(78, 222, 163, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', marginBottom: '1.25rem' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Client Accounts & Health Scoring</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Maintain complete visibility into retainer health, client profitability, communication history, and active project deliverables.
            </p>
          </div>

          {/* Feature 3: Task & Operations */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(255, 185, 95, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tertiary)', marginBottom: '1.25rem' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Tasks & Operations Workspace</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Streamline team workload, task deadlines, assignment tracking, and client deliverables with high-density list and kanban views.
            </p>
          </div>

          {/* Feature 4: Financial Analytics */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(128, 131, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.25rem' }}>
              <BarChart3 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Revenue & Cashflow Analytics</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Accurately forecast monthly recurring revenue, sales cycle length, deal size averages, and client retention trends.
            </p>
          </div>

          {/* Feature 5: AI Sales Copilot */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(78, 222, 163, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', marginBottom: '1.25rem' }}>
              <Bot size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>AI Sales & Follow-Up Copilot</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Leverage artificial intelligence to score incoming leads, generate personalized proposal follow-ups, and automate outreach.
            </p>
          </div>

          {/* Feature 6: Invoicing & Billing */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(255, 185, 95, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tertiary)', marginBottom: '1.25rem' }}>
              <DollarSign size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Invoices & Proposal Contracts</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Generate branded client proposals, manage billing milestones, and track invoice payment statuses without leaving the workspace.
            </p>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '5rem 1.5rem', background: '#0e111a', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>TRANSPARENT PRICING</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
              Simple, Predictable Plans for Every Agency
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', maxWidth: '540px', margin: '0.75rem auto 0 auto' }}>
              All plans include full CRM access, unlimited deals, and 14-day free trial.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* Starter Plan */}
            <div className="glass-card" style={{ padding: '2.25rem', borderRadius: '1rem', background: '#141722', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>STARTER AGENCY</span>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.75rem 0 0.25rem 0' }}>$49 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>/ month</span></div>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>Ideal for boutique agencies and growing teams up to 5 members.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Up to 5 Team Members</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Full Deal & Pipeline Tracking</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Client & Retainer Management</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Standard Task Operations</span>
              </div>

              <Link
                href="/signup"
                className="btn btn-secondary"
                style={{ marginTop: 'auto', textAlign: 'center', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.875rem' }}
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Pro Plan (Featured) */}
            <div className="glass-card" style={{ padding: '2.25rem', borderRadius: '1rem', background: '#181b29', border: '2px solid var(--primary)', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 30px rgba(128, 131, 255, 0.2)' }}>
              <div style={{ position: 'absolute', top: '-14px', right: '20px', background: 'var(--primary)', color: '#000', fontSize: '0.7rem', fontWeight: 900, padding: '0.2rem 0.75rem', borderRadius: '9999px', letterSpacing: '0.05em' }}>
                MOST POPULAR
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>PRO SCALE</span>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0.75rem 0 0.25rem 0' }}>$99 <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>/ month</span></div>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>Designed for scaling digital agencies and mid-sized teams.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Unlimited Team Members</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Advanced Revenue Analytics & MRR</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> AI Lead Scoring & Follow-ups</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Invoicing & Milestone Billing</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--secondary)" /> Priority 24/7 Support</span>
              </div>

              <Link
                href="/signup"
                className="btn btn-primary"
                style={{ marginTop: 'auto', textAlign: 'center', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.875rem' }}
              >
                Start Free Trial
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 1.5rem', background: '#0a0d14', borderTop: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '0.4rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '0.75rem' }}>
              AF
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--on-surface)' }}>AgencyFlow CRM</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/login" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Log In</Link>
            <Link href="/signup" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Sign Up</Link>
            <Link href="/dashboard" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Dashboard</Link>
          </div>

          <div>
            © {new Date().getFullYear()} AgencyFlow Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
