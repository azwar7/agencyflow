'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { SettingsSearchModal } from '@/components/SettingsSearchModal';
import { TeamMembersTab } from '@/components/settings/TeamMembersTab';
import { SecurityAuthTab } from '@/components/settings/SecurityAuthTab';
import { AuditLogsTab } from '@/components/settings/AuditLogsTab';
import { PipelineStagesTab } from '@/components/settings/PipelineStagesTab';
import { CustomFieldsTab } from '@/components/settings/CustomFieldsTab';
import { LeadRoutingTab } from '@/components/settings/LeadRoutingTab';
import { AiConfigTab } from '@/components/settings/AiConfigTab';
import { EmailOutreachTab } from '@/components/settings/EmailOutreachTab';
import { IntegrationsHubTab } from '@/components/settings/IntegrationsHubTab';
import { WorkflowSettingsTab } from '@/components/settings/WorkflowSettingsTab';
import { ApiWebhooksTab } from '@/components/settings/ApiWebhooksTab';
import { DataManagementTab } from '@/components/settings/DataManagementTab';
import { SandboxTab } from '@/components/settings/SandboxTab';
import { SubscriptionBillingTab } from '@/components/settings/SubscriptionBillingTab';
import { DangerZoneTab } from '@/components/settings/DangerZoneTab';
import {
  SETTINGS_NAVIGATION_GROUPS,
  SETTINGS_REGISTRY,
} from '@/config/settings-registry';
import {
  Building2,
  User,
  Sliders,
  Palette,
  Bell,
  Users,
  Shield,
  Kanban,
  FileText,
  Target,
  Webhook,
  Sparkles,
  Mail,
  History,
  Download,
  Database,
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  building: <Building2 size={16} />,
  user: <User size={16} />,
  sliders: <Sliders size={16} />,
  palette: <Palette size={16} />,
  bell: <Bell size={16} />,
  users: <Users size={16} />,
  shield: <Shield size={16} />,
  kanban: <Kanban size={16} />,
  'file-text': <FileText size={16} />,
  target: <Target size={16} />,
  webhook: <Webhook size={16} />,
  sparkles: <Sparkles size={16} />,
  mail: <Mail size={16} />,
  history: <History size={16} />,
  download: <Download size={16} />,
  database: <Database size={16} />,
  'credit-card': <CreditCard size={16} />,
};

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SGD', 'AED'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('workspace');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Feedback Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // -------------------------------------------------------------
  // 1. WORKSPACE SETTINGS STATE (Page-level save)
  // -------------------------------------------------------------
  const [wsLoading, setWsLoading] = useState(true);
  const [wsSaving, setWsSaving] = useState(false);
  const [wsDirty, setWsDirty] = useState(false);
  const [wsData, setWsData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    website: '',
    industry: '',
    companySize: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    timezone: 'UTC',
    language: 'en',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    currency: 'USD',
    additionalCurrencies: [] as string[],
    numberFormat: 'standard',
    firstDayOfWeek: 1,
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    fiscalYearStartMonth: 1,
    fiscalYearType: 'standard',
  });

  const fetchWorkspace = useCallback(async () => {
    try {
      setWsLoading(true);
      const res = await fetch('/api/v1/settings/workspace');
      const json = await res.json();
      if (json.success && json.data) {
        setWsData({
          name: json.data.name || '',
          slug: json.data.slug || '',
          logoUrl: json.data.logoUrl || '',
          website: json.data.website || '',
          industry: json.data.industry || 'Digital Marketing & Growth',
          companySize: json.data.companySize || '1-5',
          businessEmail: json.data.businessEmail || '',
          businessPhone: json.data.businessPhone || '',
          businessAddress: json.data.businessAddress || '',
          timezone: json.data.timezone || 'UTC',
          language: json.data.language || 'en',
          dateFormat: json.data.dateFormat || 'YYYY-MM-DD',
          timeFormat: json.data.timeFormat || '24h',
          currency: json.data.currency || 'USD',
          additionalCurrencies: json.data.additionalCurrencies || [],
          numberFormat: json.data.numberFormat || 'standard',
          firstDayOfWeek: json.data.firstDayOfWeek ?? 1,
          workingDays: json.data.workingDays || [1, 2, 3, 4, 5],
          workingHoursStart: json.data.workingHoursStart || '09:00',
          workingHoursEnd: json.data.workingHoursEnd || '17:00',
          fiscalYearStartMonth: json.data.fiscalYearStartMonth ?? 1,
          fiscalYearType: json.data.fiscalYearType || 'standard',
        });
        setWsDirty(false);
      }
    } catch (err) {
      console.error('Failed to load workspace settings', err);
    } finally {
      setWsLoading(false);
    }
  }, []);

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'OWNER' && user?.role !== 'ADMIN') {
      showToast('Only Workspace Owners and Admins can update organization settings.', 'error');
      return;
    }

    try {
      setWsSaving(true);
      const res = await fetch('/api/v1/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wsData),
      });
      const json = await res.json();
      if (json.success) {
        setWsDirty(false);
        showToast('Workspace organization & regional settings saved.');
      } else {
        showToast(json.error?.message || 'Failed to save workspace settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error saving settings', 'error');
    } finally {
      setWsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // 2. PROFILE & PERSONAL PREFERENCES STATE
  // -------------------------------------------------------------
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    role: '',
    jobTitle: '',
    phone: '',
    avatarUrl: '',
    usePersonalPreferences: false,
    personalTimezone: '',
    personalDateFormat: 'YYYY-MM-DD',
    personalTimeFormat: '24h',
    defaultLandingPage: '/dashboard',
    defaultCrmView: 'kanban',
    rememberFilters: true,
    sidebarCollapsed: false,
    workspaceDefaults: {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      currency: 'USD',
    },
  });

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await fetch('/api/v1/settings/profile');
      const json = await res.json();
      if (json.success && json.data) {
        setProfileData({
          fullName: json.data.fullName || '',
          email: json.data.email || '',
          role: json.data.role || '',
          jobTitle: json.data.jobTitle || '',
          phone: json.data.phone || '',
          avatarUrl: json.data.avatarUrl || '',
          usePersonalPreferences: Boolean(json.data.usePersonalPreferences),
          personalTimezone: json.data.personalTimezone || '',
          personalDateFormat: json.data.personalDateFormat || 'YYYY-MM-DD',
          personalTimeFormat: json.data.personalTimeFormat || '24h',
          defaultLandingPage: json.data.defaultLandingPage || '/dashboard',
          defaultCrmView: json.data.defaultCrmView || 'kanban',
          rememberFilters: json.data.rememberFilters ?? true,
          sidebarCollapsed: Boolean(json.data.sidebarCollapsed),
          workspaceDefaults: json.data.workspace || {
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            currency: 'USD',
          },
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const saveProfilePreferences = async (updates: Partial<typeof profileData>) => {
    try {
      setProfileSaving(true);
      const res = await fetch('/api/v1/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        setProfileData((prev) => ({ ...prev, ...updates }));
        showToast('Profile and preferences updated.');
      } else {
        showToast(json.error?.message || 'Failed to save profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // -------------------------------------------------------------
  // 3. APPEARANCE & ACCESSIBILITY STATE (Immediate save)
  // -------------------------------------------------------------
  const [appearance, setAppearance] = useState({
    theme: 'dark',
    density: 'comfortable',
    reducedMotion: false,
    textSize: 'normal',
    highContrast: false,
  });
  const [appearanceSaving, setAppearanceSaving] = useState<string | null>(null);

  const fetchAppearance = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/appearance');
      const json = await res.json();
      if (json.success && json.data) {
        setAppearance({
          theme: json.data.theme || 'dark',
          density: json.data.density || 'comfortable',
          reducedMotion: Boolean(json.data.reducedMotion),
          textSize: json.data.textSize || 'normal',
          highContrast: Boolean(json.data.highContrast),
        });
        applyAppearanceToDOM(json.data);
      }
    } catch (err) {
      console.error('Failed to load appearance', err);
    }
  }, []);

  const applyAppearanceToDOM = (data: Partial<typeof appearance>) => {
    if (typeof document === 'undefined') return;
    if (data.theme) document.documentElement.setAttribute('data-theme', data.theme);
    if (data.density) document.documentElement.setAttribute('data-density', data.density);
    if (data.reducedMotion !== undefined)
      document.documentElement.setAttribute('data-reduced-motion', String(data.reducedMotion));
    if (data.textSize) document.documentElement.setAttribute('data-text-size', data.textSize);
    if (data.highContrast !== undefined)
      document.documentElement.setAttribute('data-high-contrast', String(data.highContrast));
  };

  const updateAppearance = async (key: keyof typeof appearance, value: any) => {
    const updated = { ...appearance, [key]: value };
    setAppearance(updated);
    applyAppearanceToDOM(updated);
    setAppearanceSaving(key);

    try {
      const res = await fetch('/api/v1/settings/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      const json = await res.json();
      if (json.success) {
        // Broadcast custom event
        window.dispatchEvent(new CustomEvent('agencyflow-appearance-updated', { detail: updated }));
      } else {
        showToast('Failed to save appearance setting', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTimeout(() => setAppearanceSaving(null), 800);
    }
  };

  // -------------------------------------------------------------
  // 4. NOTIFICATION PREFERENCES STATE (Immediate toggle save)
  // -------------------------------------------------------------
  const [notifications, setNotifications] = useState({
    notifyEmailDeals: true,
    notifyEmailTasks: true,
    notifyEmailProposals: true,
    notifyEmailInvoices: true,
    notifyInAppDeals: true,
    notifyInAppTasks: true,
    notifyInAppProposals: true,
    notifyInAppInvoices: true,
  });
  const [notifSaving, setNotifSaving] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/notifications');
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications({
          notifyEmailDeals: json.data.notifyEmailDeals ?? true,
          notifyEmailTasks: json.data.notifyEmailTasks ?? true,
          notifyEmailProposals: json.data.notifyEmailProposals ?? true,
          notifyEmailInvoices: json.data.notifyEmailInvoices ?? true,
          notifyInAppDeals: json.data.notifyInAppDeals ?? true,
          notifyInAppTasks: json.data.notifyInAppTasks ?? true,
          notifyInAppProposals: json.data.notifyInAppProposals ?? true,
          notifyInAppInvoices: json.data.notifyInAppInvoices ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, []);

  const toggleNotification = async (key: keyof typeof notifications) => {
    const newVal = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newVal }));
    setNotifSaving(key);

    try {
      const res = await fetch('/api/v1/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newVal }),
      });
      const json = await res.json();
      if (!json.success) {
        setNotifications((prev) => ({ ...prev, [key]: !newVal }));
        showToast('Failed to update notification setting', 'error');
      }
    } catch (err: any) {
      setNotifications((prev) => ({ ...prev, [key]: !newVal }));
      showToast(err.message, 'error');
    } finally {
      setTimeout(() => setNotifSaving(null), 600);
    }
  };

  // -------------------------------------------------------------
  // 5. SAMPLE DATA SEEDING (Sandbox Tab)
  // -------------------------------------------------------------
  const [seeding, setSeeding] = useState(false);
  const handleLoadSampleData = async () => {
    if (!confirm('Load complete sample agency leads, deals, deliverables, and invoices into this workspace?')) return;
    try {
      setSeeding(true);
      const res = await fetch('/api/v1/workspace/sample-data', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('Sample data successfully loaded!');
        window.dispatchEvent(new Event('agencyflow-refresh'));
      } else {
        showToast(json.error?.message || 'Failed to load sample data', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearSampleData = async () => {
    if (!confirm('Wipe all sample demo records from this workspace? Your real data will be preserved.')) return;
    try {
      setSeeding(true);
      const res = await fetch('/api/v1/workspace/sample-data', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Sample records cleared from workspace.');
        window.dispatchEvent(new Event('agencyflow-refresh'));
      } else {
        showToast(json.error?.message || 'Failed to clear sample data', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchWorkspace();
    fetchProfile();
    fetchAppearance();
    fetchNotifications();
  }, [fetchWorkspace, fetchProfile, fetchAppearance, fetchNotifications]);

  // Global Keyboard Shortcut for Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', minHeight: 'calc(100vh - 4rem)' }}>
        
        {/* Top Header & Global Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--on-surface)', margin: 0, letterSpacing: '-0.02em' }}>
              Settings & Workspace Controls
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              Configure organization branding, regional standards, personal preferences, accessibility, and CRM notifications.
            </p>
          </div>

          {/* Search Trigger Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'var(--surface-container)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
                color: 'var(--on-surface-variant)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <Search size={16} color="#a78bfa" />
              <span>Search settings & registry...</span>
              <kbd
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#c4b5fd',
                  marginLeft: '0.5rem',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary mobile-only"
              style={{ padding: '0.5rem', display: 'none' }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toast && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              background: toast.type === 'success' ? 'rgba(78, 222, 163, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(78, 222, 163, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: toast.type === 'success' ? '#4edea3' : '#f87171',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        )}

        {/* Two-Column Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Grouped Navigation Sidebar with Dedicated Scrollbar */}
          <div
            className="settings-options-scroll"
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {SETTINGS_NAVIGATION_GROUPS.map((group) => (
              <div key={group.id}>
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--outline)',
                    padding: '0.25rem 0.5rem 0.4rem 0.5rem',
                  }}
                >
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  {group.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isLocked = tab.roleRequired === 'ADMIN' && !isOwnerOrAdmin;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.825rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#ffffff' : 'var(--on-surface-variant)',
                          background: isActive ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.1))' : 'transparent',
                          border: isActive ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ color: isActive ? '#a78bfa' : 'var(--outline)' }}>
                            {ICON_MAP[tab.icon] || <Sliders size={16} />}
                          </span>
                          <span>{tab.label}</span>
                        </div>

                        {!tab.isImplemented && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.06)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            Soon
                          </span>
                        )}

                        {isLocked && tab.isImplemented && (
                          <Lock size={12} color="#f87171" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Content Panel */}
          <div
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.75rem',
              minHeight: '600px',
            }}
          >
            {/* ------------------------------------------------------------- */}
            {/* TAB: WORKSPACE SETTINGS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'workspace' && (
              <form onSubmit={handleSaveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      Workspace Identity & Regional Standards
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
                      Configure organization branding, regional defaults, business calendar, and fiscal year.
                    </p>
                  </div>

                  {/* Page-level Save Button */}
                  <button
                    type="submit"
                    disabled={wsSaving || !isOwnerOrAdmin}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      border: 'none',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: !isOwnerOrAdmin ? 0.6 : 1,
                      cursor: !isOwnerOrAdmin ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Save size={16} />
                    {wsSaving ? 'Saving...' : wsDirty ? 'Save Changes *' : 'Save Changes'}
                  </button>
                </div>

                {!isOwnerOrAdmin && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={14} /> Organization settings are read-only for your role. Contact a Workspace Owner or Admin to update.
                  </div>
                )}

                {/* Section: Organization Identity */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
                    1. Organization Identity
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Workspace Name *
                      </label>
                      <input
                        type="text"
                        disabled={!isOwnerOrAdmin}
                        value={wsData.name}
                        onChange={(e) => { setWsData({ ...wsData, name: e.target.value }); setWsDirty(true); }}
                        required
                        className="form-input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Workspace Slug (Subdomain)
                      </label>
                      <input
                        type="text"
                        disabled={!isOwnerOrAdmin}
                        value={wsData.slug}
                        onChange={(e) => { setWsData({ ...wsData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }); setWsDirty(true); }}
                        className="form-input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Website URL
                      </label>
                      <input
                        type="text"
                        disabled={!isOwnerOrAdmin}
                        value={wsData.website}
                        placeholder="https://agency.com"
                        onChange={(e) => { setWsData({ ...wsData, website: e.target.value }); setWsDirty(true); }}
                        className="form-input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Industry Vertical
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.industry}
                        onChange={(e) => { setWsData({ ...wsData, industry: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="Digital Marketing & Growth">Digital Marketing & Growth</option>
                        <option value="Software & Web Development">Software & Web Development</option>
                        <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                        <option value="SEO & Content Marketing">SEO & Content Marketing</option>
                        <option value="Full-Service Agency">Full-Service Agency</option>
                        <option value="Solo Consultancy">Solo Consultancy</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Company Size
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.companySize}
                        onChange={(e) => { setWsData({ ...wsData, companySize: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="1-5">1-5 Team Members</option>
                        <option value="6-20">6-20 Team Members</option>
                        <option value="21-50">21-50 Team Members</option>
                        <option value="50+">50+ Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Business Email (Invoices & Proposals)
                      </label>
                      <input
                        type="email"
                        disabled={!isOwnerOrAdmin}
                        value={wsData.businessEmail}
                        placeholder="billing@agency.com"
                        onChange={(e) => { setWsData({ ...wsData, businessEmail: e.target.value }); setWsDirty(true); }}
                        className="form-input"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Regional Preferences */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
                    2. Regional Preferences & Formats
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Default Timezone
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.timezone}
                        onChange={(e) => { setWsData({ ...wsData, timezone: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Base Currency
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.currency}
                        onChange={(e) => { setWsData({ ...wsData, currency: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c} ($)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Date Format
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.dateFormat}
                        onChange={(e) => { setWsData({ ...wsData, dateFormat: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Time Format
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.timeFormat}
                        onChange={(e) => { setWsData({ ...wsData, timeFormat: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="24h">24-Hour (14:30)</option>
                        <option value="12h">12-Hour (02:30 PM)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        First Day of Week
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.firstDayOfWeek}
                        onChange={(e) => { setWsData({ ...wsData, firstDayOfWeek: Number(e.target.value) }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value={1}>Monday</option>
                        <option value={0}>Sunday</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Business Calendar & Working Hours */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                    3. Business Calendar & Operating Hours
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '1rem' }}>
                    Defines sprint turnaround calculations, SLA deadlines, and team capacity.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Daily Working Hours Start
                      </label>
                      <input
                        type="time"
                        disabled={!isOwnerOrAdmin}
                        value={wsData.workingHoursStart}
                        onChange={(e) => { setWsData({ ...wsData, workingHoursStart: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Daily Working Hours End
                      </label>
                      <input
                        type="time"
                        disabled={!isOwnerOrAdmin}
                        value={wsData.workingHoursEnd}
                        onChange={(e) => { setWsData({ ...wsData, workingHoursEnd: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Fiscal Settings */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
                    4. Fiscal & Financial Calendar
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Fiscal Year Starting Month
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.fiscalYearStartMonth}
                        onChange={(e) => { setWsData({ ...wsData, fiscalYearStartMonth: Number(e.target.value) }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        {MONTHS.map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Fiscal Calculation Type
                      </label>
                      <select
                        disabled={!isOwnerOrAdmin}
                        value={wsData.fiscalYearType}
                        onChange={(e) => { setWsData({ ...wsData, fiscalYearType: e.target.value }); setWsDirty(true); }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="standard">Standard Calendar Year (Jan 1 - Dec 31)</option>
                        <option value="custom">Custom Fiscal Calendar Cycle</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: PERSONAL PROFILE */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    My Account & Personal Profile
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
                    Manage your personal name, contact details, and role permissions.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                      Email Address (Login ID)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profileData.email}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={profileData.jobTitle}
                      placeholder="e.g. Agency Principal / Growth Lead"
                      onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                      Assigned Workspace Role
                    </label>
                    <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '6px', color: '#c4b5fd', fontSize: '0.85rem', fontWeight: 700 }}>
                      {profileData.role === 'OWNER' ? 'Workspace Owner' : profileData.role || 'Member'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                  <button
                    onClick={() => saveProfilePreferences({ fullName: profileData.fullName, jobTitle: profileData.jobTitle })}
                    disabled={profileSaving}
                    className="btn btn-primary"
                    style={{ background: '#8b5cf6', border: 'none', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {profileSaving ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: PREFERENCES */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'preferences' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Personal Preferences & Interface Behavior
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
                    Choose between workspace regional defaults or custom personal overrides.
                  </p>
                </div>

                {/* Section: Regional Overrides */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '8px', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                        Regional Preference Mode
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
                        {profileData.usePersonalPreferences
                          ? 'Using custom personal timezone and date formats.'
                          : `Inheriting Workspace Default (${profileData.workspaceDefaults.timezone}, ${profileData.workspaceDefaults.currency}).`}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const next = !profileData.usePersonalPreferences;
                        setProfileData({ ...profileData, usePersonalPreferences: next });
                        saveProfilePreferences({ usePersonalPreferences: next });
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: profileData.usePersonalPreferences ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {profileData.usePersonalPreferences ? 'Using Personal Preference' : 'Use Workspace Default'}
                    </button>
                  </div>

                  {profileData.usePersonalPreferences && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed rgba(139, 92, 246, 0.3)' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd', display: 'block', marginBottom: '0.35rem' }}>
                          Personal Timezone Override
                        </label>
                        <select
                          value={profileData.personalTimezone || profileData.workspaceDefaults.timezone}
                          onChange={(e) => {
                            setProfileData({ ...profileData, personalTimezone: e.target.value });
                            saveProfilePreferences({ personalTimezone: e.target.value });
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c4b5fd', display: 'block', marginBottom: '0.35rem' }}>
                          Personal Date Format Override
                        </label>
                        <select
                          value={profileData.personalDateFormat || 'YYYY-MM-DD'}
                          onChange={(e) => {
                            setProfileData({ ...profileData, personalDateFormat: e.target.value });
                            saveProfilePreferences({ personalDateFormat: e.target.value as any });
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Interface Navigation */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
                    Interface & CRM Behavior
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Default Landing Page
                      </label>
                      <select
                        value={profileData.defaultLandingPage}
                        onChange={(e) => {
                          setProfileData({ ...profileData, defaultLandingPage: e.target.value });
                          saveProfilePreferences({ defaultLandingPage: e.target.value });
                        }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="/dashboard">Dashboard (Overview & KPIs)</option>
                        <option value="/leads">Leads (Discovery & Ingestion)</option>
                        <option value="/pipeline">Pipeline (Kanban Deal Stages)</option>
                        <option value="/clients">Clients (Directory & Retainers)</option>
                        <option value="/tasks">Tasks (Workload & Sprint)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                        Default CRM Deal Pipeline View
                      </label>
                      <select
                        value={profileData.defaultCrmView}
                        onChange={(e) => {
                          setProfileData({ ...profileData, defaultCrmView: e.target.value });
                          saveProfilePreferences({ defaultCrmView: e.target.value as any });
                        }}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="kanban">Kanban Column Stages</option>
                        <option value="table">Tabular Data Grid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: APPEARANCE & ACCESSIBILITY */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Appearance & Accessibility Controls
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
                    Personalize themes, display density, and toggle motion sensitivity controls. Changes apply immediately.
                  </p>
                </div>

                {/* Theme Selector Cards */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.65rem' }}>
                    Visual Color Theme
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[
                      { id: 'dark', label: 'Dark Mode', desc: 'Obsidian glassmorphism with violet accents' },
                      { id: 'light', label: 'Light Mode', desc: 'High-contrast light slate workspace' },
                      { id: 'system', label: 'System Theme', desc: 'Automatically match operating system' },
                    ].map((t) => (
                      <div
                        key={t.id}
                        onClick={() => updateAppearance('theme', t.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: appearance.theme === t.id ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-container)',
                          border: appearance.theme === t.id ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: appearance.theme === t.id ? '#ffffff' : '#cbd5e1' }}>
                          {t.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {t.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Density Selector Cards */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.65rem' }}>
                    Interface Display Density
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {[
                      { id: 'comfortable', label: 'Comfortable (Spacious)', desc: 'Standard padding and relaxed layout hierarchy' },
                      { id: 'compact', label: 'Compact (Data-Dense)', desc: 'Tighter table rows and compressed card spacing' },
                    ].map((d) => (
                      <div
                        key={d.id}
                        onClick={() => updateAppearance('density', d.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          background: appearance.density === d.id ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-container)',
                          border: appearance.density === d.id ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: appearance.density === d.id ? '#ffffff' : '#cbd5e1' }}>
                          {d.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {d.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accessibility Toggles */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                    Accessibility Controls
                  </h3>

                  {/* Reduced Motion Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface-container)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>Reduced Motion</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                        Disables all non-essential card animations, pulse glows, and CSS transitions.
                      </div>
                    </div>
                    <button
                      onClick={() => updateAppearance('reducedMotion', !appearance.reducedMotion)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: appearance.reducedMotion ? '#8b5cf6' : 'rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: appearance.reducedMotion ? '23px' : '3px',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>

                  {/* High Contrast Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--surface-container)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>High Contrast Outlines</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                        Amplifies card borders and input focus rings for visual clarity.
                      </div>
                    </div>
                    <button
                      onClick={() => updateAppearance('highContrast', !appearance.highContrast)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: appearance.highContrast ? '#8b5cf6' : 'rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: appearance.highContrast ? '23px' : '3px',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: NOTIFICATIONS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Notification Preferences Matrix
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
                    Configure automated alert channels by CRM event category. Critical security notices cannot be disabled.
                  </p>
                </div>

                {/* Matrix Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--outline)', fontWeight: 600 }}>EVENT CATEGORY</th>
                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--outline)', fontWeight: 600, textAlign: 'center', width: '120px' }}>IN-APP</th>
                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--outline)', fontWeight: 600, textAlign: 'center', width: '120px' }}>EMAIL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Deals */}
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>Deals & Pipeline Updates</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Won/lost notices, stage advancements, and target alerts</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyInAppDeals}
                            onChange={() => toggleNotification('notifyInAppDeals')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyEmailDeals}
                            onChange={() => toggleNotification('notifyEmailDeals')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>

                      {/* Tasks */}
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>Tasks & Deadlines</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Direct task assignments and 24-hour deadline reminders</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyInAppTasks}
                            onChange={() => toggleNotification('notifyInAppTasks')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyEmailTasks}
                            onChange={() => toggleNotification('notifyEmailTasks')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>

                      {/* Proposals */}
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>Proposals & SOW Signing</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Client document views, comments, and digital signature completion</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyInAppProposals}
                            onChange={() => toggleNotification('notifyInAppProposals')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyEmailProposals}
                            onChange={() => toggleNotification('notifyEmailProposals')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>

                      {/* Invoices */}
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>Invoices & Billing</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Payment receipts and overdue invoice notices</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyInAppInvoices}
                            onChange={() => toggleNotification('notifyInAppInvoices')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={notifications.notifyEmailInvoices}
                            onChange={() => toggleNotification('notifyEmailInvoices')}
                            style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>

                      {/* Security Alerts (MANDATORY) */}
                      <tr>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#4edea3', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Shield size={14} /> Security & Account Authentication Alerts
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Password changes, OTP logins, and unauthorized access attempts
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: '#4edea3', background: 'rgba(78, 222, 163, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            MANDATORY
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: '#4edea3', background: 'rgba(78, 222, 163, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            MANDATORY
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: MEMBERS & ROLES */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'team-members' && (
              <TeamMembersTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SECURITY & AUTHENTICATION */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'security-auth' && (
              <SecurityAuthTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: AUDIT LOGS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'audit-logs' && (
              <AuditLogsTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SANDBOX & DEMO DATA */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'sandbox-seed' && (
              <SandboxTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: PIPELINE & STAGES */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'pipeline-stages' && (
              <PipelineStagesTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: CUSTOM FIELDS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'custom-fields' && (
              <CustomFieldsTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: LEAD LIFECYCLE & DEFAULTS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'lead-routing' && (
              <LeadRoutingTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: AI & INTELLIGENCE */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'ai-config' && (
              <AiConfigTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: EMAIL & OUTREACH */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'email-config' && (
              <EmailOutreachTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: INTEGRATIONS HUB */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'integrations-hub' && (
              <IntegrationsHubTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: WORKFLOWS & N8N */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'workflow-config' && (
              <WorkflowSettingsTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: REST API KEYS & WEBHOOKS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'api-webhooks' && (
              <ApiWebhooksTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: DATA MANAGEMENT */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'data-export' && (
              <DataManagementTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SUBSCRIPTION & USAGE */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'subscription-billing' && (
              <SubscriptionBillingTab currentUserRole={user?.role} showToast={showToast} />
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: DANGER ZONE */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'danger-zone' && (
              <DangerZoneTab currentUserRole={user?.role} workspaceName={wsData.name} showToast={showToast} />
            )}
          </div>
        </div>

        {/* Global Search Dialog Modal */}
        <SettingsSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectSetting={(tabId) => {
            setActiveTab(tabId);
          }}
          userRole={user?.role}
        />
      </div>
    </AppShell>
  );
}
