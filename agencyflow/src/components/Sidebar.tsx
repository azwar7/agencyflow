'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AgencyFlowLogo from '@/components/AgencyFlowLogo';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const displayName = user?.name || user?.email?.split('@')[0] || 'My Account';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';
  const isFreelancer = user?.persona === 'FREELANCER';
  const roleLabel = isFreelancer
    ? 'Solo Freelancer'
    : user?.role === 'OWNER'
    ? 'Agency Owner'
    : user?.role
    ? user.role.replace('_', ' ')
    : 'Workspace Owner';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Leads', path: '/leads', icon: 'filter_list' },
    { label: 'Clients', path: '/clients', icon: 'group' },
    { label: 'Proposals', path: '/proposals', icon: 'description' },
    { label: 'Projects', path: '/projects', icon: 'account_tree' },
    { label: 'Tasks', path: '/tasks', icon: 'assignment_turned_in' },
    { label: 'Deliverables', path: '/deliverables', icon: 'inventory_2' },
    { label: 'Invoices', path: '/invoices', icon: 'receipt_long' },
    { label: 'Analytics', path: '/analytics', icon: 'leaderboard' },
    { label: 'AI Assistant', path: '/ai-copilot', icon: 'smart_toy' },
  ];

  const managementItems = [
    { label: isFreelancer ? 'Collaborators' : 'Team', path: '/team', icon: 'groups_3' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.25rem',
          flexShrink: 0,
          borderBottom: '1px solid rgba(70, 69, 84, 0.15)',
        }}
      >
        <AgencyFlowLogo height={28} href="/dashboard" />
      </div>

      {/* Main Navigation Container */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">
                {item.icon}
              </span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}

        {/* Management Section Header */}
        <div style={{ padding: '0.75rem 0.85rem 0.25rem 0.85rem' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--outline)', fontWeight: 700 }}>
            Management
          </span>
        </div>

        {managementItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">
                {item.icon}
              </span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid rgba(70, 69, 84, 0.2)', flexShrink: 0 }}>
        <div
          onClick={() => router.push('/settings')}
          title="Account Settings"
          className="sidebar-profile-card"
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div className="sidebar-label" style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {displayName}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0 0 0' }}>
              {roleLabel}
            </p>
          </div>
          <span className="material-symbols-outlined sidebar-label" style={{ color: 'var(--outline)', fontSize: '18px' }}>
            unfold_more
          </span>
        </div>
      </div>
    </aside>
  );
}
