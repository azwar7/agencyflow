'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NewLeadModal } from './NewLeadModal';
import { NewDealModal } from './NewDealModal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('OWNER');

  const handleModalSuccess = () => {
    // Dispatch custom event to trigger page refresh on active view
    window.dispatchEvent(new Event('agencyflow-refresh'));
  };

  React.useEffect(() => {
    const handleOpenLeadModal = () => setIsLeadModalOpen(true);
    window.addEventListener('agencyflow-open-new-lead', handleOpenLeadModal);
    return () => window.removeEventListener('agencyflow-open-new-lead', handleOpenLeadModal);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
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
    </div>
  );
}
