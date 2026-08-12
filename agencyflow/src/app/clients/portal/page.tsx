'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Check,
  Lock,
  ThumbsUp,
  Edit3,
  FileText,
  FolderArchive,
  FileCode,
  Download,
  ArrowRight,
  Receipt,
  Search,
  Bell,
  HelpCircle,
} from 'lucide-react';

export default function ClientPortalPage() {
  const [signedOff, setSignedOff] = useState(false);
  const [revisionModal, setRevisionModal] = useState(false);

  return (
    <AppShell>
      <div className="page-content">
        {/* Hero Section Banner */}
        <section
          style={{
            marginBottom: '2rem',
            position: 'relative',
            borderRadius: '1rem',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(128, 131, 255, 0.15), rgba(128, 131, 255, 0.05), transparent)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '2rem 2.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Decorative ambient background orb */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              background: 'rgba(192, 193, 255, 0.15)',
              filter: 'blur(80px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--primary)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                PROJECT OVERVIEW
              </p>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                Welcome back, David.
              </h2>
              <p style={{ fontSize: '1.125rem', color: 'var(--on-surface-variant)' }}>
                Here is the real-time status of your Cloud Portal Redesign.
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', display: 'block', lineHeight: 1.1 }}>
                Day 42
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                of 90 Day Sprint
              </span>
            </div>
          </div>
        </section>

        {/* Milestone Progress Stepper Card */}
        <section style={{ marginBottom: '2rem' }}>
          <div
            className="glass-card"
            style={{
              background: 'var(--surface-container)',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '2rem' }}>
              Milestone Progress
            </h3>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              {/* Stepper Progress Line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '24px',
                  transform: 'translateY(-50%)',
                  width: '100%',
                  height: '4px',
                  background: 'var(--surface-container-high)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  zIndex: 0,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'var(--secondary)',
                    width: '60%',
                    boxShadow: '0 0 10px rgba(78, 222, 163, 0.5)',
                  }}
                />
              </div>

              {/* Step 1: Discovery */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(78, 222, 163, 0.4)',
                    color: 'var(--on-secondary)',
                  }}
                >
                  <Check size={22} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>1. Discovery</span>
              </div>

              {/* Step 2: Architecture */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(78, 222, 163, 0.4)',
                    color: 'var(--on-secondary)',
                  }}
                >
                  <Check size={22} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>2. Architecture</span>
              </div>

              {/* Step 3: Frontend Build (Active) */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    border: '2px solid var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(78, 222, 163, 0.25)',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--secondary)',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--secondary)' }}>3. Frontend Build</span>
              </div>

              {/* Step 4: QA & Launch (Locked) */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', opacity: 0.4 }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--surface-container-high)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--on-surface-variant)',
                  }}
                >
                  <Lock size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>4. QA & Launch</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Multi-Column Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
          {/* Action Required Panel (Column 1-4) */}
          <div style={{ gridColumn: 'span 4' }}>
            <div
              className="glass-card"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderRadius: '1rem',
                background: 'rgba(49, 53, 64, 0.4)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative top-right orb */}
              <div
                style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(128, 131, 255, 0.2)',
                  filter: 'blur(30px)',
                  pointerEvents: 'none',
                }}
              />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)' }}>Action Required</h3>
                </div>

                {signedOff ? (
                  <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(0, 165, 114, 0.2)', border: '1px solid var(--secondary)', color: 'var(--secondary)' }}>
                    ✓ Deliverable Approved! Thank you.
                  </div>
                ) : (
                  <>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                      1 Deliverable Requires Your Sign-off
                    </h4>
                    <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>
                      v2.4 Architecture Spec
                    </p>
                  </>
                )}
              </div>

              {!signedOff && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 1 }}>
                  <button
                    onClick={() => setSignedOff(true)}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', background: 'var(--secondary)', color: 'var(--on-secondary)', padding: '0.75rem 1rem' }}
                  >
                    <ThumbsUp size={18} /> Approve Deliverable
                  </button>
                  <button
                    onClick={() => setRevisionModal(true)}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
                  >
                    <Edit3 size={18} /> Request Revision
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Columns Grid (Column 5-12) */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Shared Resources Card */}
            <div
              className="glass-card"
              style={{
                background: 'var(--surface-container)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)' }}>Shared Resources</h3>
                <button style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  View All <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {/* File Card 1 */}
                <div
                  style={{
                    background: 'var(--surface)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '110px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>
                      picture_as_pdf
                    </span>
                    <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '18px' }}>
                      download
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Contract.pdf
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>2.4 MB • Updated Today</p>
                  </div>
                </div>

                {/* File Card 2 */}
                <div
                  style={{
                    background: 'var(--surface)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '110px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '24px' }}>
                      folder_zip
                    </span>
                    <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '18px' }}>
                      download
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Brand_Assets.zip
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>145 MB • Oct 12</p>
                  </div>
                </div>

                {/* File Card 3 */}
                <div
                  style={{
                    background: 'var(--surface)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '110px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--inverse-primary)', fontSize: '24px' }}>
                      description
                    </span>
                    <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '18px' }}>
                      download
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Q3_Strategy.doc
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>1.1 MB • Sep 28</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Invoices Card */}
            <div
              className="glass-card"
              style={{
                background: 'var(--surface-container)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '1.25rem' }}>
                Recent Invoices
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Invoice Item 1 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '20px' }}>
                        receipt_long
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>Invoice #1043</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Due Oct 30</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface)' }}>$12,500.00</span>
                    <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(202, 129, 0, 0.2)', color: 'var(--tertiary)', fontWeight: 600 }}>
                      Outstanding
                    </span>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                      Pay Now
                    </button>
                  </div>
                </div>

                {/* Invoice Item 2 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '20px' }}>
                        receipt_long
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>Invoice #1042</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Paid Sep 15</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface-variant)', textDecoration: 'line-through', opacity: 0.7 }}>
                      $12,500.00
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0, 165, 114, 0.2)', color: 'var(--secondary)', fontWeight: 600 }}>
                      Paid
                    </span>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
