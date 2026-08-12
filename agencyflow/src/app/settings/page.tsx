'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Building2,
  ShieldCheck,
  Database,
  RefreshCw,
  CheckCircle2,
  User,
  Bell,
  Lock,
  Globe,
  Sliders,
  Check,
  Save,
  AlertTriangle,
} from 'lucide-react';

type SettingsTab = 'workspace' | 'profile' | 'team' | 'security' | 'sandbox' | 'notifications';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  
  // Existing Database Seed state
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  // Form states for Settings
  const [orgName, setOrgName] = useState('Apex Digital Agency');
  const [tenantSlug, setTenantSlug] = useState('apex-digital');
  const [timezone, setTimezone] = useState('EST (UTC-05:00)');
  const [currency, setCurrency] = useState('USD ($)');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Profile Form state
  const [profileName, setProfileName] = useState('Alex Sterling');
  const [profileEmail, setProfileEmail] = useState('alex@agencyflow.io');
  const [profileRole] = useState('OWNER');

  // Notification Toggles State
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyDeals, setNotifyDeals] = useState(true);
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyProposals, setNotifyProposals] = useState(true);

  // Re-Seed handler (Preserved 1:1)
  const handleReSeed = async () => {
    setSeeding(true);
    setSeedSuccess('');
    try {
      const res = await fetch('/api/v1/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSeedSuccess('Database re-seeded with clean sample agency records!');
        setTimeout(() => setSeedSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccessMsg('Workspace settings saved successfully!');
    setTimeout(() => setSavedSuccessMsg(''), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccessMsg('Profile information updated!');
    setTimeout(() => setSavedSuccessMsg(''), 3500);
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: 'calc(100vh - 4rem)' }}>
        
        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
            Manage your AgencyFlow workspace, account preferences, team access, and sandbox data.
          </p>
        </div>

        {/* Success Alert Toast */}
        {savedSuccessMsg && (
          <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem', background: 'rgba(78, 222, 163, 0.15)', border: '1px solid rgba(78, 222, 163, 0.3)', color: 'var(--secondary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} /> {savedSuccessMsg}
          </div>
        )}

        {/* Two-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left Settings Sidebar Navigation */}
          <div className="glass-card" style={{ padding: '0.85rem', borderRadius: '0.85rem', background: 'var(--surface-container)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Category: GENERAL */}
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--outline)', fontWeight: 700, padding: '0.35rem 0.65rem 0.5rem 0.65rem' }}>
                GENERAL
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <button
                  onClick={() => setActiveTab('workspace')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'workspace' ? 600 : 400,
                    color: activeTab === 'workspace' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    background: activeTab === 'workspace' ? 'rgba(192, 193, 255, 0.12)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <Building2 size={16} /> Workspace
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'profile' ? 600 : 400,
                    color: activeTab === 'profile' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    background: activeTab === 'profile' ? 'rgba(192, 193, 255, 0.12)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <User size={16} /> My Profile
                </button>
              </div>
            </div>

            {/* Category: SECURITY & ACCESS */}
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--outline)', fontWeight: 700, padding: '0.35rem 0.65rem 0.5rem 0.65rem' }}>
                SECURITY & ACCESS
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <button
                  onClick={() => setActiveTab('team')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'team' ? 600 : 400,
                    color: activeTab === 'team' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    background: activeTab === 'team' ? 'rgba(192, 193, 255, 0.12)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <ShieldCheck size={16} /> Team & Roles
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'security' ? 600 : 400,
                    color: activeTab === 'security' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    background: activeTab === 'security' ? 'rgba(192, 193, 255, 0.12)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <Lock size={16} /> Security & Auth
                </button>
              </div>
            </div>

            {/* Category: SYSTEM & DATA */}
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--outline)', fontWeight: 700, padding: '0.35rem 0.65rem 0.5rem 0.65rem' }}>
                SYSTEM & DATA
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <button
                  onClick={() => setActiveTab('sandbox')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'sandbox' ? 600 : 400,
                    color: activeTab === 'sandbox' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    background: activeTab === 'sandbox' ? 'rgba(192, 193, 255, 0.12)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <Database size={16} /> Sandbox Controls
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'notifications' ? 600 : 400,
                    color: activeTab === 'notifications' ? 'var(--primary)' : 'var(--on-surface-variant)',
                    background: activeTab === 'notifications' ? 'rgba(192, 193, 255, 0.12)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <Bell size={16} /> Notifications
                </button>
              </div>
            </div>

          </div>

          {/* Right Main Settings Content Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* TAB: WORKSPACE */}
            {activeTab === 'workspace' && (
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '0.85rem', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Building2 size={22} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)' }}>Workspace Parameters</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Organization identity, tenant parameters, and regional defaults.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Organization Name</label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Tenant Slug Identifier</label>
                      <input
                        type="text"
                        disabled
                        value={tenantSlug}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-low)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--outline)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Default Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                      >
                        <option value="EST (UTC-05:00)">EST (UTC-05:00 Eastern Time)</option>
                        <option value="PST (UTC-08:00)">PST (UTC-08:00 Pacific Time)</option>
                        <option value="GMT (UTC+00:00)">GMT (UTC+00:00 London)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Base Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                      >
                        <option value="USD ($)">USD ($) United States Dollar</option>
                        <option value="EUR (€)">EUR (€) Euro</option>
                        <option value="GBP (£)">GBP (£) British Pound</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '0.85rem', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <User size={22} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)' }}>Personal Profile</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Manage your personal details and account role.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'var(--primary-container)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.15rem' }}>
                      AS
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)' }}>Alex Sterling</p>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(192, 193, 255, 0.15)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800 }}>
                        {profileRole}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Email Address</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Save size={16} /> Update Profile
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: TEAM & ROLES (Preserved Existing Role Table) */}
            {activeTab === 'team' && (
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '0.85rem', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--secondary)' }} />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)' }}>Team Members & Role Access</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Role-based access controls and permissions matrix.</p>
                  </div>
                </div>

                <div style={{ overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>Email</th>
                        <th>Assigned Role</th>
                        <th>Access Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Sarah Jenkins</td>
                        <td>sarah@apexdigital.com</td>
                        <td>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(192, 193, 255, 0.15)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800 }}>OWNER</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Full Administrative & Billing Control</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Marcus Vance</td>
                        <td>marcus@apexdigital.com</td>
                        <td>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(78, 222, 163, 0.15)', color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: 800 }}>MANAGER</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Team Supervision & Pipeline Management</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Alex Rivera</td>
                        <td>alex@apexdigital.com</td>
                        <td>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(255, 185, 95, 0.15)', color: 'var(--tertiary)', fontSize: '0.7rem', fontWeight: 800 }}>SALES_REP</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Assigned Lead Execution & Tasks</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '0.85rem', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Lock size={22} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)' }}>Security & Authentication</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Password updates, active sessions, and multi-factor authentication.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)' }}>Two-Factor Authentication (2FA)</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Secure workspace access via authenticator app</p>
                    </div>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(78, 222, 163, 0.15)', color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: 700 }}>
                      Enabled
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.75rem' }}>Change Password</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
                      <input type="password" placeholder="Current Password" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none' }} />
                      <input type="password" placeholder="New Password" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none' }} />
                      <button onClick={() => alert('Password updated successfully')} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SANDBOX CONTROLS (Preserved 1:1 API & Functionality) */}
            {activeTab === 'sandbox' && (
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '0.85rem', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Database size={22} style={{ color: 'var(--tertiary)' }} />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)' }}>Demo Sandbox Controls</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Re-populate database with clean sample agency records.</p>
                  </div>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Reset and re-populate the SQLite database with default sample leads, pipeline deals, tasks, activities, proposals, and team deliverables.
                </p>

                {seedSuccess && (
                  <div style={{ padding: '0.85rem 1rem', borderRadius: '0.5rem', background: 'rgba(78, 222, 163, 0.15)', border: '1px solid rgba(78, 222, 163, 0.3)', color: 'var(--secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <CheckCircle2 size={18} /> {seedSuccess}
                  </div>
                )}

                <button
                  onClick={handleReSeed}
                  disabled={seeding}
                  className="btn btn-secondary"
                  style={{ border: '1px solid rgba(255, 185, 95, 0.4)', color: 'var(--tertiary)', background: 'rgba(202, 129, 0, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <RefreshCw size={16} className={seeding ? 'spin' : ''} /> {seeding ? 'Re-Seeding Database...' : 'Reset & Re-Seed Database'}
                </button>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '0.85rem', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Bell size={22} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)' }}>Notification Preferences</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Configure activity digests and email alerts.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Email Activity Digest', desc: 'Daily summary of lead conversions and team performance', state: notifyEmail, toggle: () => setNotifyEmail(!notifyEmail) },
                    { label: 'Pipeline Deal Alerts', desc: 'Real-time notification when a deal moves to won stage', state: notifyDeals, toggle: () => setNotifyDeals(!notifyDeals) },
                    { label: 'Task Overdue Warnings', desc: 'Reminders for high priority tasks past deadline', state: notifyTasks, toggle: () => setNotifyTasks(!notifyTasks) },
                    { label: 'Proposal Sign Notifications', desc: 'Instant alert when a proposal is viewed or accepted', state: notifyProposals, toggle: () => setNotifyProposals(!notifyProposals) },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>{item.label}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{item.desc}</p>
                      </div>
                      <button
                        onClick={item.toggle}
                        style={{
                          padding: '0.3rem 0.85rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: item.state ? 'rgba(78, 222, 163, 0.2)' : 'rgba(255,255,255,0.05)',
                          color: item.state ? 'var(--secondary)' : 'var(--on-surface-variant)',
                          border: item.state ? '1px solid rgba(78, 222, 163, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                        }}
                      >
                        {item.state ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </AppShell>
  );
}
