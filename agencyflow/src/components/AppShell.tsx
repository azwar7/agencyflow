'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NewLeadModal } from './NewLeadModal';
import { NewDealModal } from './NewDealModal';
import { SampleDataBanner } from './SampleDataBanner';
import { OnboardingModal } from './OnboardingModal';
import { ProductTour } from './ProductTour';
import { GettingStartedWidget } from './GettingStartedWidget';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('OWNER');

  const handleModalSuccess = () => {
    // Dispatch custom event to trigger page refresh on active view
    window.dispatchEvent(new Event('agencyflow-refresh'));
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const handleOpenLeadModal = () => setIsLeadModalOpen(true);
    const handleOpenDealModal = () => setIsDealModalOpen(true);
    const handleStartTour = () => setIsTourOpen(true);

    window.addEventListener('agencyflow-open-new-lead', handleOpenLeadModal);
    window.addEventListener('agencyflow-open-new-deal', handleOpenDealModal);
    window.addEventListener('agencyflow-start-tour', handleStartTour);

    return () => {
      window.removeEventListener('agencyflow-open-new-lead', handleOpenLeadModal);
      window.removeEventListener('agencyflow-open-new-deal', handleOpenDealModal);
      window.removeEventListener('agencyflow-start-tour', handleStartTour);
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(192, 193, 255, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
        <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f1117', color: 'var(--on-surface)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Authenticating workspace...</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <SampleDataBanner />
        <Header
          onOpenNewLead={() => setIsLeadModalOpen(true)}
          onOpenNewDeal={() => setIsDealModalOpen(true)}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
        />
        <main className="page-container">{children}</main>
      </div>

      <NewLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <NewDealModal
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <OnboardingModal onStartTour={() => setIsTourOpen(true)} />
      <ProductTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      <GettingStartedWidget />
    </div>
  );
}
