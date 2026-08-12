'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import AgencyFlowLogo from '@/components/AgencyFlowLogo';
import { useAuth } from '@/context/AuthContext';
import { Settings, LogOut, LayoutDashboard } from 'lucide-react';
import {
  staggerContainer,
  fadeUp,
  slideInRight,
  subtleScale,
  footerFade,
  solutionFade,
  reducedMotionFade,
} from '@/lib/animations';

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    logout();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#111318', color: '#e2e2e8', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. Header Navigation — TRUE 3-COLUMN LAYOUT */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 100,
          background: 'rgba(17, 19, 24, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            height: '80px',
            width: '100%',
            padding: '0 40px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. LEFT SECTION (Absolute Left Anchor) */}
          <div style={{ justifySelf: 'start' }}>
            <AgencyFlowLogo height={38} href="/" />
          </div>

          {/* 2. CENTER SECTION (True Viewport Centered) */}
          <div style={{ justifySelf: 'center' }}>
            <nav className="hidden lg:flex" style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
              <a href="#features" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '14px', fontWeight: 500, fontFamily: "'Geist', sans-serif", transition: 'color 0.2s' }}>
                Features
              </a>
              <a href="#how-it-works" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '14px', fontWeight: 500, fontFamily: "'Geist', sans-serif", transition: 'color 0.2s' }}>
                How It Works
              </a>
              <a href="#about" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '14px', fontWeight: 500, fontFamily: "'Geist', sans-serif", transition: 'color 0.2s' }}>
                About
              </a>
            </nav>
          </div>

          {/* 3. RIGHT SECTION (Absolute Right Anchor) */}
          <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            {isLoading ? (
              <div style={{ width: '120px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }} />
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 18px',
                    background: '#d0bcff',
                    color: '#23005c',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Geist', sans-serif",
                    textDecoration: 'none',
                    boxShadow: '0 0 25px rgba(208,188,255,0.25)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Open Dashboard
                </Link>

                {/* Account Profile Avatar Trigger */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                    title="Account Menu"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#d0bcff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#23005c',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 0 16px rgba(208,188,255,0.3)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      person
                    </span>
                  </button>

                  {/* Authenticated Account Menu Dropdown */}
                  {isAccountMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '125%',
                        right: 0,
                        width: '240px',
                        background: '#1a1c20',
                        borderRadius: '0.85rem',
                        padding: '0.85rem',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        zIndex: 150,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e2e8', margin: 0 }}>{user?.name || 'Alex Sterling'}</p>
                        <p style={{ fontSize: '0.75rem', color: '#cbc3d7', margin: 0 }}>{user?.email || 'alex@agencyflow.io'}</p>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '0.3rem',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '9999px',
                            background: 'rgba(208, 188, 255, 0.15)',
                            color: '#d0bcff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                          }}
                        >
                          WORKSPACE {user?.role || 'OWNER'}
                        </span>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setIsAccountMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '0.4rem',
                          color: '#e2e2e8',
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          transition: 'background 0.2s',
                        }}
                      >
                        <LayoutDashboard size={16} color="#d0bcff" /> Dashboard
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setIsAccountMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '0.4rem',
                          color: '#e2e2e8',
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          transition: 'background 0.2s',
                        }}
                      >
                        <Settings size={16} color="#d0bcff" /> Account Settings
                      </Link>

                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '0.4rem',
                          color: '#ffb4ab',
                          fontSize: '0.85rem',
                          background: 'rgba(255, 180, 171, 0.08)',
                          border: '1px solid rgba(255, 180, 171, 0.2)',
                          width: '100%',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginTop: '0.2rem',
                        }}
                      >
                        <LogOut size={16} /> Log Out Session
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 16px',
                    border: '1px solid #494454',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: "'Geist', sans-serif",
                    color: '#e2e2e8',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 20px',
                    background: '#d0bcff',
                    color: '#23005c',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Geist', sans-serif",
                    textDecoration: 'none',
                    boxShadow: '0 0 25px rgba(208,188,255,0.2)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Sign Up Free
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
              style={{
                background: 'none',
                border: 'none',
                color: '#e2e2e8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '4px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div
            style={{
              background: '#1a1c20',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: '#e2e2e8', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>
              Features
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: '#e2e2e8', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>
              How It Works
            </a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ color: '#e2e2e8', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>
              About
            </a>

            {isAuthenticated ? (
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: '#d0bcff', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>
                  Open Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffb4ab',
                    fontSize: '15px',
                    fontWeight: 600,
                    textAlign: 'left',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Log Out Session
                </button>
              </div>
            ) : (
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px' }}>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: '#e2e2e8', textDecoration: 'none', fontSize: '15px' }}>
                  Log In
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} style={{ color: '#d0bcff', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2. Hero Section (Noticeably Reduced Top Gap) */}
      <main style={{ paddingTop: '80px', width: '100%', background: '#111318' }}>
        <section
          style={{
            position: 'relative',
            paddingTop: '40px',
            paddingBottom: '120px',
            paddingLeft: '24px',
            paddingRight: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
            zIndex: 10,
            overflow: 'hidden',
          }}
        >
          {/* Ambient Glowing Radial Halo */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '800px',
              height: '800px',
              borderRadius: '50%',
              background: 'rgba(208, 188, 255, 0.18)',
              filter: 'blur(140px)',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />

          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: '#1e2024',
              border: '1px solid rgba(73, 68, 84, 0.3)',
              marginBottom: '32px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#d0bcff',
                boxShadow: '0 0 10px #d0bcff',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontFamily: "'Geist', sans-serif",
                fontWeight: 600,
                color: '#cbc3d7',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              AgencyFlow 2.0 is Here
            </span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              color: '#e2e2e8',
              maxWidth: '900px',
              marginBottom: '24px',
              margin: '0 auto 24px auto',
            }}
          >
            Run Your Agency <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #d0bcff 0%, #4edea3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Without the Chaos.
            </span>
          </h1>

          {/* Subtitle Paragraph */}
          <p
            style={{
              fontSize: '18px',
              lineHeight: '1.6',
              color: '#cbc3d7',
              maxWidth: '640px',
              margin: '0 auto 40px auto',
            }}
          >
            AgencyFlow brings leads, clients, proposals, projects, tasks, invoices, and your team together in one powerful workspace built for modern agencies.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              width: '100%',
              marginBottom: '24px',
            }}
          >
            <Link
              href="/signup"
              style={{
                padding: '16px 32px',
                background: '#d0bcff',
                color: '#3c0091',
                fontFamily: "'Geist', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 0 30px rgba(208, 188, 255, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s',
              }}
            >
              Start Free{' '}
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                arrow_forward
              </span>
            </Link>
            <a
              href="#features"
              style={{
                padding: '16px 32px',
                background: 'transparent',
                border: '1px solid #494454',
                color: '#e2e2e8',
                fontFamily: "'Geist', sans-serif",
                fontWeight: 500,
                fontSize: '14px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s',
              }}
            >
              Explore AgencyFlow
            </a>
          </div>

          {/* Guarantee Tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontFamily: "'Geist', sans-serif",
              fontWeight: 600,
              color: '#cbc3d7',
              opacity: 0.8,
              marginBottom: '80px',
              letterSpacing: '0.05em',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#d0bcff' }}>
              verified
            </span>{' '}
            No credit card required. 14-day free trial.
          </div>

          {/* 3D Dimensional Hero Scene Stage */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1180px',
              margin: '0 auto',
              padding: '20px 0 40px 0',
              perspective: '1400px',
              perspectiveOrigin: '50% 40%',
            }}
          >
            {/* Ambient Background Grid Texture for Spatial Depth */}
            <div
              style={{
                position: 'absolute',
                inset: '-60px -40px',
                backgroundImage: 'radial-gradient(rgba(208, 188, 255, 0.12) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
                maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 75%)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Studio Purple/Violet Spotlight Glow Behind Floating Panel */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -55%)',
                width: '550px',
                height: '450px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(208, 188, 255, 0.28) 0%, rgba(139, 92, 246, 0.15) 45%, transparent 70%)',
                filter: 'blur(90px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Central Angled 3D Dashboard Main Panel */}
            <div
              className="animate-hero-main"
              style={{
                position: 'relative',
                width: '92%',
                margin: '0 auto',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: '#13151b',
                boxShadow: '0 30px 90px rgba(0, 0, 0, 0.85), 0 0 65px rgba(208, 188, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                transformStyle: 'preserve-3d',
                transform: 'rotateY(-9deg) rotateX(7deg) rotateZ(-1deg)',
                transition: 'transform 0.4s ease-out',
                zIndex: 1,
              }}
            >
              {/* macOS Window Header Bar */}
              <div
                style={{
                  height: '42px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#1a1c22',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  position: 'relative',
                  borderTopLeftRadius: '13px',
                  borderTopRightRadius: '13px',
                }}
              >
                {/* Traffic Light Buttons */}
                <div style={{ display: 'flex', gap: '8px', zIndex: 2 }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', border: '1px solid rgba(0,0,0,0.2)' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', border: '1px solid rgba(0,0,0,0.2)' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', border: '1px solid rgba(0,0,0,0.2)' }} />
                </div>

                {/* Address Pill */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      padding: '4px 20px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#cbc3d7',
                      fontFamily: "'Geist', sans-serif",
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#4edea3' }}>
                      lock
                    </span>{' '}
                    agencyflow.com/dashboard
                  </div>
                </div>
              </div>

              {/* Real Dashboard UI Screenshot */}
              <img
                src="/dashboard-preview.png"
                alt="AgencyFlow Real Dashboard showing Pipeline Value, Active Projects, and Active Kanban Pipeline"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderBottomLeftRadius: '13px',
                  borderBottomRightRadius: '13px',
                }}
              />
            </div>

            {/* FLOATING UI WIDGET FRAGMENTS (Crisp HTML/CSS DOM Elements) */}

            {/* Floating Card A: Top-Right Foreground (Deal Closed) */}
            <div
              className="animate-float-a hidden lg:flex"
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-15px',
                transformStyle: 'preserve-3d',
                transform: 'rotate(2deg)',
                background: '#181a20',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                border: '1px solid rgba(208, 188, 255, 0.45)',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 30px rgba(208, 188, 255, 0.25)',
                zIndex: 4,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                maxWidth: '290px',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(78, 222, 163, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4edea3', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>task_alt</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  DEAL CLOSED 🎉
                </div>
                <div style={{ fontSize: '14px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                  TechFlow Inc — $45,000
                </div>
                <div style={{ fontSize: '11px', color: '#cbc3d7', opacity: 0.9 }}>
                  Enterprise Portal Contract
                </div>
              </div>
            </div>

            {/* Floating Card B: Top-Left Crisp Pipeline Value Card */}
            <div
              className="animate-float-b hidden lg:flex"
              style={{
                position: 'absolute',
                top: '25px',
                left: '-35px',
                transformStyle: 'preserve-3d',
                transform: 'rotate(-2deg)',
                background: '#181a20',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                border: '1px solid rgba(208, 188, 255, 0.45)',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(208, 188, 255, 0.2)',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(208, 188, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d0bcff', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>trending_up</span>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  PIPELINE VALUE
                </div>
                <div style={{ fontSize: '19px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  $173,500 <span style={{ fontSize: '11px', color: '#4edea3', background: 'rgba(78, 222, 163, 0.2)', border: '1px solid rgba(78, 222, 163, 0.4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>▲ 12.4%</span>
                </div>
              </div>
            </div>

            {/* Floating Card C: Bottom-Left Foreground (Crisp Urgent Task) */}
            <div
              className="animate-float-c hidden lg:flex"
              style={{
                position: 'absolute',
                bottom: '40px',
                left: '-25px',
                transformStyle: 'preserve-3d',
                transform: 'rotate(-2deg)',
                background: '#181a20',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                border: '1px solid rgba(255, 185, 95, 0.45)',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75), 0 0 25px rgba(255, 185, 95, 0.15)',
                zIndex: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '245px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>local_fire_department</span> URGENT TASK
                </span>
                <span style={{ fontSize: '10px', color: '#cbc3d7', fontWeight: 600 }}>Due Today</span>
              </div>
              <div style={{ fontSize: '13px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#ffffff' }}>
                Send SOW Proposal to Michael
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #ffb95f, #4edea3)', borderRadius: '2px' }} />
              </div>
            </div>

            {/* Floating Card D: Bottom-Right Crisp Active Team Badge */}
            <div
              className="animate-float-d hidden lg:flex"
              style={{
                position: 'absolute',
                bottom: '25px',
                right: '-20px',
                transformStyle: 'preserve-3d',
                transform: 'rotate(2deg)',
                background: '#181a20',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                border: '1px solid rgba(208, 188, 255, 0.4)',
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75)',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', position: 'relative' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#d0bcff', color: '#23005c', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a1c20' }}>AS</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#4edea3', color: '#003822', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a1c20', marginLeft: '-8px' }}>SJ</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffb95f', color: '#442b00', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a1c20', marginLeft: '-8px' }}>MC</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#ffffff' }}>
                  Active Team (4/4)
                </div>
                <div style={{ fontSize: '11px', color: '#4edea3', fontFamily: "'Geist', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4edea3', display: 'inline-block' }} /> 98% Health Score
                </div>
              </div>
            </div>

            {/* Soft Ground Reflection Shadow Plane */}
            <div
              style={{
                position: 'absolute',
                bottom: '-50px',
                left: '10%',
                right: '10%',
                height: '60px',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(208, 188, 255, 0.25) 0%, rgba(0, 0, 0, 0.8) 70%, transparent 100%)',
                filter: 'blur(15px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          </div>
        </section>

        {/* 3. Features Section */}
        <section
          id="features"
          style={{
            scrollMarginTop: '100px',
            borderTop: '1px solid rgba(73, 68, 84, 0.2)',
            borderBottom: '1px solid rgba(73, 68, 84, 0.2)',
            background: '#1a1c20',
            overflow: 'hidden',
            padding: '32px 0',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', marginBottom: '24px', textAlign: 'center' }}>
            <h3
              style={{
                fontSize: '12px',
                fontFamily: "'Geist', sans-serif",
                fontWeight: 600,
                color: '#cbc3d7',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              Everything your agency needs to operate
            </h3>
          </div>

          <div className="group" style={{ position: 'relative', width: '100%', display: 'flex', overflow: 'hidden' }}>
            <div className="animate-marquee" style={{ whiteSpace: 'nowrap', display: 'flex', gap: '48px', alignItems: 'center', padding: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '28px' }}>filter_alt</span> Leads
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '28px' }}>groups</span> Clients
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: '28px' }}>description</span> Proposals
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '28px' }}>work</span> Projects
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '28px' }}>check_circle</span> Tasks
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: '28px' }}>analytics</span> Analytics
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '28px' }}>smart_toy</span> AI Assistant
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
            </div>

            <div className="animate-marquee2" style={{ position: 'absolute', top: 0, whiteSpace: 'nowrap', display: 'flex', gap: '48px', alignItems: 'center', padding: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '28px' }}>filter_alt</span> Leads
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '28px' }}>groups</span> Clients
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: '28px' }}>description</span> Proposals
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '28px' }}>work</span> Projects
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '28px' }}>check_circle</span> Tasks
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: '28px' }}>analytics</span> Analytics
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '30px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, color: '#cbc3d7' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '28px' }}>smart_toy</span> AI Assistant
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(73, 68, 84, 0.5)' }} />
            </div>

            {/* Gradient Fades on edges */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '128px', background: 'linear-gradient(to right, #1a1c20, transparent)', pointerEvents: 'none', zIndex: 10 }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '128px', background: 'linear-gradient(to left, #1a1c20, transparent)', pointerEvents: 'none', zIndex: 10 }} />
          </div>
        </section>

        {/* Problem/Solution Section — THE AGENCY STRUGGLE */}
        <motion.section
          id="struggle"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}
          style={{
            padding: '96px 24px',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <motion.div
            variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <motion.span
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                display: 'inline-block',
                fontSize: '12px',
                fontFamily: "'Geist', sans-serif",
                fontWeight: 600,
                color: '#d0bcff',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              THE AGENCY STRUGGLE
            </motion.span>
            <motion.h2
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: '40px',
                fontWeight: 700,
                color: '#e2e2e8',
                marginTop: '8px',
                lineHeight: '1.2',
              }}
            >
              Running an Agency Shouldn&apos;t Feel This Chaotic
            </motion.h2>
            <motion.p
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                color: '#cbc3d7',
                fontSize: '18px',
                maxWidth: '600px',
                margin: '16px auto 0 auto',
                lineHeight: '1.6',
              }}
            >
              You&apos;re juggling five different tools just to keep the lights on — and still losing deals, missing deadlines, and guessing at profitability.
            </motion.p>
          </motion.div>

          <motion.div
            variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Card 1: Purple Accent */}
            <motion.div
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Before */}
              <div
                style={{
                  background: 'rgba(255, 180, 171, 0.05)',
                  borderLeft: '3px solid #ffb4ab',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: '18px' }}>
                    cancel
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#ffb4ab', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    BEFORE
                  </span>
                </div>
                <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
                  Leads slip through spreadsheets and Slack DMs
                </p>
              </div>

              {/* Transition Divider */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '20px', opacity: 0.7 }}>
                  south
                </span>
              </div>

              {/* After */}
              <motion.div
                variants={shouldReduceMotion ? reducedMotionFade : solutionFade}
                style={{
                  background: 'rgba(208, 188, 255, 0.05)',
                  borderLeft: '3px solid #d0bcff',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '18px' }}>
                    check_circle
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    AFTER AGENCYFLOW
                  </span>
                </div>
                <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, lineHeight: '1.5', margin: 0 }}>
                  Centralized pipeline with AI-powered lead scoring
                </p>
              </motion.div>
            </motion.div>

            {/* Card 2: Green Accent */}
            <motion.div
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Before */}
              <div
                style={{
                  background: 'rgba(255, 180, 171, 0.05)',
                  borderLeft: '3px solid #ffb4ab',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: '18px' }}>
                    cancel
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#ffb4ab', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    BEFORE
                  </span>
                </div>
                <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
                  Projects stall because no one knows who owns what
                </p>
              </div>

              {/* Transition Divider */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '20px', opacity: 0.7 }}>
                  south
                </span>
              </div>

              {/* After */}
              <motion.div
                variants={shouldReduceMotion ? reducedMotionFade : solutionFade}
                style={{
                  background: 'rgba(78, 222, 163, 0.05)',
                  borderLeft: '3px solid #4edea3',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: '18px' }}>
                    check_circle
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    AFTER AGENCYFLOW
                  </span>
                </div>
                <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, lineHeight: '1.5', margin: 0 }}>
                  Clear task ownership with milestone tracking in one workspace
                </p>
              </motion.div>
            </motion.div>

            {/* Card 3: Amber Accent */}
            <motion.div
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Before */}
              <div
                style={{
                  background: 'rgba(255, 180, 171, 0.05)',
                  borderLeft: '3px solid #ffb4ab',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: '18px' }}>
                    cancel
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#ffb4ab', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    BEFORE
                  </span>
                </div>
                <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
                  Invoices go out late, and payment status is a mystery
                </p>
              </div>

              {/* Transition Divider */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: '20px', opacity: 0.7 }}>
                  south
                </span>
              </div>

              {/* After */}
              <motion.div
                variants={shouldReduceMotion ? reducedMotionFade : solutionFade}
                style={{
                  background: 'rgba(255, 185, 95, 0.05)',
                  borderLeft: '3px solid #ffb95f',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: '18px' }}>
                    check_circle
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    AFTER AGENCYFLOW
                  </span>
                </div>
                <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, lineHeight: '1.5', margin: 0 }}>
                  Automated invoicing with real-time payment tracking
                </p>
              </motion.div>
            </motion.div>

            {/* Card 4: Purple Accent */}
            <motion.div
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Before */}
              <div
                style={{
                  background: 'rgba(255, 180, 171, 0.05)',
                  borderLeft: '3px solid #ffb4ab',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: '18px' }}>
                    cancel
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#ffb4ab', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    BEFORE
                  </span>
                </div>
                <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
                  No idea which clients are actually profitable
                </p>
              </div>

              {/* Transition Divider */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '20px', opacity: 0.7 }}>
                  south
                </span>
              </div>

              {/* After */}
              <motion.div
                variants={shouldReduceMotion ? reducedMotionFade : solutionFade}
                style={{
                  background: 'rgba(208, 188, 255, 0.05)',
                  borderLeft: '3px solid #d0bcff',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#d0bcff', fontSize: '18px' }}>
                    check_circle
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#d0bcff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    AFTER AGENCYFLOW
                  </span>
                </div>
                <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, lineHeight: '1.5', margin: 0 }}>
                  Live dashboards showing revenue and client health at a glance
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* 4. How It Works Section */}
        <motion.section
          id="how-it-works"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}
          style={{
            scrollMarginTop: '100px',
            padding: '96px 24px',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <motion.div
            variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <motion.span
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{ display: 'inline-block', fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.15em' }}
            >
              SIMPLE 3-STEP WORKFLOW
            </motion.span>
            <motion.h2
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '40px', fontWeight: 700, color: '#e2e2e8', marginTop: '8px' }}
            >
              How AgencyFlow Transforms Your Agency
            </motion.h2>
            <motion.p
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{ color: '#cbc3d7', fontSize: '18px', maxWidth: '600px', margin: '16px auto 0 auto' }}
            >
              Replace fragmented tools with an end-to-end operational engine built specifically for digital service providers.
            </motion.p>
          </motion.div>

          <motion.div
            variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}
          >
            {/* Step 1 */}
            <motion.div
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
              }}
            >
              <motion.div
                variants={shouldReduceMotion ? reducedMotionFade : subtleScale}
                style={{ fontSize: '48px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#d0bcff', opacity: 0.4, marginBottom: '16px' }}
              >
                01
              </motion.div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e2e8', marginBottom: '12px' }}>
                Capture & Score Leads
              </h3>
              <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.6' }}>
                Organize inbound inquiries, track deal values across custom Kanban stages, and let AI score lead quality in real time.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
              }}
            >
              <motion.div
                variants={shouldReduceMotion ? reducedMotionFade : subtleScale}
                style={{ fontSize: '48px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#4edea3', opacity: 0.4, marginBottom: '16px' }}
              >
                02
              </motion.div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e2e8', marginBottom: '12px' }}>
                Execute & Deliver Projects
              </h3>
              <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.6' }}>
                Assign team members, set task priorities, track milestone deadlines, and collaborate smoothly inside client workspaces.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
              }}
            >
              <motion.div
                variants={shouldReduceMotion ? reducedMotionFade : subtleScale}
                style={{ fontSize: '48px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#ffb95f', opacity: 0.4, marginBottom: '16px' }}
              >
                03
              </motion.div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e2e8', marginBottom: '12px' }}>
                Invoice & Scale Revenue
              </h3>
              <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.6' }}>
                Generate proposals, send automated invoices, track client health metrics, and gain complete visibility into agency profitability.
              </p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* 5. About Section */}
        <motion.section
          id="about"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}
          style={{
            scrollMarginTop: '100px',
            borderTop: '1px solid rgba(73, 68, 84, 0.2)',
            background: '#17191e',
            padding: '96px 24px',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
              <motion.div variants={shouldReduceMotion ? reducedMotionFade : staggerContainer}>
                <motion.span
                  variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
                  style={{ display: 'inline-block', fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#d0bcff', textTransform: 'uppercase', letterSpacing: '0.15em' }}
                >
                  OUR MISSION
                </motion.span>
                <motion.h2
                  variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
                  style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '38px', fontWeight: 700, color: '#e2e2e8', marginTop: '8px', lineHeight: '1.2' }}
                >
                  Built by Agency Founders for High-Performance Teams
                </motion.h2>
                <motion.p
                  variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
                  style={{ color: '#cbc3d7', fontSize: '16px', lineHeight: '1.7', marginTop: '20px' }}
                >
                  AgencyFlow was created to solve a fundamental problem: modern agencies waste countless hours switching between disconnected tools for lead management, team tasking, client portals, and revenue reporting.
                </motion.p>
                <motion.p
                  variants={shouldReduceMotion ? reducedMotionFade : fadeUp}
                  style={{ color: '#cbc3d7', fontSize: '16px', lineHeight: '1.7', marginTop: '16px' }}
                >
                  We built a single unified platform that combines high-touch sales pipelines with operational rigor, helping agency leaders focus on growth and client satisfaction.
                </motion.p>
              </motion.div>

              <motion.div variants={shouldReduceMotion ? reducedMotionFade : staggerContainer} style={{ display: 'grid', gap: '16px' }}>
                <motion.div
                  variants={shouldReduceMotion ? reducedMotionFade : slideInRight}
                  style={{ background: '#1a1c20', border: '1px solid rgba(73, 68, 84, 0.3)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                >
                  <motion.div
                    variants={shouldReduceMotion ? reducedMotionFade : subtleScale}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(208, 188, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d0bcff', flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined">hub</span>
                  </motion.div>
                  <div>
                    <h4 style={{ color: '#e2e2e8', fontSize: '16px', fontWeight: 600 }}>Unified Workspace</h4>
                    <p style={{ color: '#cbc3d7', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>Leads, clients, projects, tasks, and billing integrated under one roof.</p>
                  </div>
                </motion.div>

                <motion.div
                  variants={shouldReduceMotion ? reducedMotionFade : slideInRight}
                  style={{ background: '#1a1c20', border: '1px solid rgba(73, 68, 84, 0.3)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                >
                  <motion.div
                    variants={shouldReduceMotion ? reducedMotionFade : subtleScale}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(78, 222, 163, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4edea3', flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </motion.div>
                  <div>
                    <h4 style={{ color: '#e2e2e8', fontSize: '16px', fontWeight: 600 }}>AI Sales Copilot</h4>
                    <p style={{ color: '#cbc3d7', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>Automated deal scoring, follow-up generation, and intelligent lead insights.</p>
                  </div>
                </motion.div>

                <motion.div
                  variants={shouldReduceMotion ? reducedMotionFade : slideInRight}
                  style={{ background: '#1a1c20', border: '1px solid rgba(73, 68, 84, 0.3)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                >
                  <motion.div
                    variants={shouldReduceMotion ? reducedMotionFade : subtleScale}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255, 185, 95, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb95f', flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined">security</span>
                  </motion.div>
                  <div>
                    <h4 style={{ color: '#e2e2e8', fontSize: '16px', fontWeight: 600 }}>Enterprise Security</h4>
                    <p style={{ color: '#cbc3d7', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>Role-based permissions, data encryption, and multi-tenant security defaults.</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* 4. Footer */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={shouldReduceMotion ? reducedMotionFade : footerFade}
        style={{ width: '100%', background: '#1a1c20', paddingTop: '80px', paddingBottom: '32px', overflow: 'hidden' }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ marginBottom: '16px' }}>
                <AgencyFlowLogo height={34} href="/" />
              </div>
              <p style={{ color: '#cbc3d7', fontSize: '16px', lineHeight: '1.6', maxWidth: '320px', marginBottom: '16px' }}>
                The operating system for modern agencies. Streamline your workflow, manage clients, and scale with confidence.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none' }}>
                  <span className="material-symbols-outlined">public</span>
                </a>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none' }}>
                  <span className="material-symbols-outlined">share</span>
                </a>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none' }}>
                  <span className="material-symbols-outlined">alternate_email</span>
                </a>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#e2e2e8', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.1em' }}>
                Product
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#features" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>Features</a>
                <a href="#how-it-works" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>How It Works</a>
                <a href="#about" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>About</a>
              </nav>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#e2e2e8', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.1em' }}>
                Company
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#about" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>About Us</a>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>Careers</a>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>Contact</a>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>Blog</a>
              </nav>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#e2e2e8', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.1em' }}>
                Legal
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>Privacy</a>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>Terms</a>
                <a href="#" style={{ color: '#cbc3d7', textDecoration: 'none', fontSize: '16px' }}>Security</a>
              </nav>
            </div>

          </div>

          <div style={{ paddingTop: '32px', borderTop: '1px solid #494454', textAlign: 'center' }}>
            <p style={{ color: '#cbc3d7', fontSize: '12px', fontFamily: "'Geist', sans-serif" }}>
              © 2024 AgencyFlow Inc. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
