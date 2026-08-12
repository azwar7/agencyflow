'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAuth =
        document.cookie.includes('agencyflow_auth=true') ||
        localStorage.getItem('agencyflow_user');
      if (hasAuth) setIsAuthenticated(true);
    }
  }, []);

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-[100] bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 w-full px-gutter flex items-center justify-between max-w-container-max mx-auto">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-stack-sm text-decoration-none">
            <img
              alt="AgencyFlow Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh7XRd3K5XvcrASIg5kn-kcInUo56DudWSKrnCgSFed4bkfUQogow883Vh5slNidU82zfTSL_tVdv-U99crl0DA6GnsH_v3R4Qlk-9dkFlp83fDv8YJvm4Di1xPsrREfqOVKB0J94HQmv0bJEc3fZl7K_gmScaAvJewss4pEw1GcfryvFkwXLMMj80DLA5Tb1IfcuuFqjsFSaJIGCNOvWLba5E6Nkk0X1XkesHCn1eMbynqxaqz8-nFg"
            />
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight">
              AgencyFlow
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-stack-lg">
            <a href="#features" className="text-button font-button text-on-surface-variant hover:text-on-surface transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-button font-button text-on-surface-variant hover:text-on-surface transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-button font-button text-on-surface-variant hover:text-on-surface transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-button font-button text-on-surface-variant hover:text-on-surface transition-colors">
              About
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-stack-md">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-2 bg-primary text-on-primary rounded text-button font-button hover:opacity-90 shadow-[0_0_30px_rgba(208,188,255,0.15)] transition-all"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-outline-variant rounded text-button font-button text-on-surface hover:bg-surface-container-high transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-6 py-2 bg-primary text-on-primary rounded text-button font-button hover:opacity-90 shadow-[0_0_30px_rgba(208,188,255,0.15)] transition-all"
                >
                  Sign Up Free
                </Link>
              </>
            )}
            <Link
              href={isAuthenticated ? '/dashboard' : '/login'}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-2"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 bg-surface">
        <div className="flex flex-col w-full font-body-md overflow-x-hidden">
          
          {/* Hero Section */}
          <section className="relative pt-32 pb-section-gap-mobile lg:pb-section-gap-desktop px-gutter flex flex-col items-center text-center max-w-container-max mx-auto w-full z-10">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 mb-8 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-label-caps font-label-caps text-on-surface-variant tracking-wider uppercase">
                AgencyFlow 2.0 is Here
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-display-xl-mobile lg:text-display-xl font-display-xl tracking-tighter text-on-surface max-w-4xl mb-6 leading-tight">
              Run Your Agency <br className="hidden sm:block" />{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Without the Chaos.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
              AgencyFlow brings leads, clients, proposals, projects, tasks, invoices, and your team together in one powerful workspace built for modern agencies.
            </p>

            {/* Button Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-6">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-fixed text-on-primary font-button rounded-lg shadow-[0_0_30px_rgba(208,188,255,0.2)] hover:shadow-[0_0_40px_rgba(208,188,255,0.3)] transition-all duration-300 text-center flex items-center justify-center gap-2"
              >
                Start Free <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-outline-variant hover:bg-surface-container text-on-surface font-button rounded-lg transition-all duration-300 text-center flex items-center justify-center gap-2"
              >
                Explore AgencyFlow
              </a>
            </div>

            {/* Guarantee Tag */}
            <div className="flex items-center gap-3 text-label-caps font-label-caps text-on-surface-variant opacity-80 mb-20">
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span> No credit card required. 14-day free trial.
            </div>

            {/* 3D Perspective Card Mockup */}
            <div className="relative w-full max-w-5xl mx-auto perspective-1000 group">
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10 bottom-0 h-32 translate-y-full" />
              <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-2xl overflow-hidden transform-gpu transition-transform duration-700 hover:rotate-x-2 hover:scale-[1.02]">
                <div className="h-10 border-b border-outline-variant/30 bg-surface-container flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <div className="w-3 h-3 rounded-full bg-tertiary" />
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  </div>
                  <div className="mx-auto flex-1 flex justify-center">
                    <div className="px-6 py-1 bg-surface-container-highest rounded-md text-[10px] text-on-surface-variant font-label-caps flex items-center gap-2">
                      <span className="material-symbols-outlined text-[12px]">lock</span> agencyflow.com/dashboard
                    </div>
                  </div>
                </div>
                <img
                  alt="AgencyFlow Dashboard showing Leads Pipeline and Project Status"
                  className="w-full h-auto object-cover relative z-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNWt16MpLwZYPsUD5ny1mP7OuFFGbmtrVnD_jnsovx4KL6SiWFNNJIXgIriWUdkiPvU3dTMfgX-xmP9Mz5Ns_ET6gVMjH662GoosVlGwitPYe10bho7kShzhgHun2TPwKFWlEHydbj8sCdI4eP3HJBICwJRuVI6DSAoP4V6bESI6k4KUGYWOqDI_wZV0m5iJ0taUdURuLmoimfne2YC2tBZF-OnMTkuTndqwCIc8j1A9aZJB3GIR5dEQ"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/20 rounded-full blur-[80px] -z-10" />
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10" />
            </div>

          </section>

          {/* Features Marquee Section */}
          <section id="features" className="border-y border-outline-variant/20 bg-surface-container-low overflow-hidden py-8">
            <div className="max-w-container-max mx-auto px-gutter mb-6 text-center">
              <h3 className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-widest">
                Everything your agency needs to operate
              </h3>
            </div>
            <div className="relative w-full flex overflow-x-hidden group">
              <div className="animate-marquee whitespace-nowrap flex gap-12 items-center px-6">
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-primary">filter_alt</span> Leads
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-secondary">groups</span> Clients
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-tertiary">description</span> Proposals
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-primary">work</span> Projects
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-secondary">check_circle</span> Tasks
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-tertiary">analytics</span> Analytics
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-primary">smart_toy</span> AI Assistant
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
              </div>

              <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-12 items-center px-6">
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-primary">filter_alt</span> Leads
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-secondary">groups</span> Clients
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-tertiary">description</span> Proposals
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-primary">work</span> Projects
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-secondary">check_circle</span> Tasks
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-tertiary">analytics</span> Analytics
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
                <div className="flex items-center gap-2 text-headline-md font-headline-md text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
                  <span className="material-symbols-outlined text-primary">smart_toy</span> AI Assistant
                </div>
                <span className="w-2 h-2 rounded-full bg-outline-variant/50" />
              </div>

              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface-container-low to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-surface-container-low to-transparent z-10 pointer-events-none" />
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low pt-section-gap-mobile pb-stack-lg lg:pt-section-gap-desktop">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-stack-lg mb-stack-lg">
            
            <div className="lg:col-span-2">
              <div className="flex items-center gap-stack-sm mb-stack-md">
                <img
                  alt="AgencyFlow Logo"
                  className="h-6 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh7XRd3K5XvcrASIg5kn-kcInUo56DudWSKrnCgSFed4bkfUQogow883Vh5slNidU82zfTSL_tVdv-U99crl0DA6GnsH_v3R4Qlk-9dkFlp83fDv8YJvm4Di1xPsrREfqOVKB0J94HQmv0bJEc3fZl7K_gmScaAvJewss4pEw1GcfryvFkwXLMMj80DLA5Tb1IfcuuFqjsFSaJIGCNOvWLba5E6Nkk0X1XkesHCn1eMbynqxaqz8-nFg"
                />
                <span className="font-headline-md text-headline-md text-on-surface text-[24px]">
                  AgencyFlow
                </span>
              </div>
              <p className="text-on-surface-variant text-body-md max-w-xs mb-stack-md">
                The operating system for modern agencies. Streamline your workflow, manage clients, and scale with confidence.
              </p>
              <div className="flex gap-4">
                <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined">public</span>
                </a>
                <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined">share</span>
                </a>
                <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined">alternate_email</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-label-caps text-label-caps text-on-surface mb-stack-md uppercase">
                Product
              </h4>
              <nav className="flex flex-col gap-3">
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#features">Features</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#pricing">Pricing</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Integrations</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Changelog</a>
              </nav>
            </div>

            <div>
              <h4 className="font-label-caps text-label-caps text-on-surface mb-stack-md uppercase">
                Company
              </h4>
              <nav className="flex flex-col gap-3">
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#about">About Us</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Careers</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Contact</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Blog</a>
              </nav>
            </div>

            <div>
              <h4 className="font-label-caps text-label-caps text-on-surface mb-stack-md uppercase">
                Legal
              </h4>
              <nav className="flex flex-col gap-3">
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Privacy</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Terms</a>
                <a className="text-body-md text-on-surface-variant hover:text-on-surface" href="#">Security</a>
              </nav>
            </div>

          </div>

          <div className="pt-stack-lg border-t border-outline-variant text-center">
            <p className="text-on-surface-variant text-label-caps">
              © 2024 AgencyFlow Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
