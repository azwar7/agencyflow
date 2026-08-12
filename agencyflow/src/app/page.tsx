'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAuth =
        document.cookie.includes('agencyflow_auth=true') ||
        localStorage.getItem('agencyflow_user');
      if (hasAuth) setIsAuthenticated(true);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#111318', color: '#e2e2e8', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
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
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #d0bcff 0%, #a078ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#23005c',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  boxShadow: '0 0 20px rgba(208, 188, 255, 0.3)',
                }}
              >
                AF
              </div>
              <span
                style={{
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#e2e2e8',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                AgencyFlow
              </span>
            </Link>
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
          <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAuthenticated ? (
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
            <Link
              href={isAuthenticated ? '/dashboard' : '/login'}
              title="Account / Profile"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#d0bcff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#23005c',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                person
              </span>
            </Link>

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

          {/* 3D Perspective Card Mockup Container */}
          <div
            className="perspective-1000"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1024px',
              margin: '0 auto',
            }}
          >
            <div
              className="rotate-x-2"
              style={{
                position: 'relative',
                borderRadius: '12px',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                background: '#1a1c20',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(208, 188, 255, 0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Mock Window Titlebar */}
              <div
                style={{
                  height: '40px',
                  borderBottom: '1px solid rgba(73, 68, 84, 0.3)',
                  background: '#1e2024',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffb4ab' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffb95f' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4edea3' }} />
                </div>
                <div style={{ margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      padding: '4px 24px',
                      background: '#333539',
                      borderRadius: '6px',
                      fontSize: '10px',
                      color: '#cbc3d7',
                      fontFamily: "'Geist', sans-serif",
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                      lock
                    </span>{' '}
                    agencyflow.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Product Image */}
              <img
                alt="AgencyFlow Dashboard showing Leads Pipeline and Project Status"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                  position: 'relative',
                  zIndex: 0,
                }}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNWt16MpLwZYPsUD5ny1mP7OuFFGbmtrVnD_jnsovx4KL6SiWFNNJIXgIriWUdkiPvU3dTMfgX-xmP9Mz5Ns_ET6gVMjH662GoosVlGwitPYe10bho7kShzhgHun2TPwKFWlEHydbj8sCdI4eP3HJBICwJRuVI6DSAoP4V6bESI6k4KUGYWOqDI_wZV0m5iJ0taUdURuLmoimfne2YC2tBZF-OnMTkuTndqwCIc8j1A9aZJB3GIR5dEQ"
              />
            </div>

            {/* Glowing Accent Orbs behind Mockup */}
            <div
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: '-40px',
                width: '192px',
                height: '192px',
                borderRadius: '50%',
                background: 'rgba(78, 222, 163, 0.2)',
                filter: 'blur(80px)',
                zIndex: -1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '256px',
                height: '256px',
                borderRadius: '50%',
                background: 'rgba(208, 188, 255, 0.2)',
                filter: 'blur(80px)',
                zIndex: -1,
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

        {/* 4. How It Works Section */}
        <section
          id="how-it-works"
          style={{
            scrollMarginTop: '100px',
            padding: '96px 24px',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              SIMPLE 3-STEP WORKFLOW
            </span>
            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '40px', fontWeight: 700, color: '#e2e2e8', marginTop: '8px' }}>
              How AgencyFlow Transforms Your Agency
            </h2>
            <p style={{ color: '#cbc3d7', fontSize: '18px', maxWidth: '600px', margin: '16px auto 0 auto' }}>
              Replace fragmented tools with an end-to-end operational engine built specifically for digital service providers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {/* Step 1 */}
            <div
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '48px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#d0bcff', opacity: 0.4, marginBottom: '16px' }}>
                01
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e2e8', marginBottom: '12px' }}>
                Capture & Score Leads
              </h3>
              <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.6' }}>
                Organize inbound inquiries, track deal values across custom Kanban stages, and let AI score lead quality in real time.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '48px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#4edea3', opacity: 0.4, marginBottom: '16px' }}>
                02
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e2e8', marginBottom: '12px' }}>
                Execute & Deliver Projects
              </h3>
              <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.6' }}>
                Assign team members, set task priorities, track milestone deadlines, and collaborate smoothly inside client workspaces.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                background: '#1a1c20',
                border: '1px solid rgba(73, 68, 84, 0.3)',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '48px', fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, color: '#ffb95f', opacity: 0.4, marginBottom: '16px' }}>
                03
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e2e8', marginBottom: '12px' }}>
                Invoice & Scale Revenue
              </h3>
              <p style={{ color: '#cbc3d7', fontSize: '15px', lineHeight: '1.6' }}>
                Generate proposals, send automated invoices, track client health metrics, and gain complete visibility into agency profitability.
              </p>
            </div>
          </div>
        </section>

        {/* 5. About Section */}
        <section
          id="about"
          style={{
            scrollMarginTop: '100px',
            borderTop: '1px solid rgba(73, 68, 84, 0.2)',
            background: '#17191e',
            padding: '96px 24px',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', fontFamily: "'Geist', sans-serif", fontWeight: 600, color: '#d0bcff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  OUR MISSION
                </span>
                <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '38px', fontWeight: 700, color: '#e2e2e8', marginTop: '8px', lineHeight: '1.2' }}>
                  Built by Agency Founders for High-Performance Teams
                </h2>
                <p style={{ color: '#cbc3d7', fontSize: '16px', lineHeight: '1.7', marginTop: '20px' }}>
                  AgencyFlow was created to solve a fundamental problem: modern agencies waste countless hours switching between disconnected tools for lead management, team tasking, client portals, and revenue reporting.
                </p>
                <p style={{ color: '#cbc3d7', fontSize: '16px', lineHeight: '1.7', marginTop: '16px' }}>
                  We built a single unified platform that combines high-touch sales pipelines with operational rigor, helping agency leaders focus on growth and client satisfaction.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ background: '#1a1c20', border: '1px solid rgba(73, 68, 84, 0.3)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(208, 188, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d0bcff', flexShrink: 0 }}>
                    <span className="material-symbols-outlined">hub</span>
                  </div>
                  <div>
                    <h4 style={{ color: '#e2e2e8', fontSize: '16px', fontWeight: 600 }}>Unified Workspace</h4>
                    <p style={{ color: '#cbc3d7', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>Leads, clients, projects, tasks, and billing integrated under one roof.</p>
                  </div>
                </div>

                <div style={{ background: '#1a1c20', border: '1px solid rgba(73, 68, 84, 0.3)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(78, 222, 163, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4edea3', flexShrink: 0 }}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div>
                    <h4 style={{ color: '#e2e2e8', fontSize: '16px', fontWeight: 600 }}>AI Sales Copilot</h4>
                    <p style={{ color: '#cbc3d7', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>Automated deal scoring, follow-up generation, and intelligent lead insights.</p>
                  </div>
                </div>

                <div style={{ background: '#1a1c20', border: '1px solid rgba(73, 68, 84, 0.3)', borderRadius: '10px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255, 185, 95, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb95f', flexShrink: 0 }}>
                    <span className="material-symbols-outlined">security</span>
                  </div>
                  <div>
                    <h4 style={{ color: '#e2e2e8', fontSize: '16px', fontWeight: 600 }}>Enterprise Security</h4>
                    <p style={{ color: '#cbc3d7', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>Role-based permissions, data encryption, and multi-tenant security defaults.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 4. Footer */}
      <footer style={{ width: '100%', background: '#1a1c20', paddingTop: '80px', paddingBottom: '32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: '#d0bcff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#23005c',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                  }}
                >
                  AF
                </div>
                <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '24px', fontWeight: 600, color: '#e2e2e8' }}>
                  AgencyFlow
                </span>
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
      </footer>
    </div>
  );
}
