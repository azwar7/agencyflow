'use client';

/**
 * AGENCYFLOW GLOBAL HEADER ARCHITECTURAL RULE:
 * The global header is shared application infrastructure.
 * Future feature audits, UI redesigns, and functionality fixes MUST NOT
 * remove, hide, reposition, or replace existing global header controls unless explicitly requested.
 * 
 * Required Desktop Controls (Layout Order):
 * - LEFT / CENTER: Global Search Bar [ Search anything... (Cmd+K) ]
 * - RIGHT: Help / Questions (?) [ Material Symbol: help ]
 *          Notifications (bell) with Badge [ Material Symbol: notifications ]
 *          Account / Profile Avatar [ Material Symbol: person ]
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Keyboard,
  Shield,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onOpenNewLead?: () => void;
  onOpenNewDeal?: () => void;
  activeRole?: string;
  onRoleChange?: (role: string) => void;
}

export function Header({ onOpenNewLead, onOpenNewDeal, activeRole, onRoleChange }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Popovers State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  // Keyboard shortcut Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search Index
  const searchResults = [
    { title: 'Elevate DTC Brand Campaign Engine', type: 'DEAL', path: '/pipeline', client: 'Elevate Creative Co.' },
    { title: 'Summit Logistics Operations Tracking', type: 'DEAL', path: '/pipeline', client: 'Summit Logistics' },
    { title: 'Vanguard FinTech Mobile MVP', type: 'PROJECT', path: '/projects', client: 'Vanguard FinTech' },
    { title: 'Schedule Q3 Technical Architecture Audit', type: 'TASK', path: '/tasks', client: 'TechFlow Systems' },
    { title: 'David Miller (Lead Solutions Architect)', type: 'TEAM', path: '/team', client: 'Apex Digital' },
    { title: 'TechFlow_Master_Services_Agreement_2026.pdf', type: 'PROPOSAL', path: '/proposals', client: 'TechFlow Systems' },
  ].filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notifications = [
    { id: 1, title: 'Proposal Signed!', desc: 'Rachel Green signed Elevate Creative SOW.', time: '10 mins ago' },
    { id: 2, title: 'New Inbound Lead', desc: 'Marcus Vance submitted contact form.', time: '1 hour ago' },
    { id: 3, title: 'High Priority Task Due', desc: 'Prepare architecture deck for TechFlow.', time: '3 hours ago' },
  ];

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsAccountOpen(false);
    logout();
  };

  return (
    <>
      <header className="app-header">
        {/* Left / Center: Global Search Bar */}
        <div style={{ flex: 1, maxWidth: '440px', minWidth: '200px' }}>
          <div
            onClick={() => setIsSearchOpen(true)}
            style={{
              position: 'relative',
              width: '100%',
              cursor: 'pointer',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--outline)',
                fontSize: '20px',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              type="text"
              readOnly
              placeholder="Search anything... (Cmd+K)"
              style={{
                width: '100%',
                background: 'var(--surface-container-high)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '9999px',
                padding: '0.55rem 1rem 0.55rem 2.5rem',
                fontSize: '0.85rem',
                color: 'var(--on-surface)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>

        {/* Right: Actions Group (Help, Notifications, Account) - ALWAYS VISIBLE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexShrink: 0,
            visibility: 'visible',
            opacity: 1,
          }}
        >
          {/* 1. Help / Questions (?) Control */}
          <button
            onClick={() => setIsHelpOpen(true)}
            style={{
              color: 'var(--on-surface-variant)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem',
              borderRadius: '50%',
              transition: 'color 0.2s',
            }}
            title="Help & Questions"
            aria-label="Help and Questions"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              help
            </span>
          </button>

          {/* 2. Notifications (bell) Control & Popover */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              style={{
                color: 'var(--on-surface-variant)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.35rem',
                borderRadius: '50%',
                position: 'relative',
                transition: 'color 0.2s',
              }}
              title="Notifications"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                notifications
              </span>
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--error)',
                    borderRadius: '50%',
                    border: '2px solid var(--bg-background)',
                  }}
                />
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {isNotificationsOpen && (
              <div
                className="glass-card"
                style={{
                  position: 'absolute',
                  top: '135%',
                  right: 0,
                  width: '340px',
                  background: '#1c1f2a',
                  borderRadius: '0.85rem',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                    Notifications
                  </h4>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={() => setUnreadNotifications(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '0.5rem',
                        background: 'var(--surface-container-high)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface)' }}>{n.title}</span>
                        <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>{n.time}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Account / Profile Avatar Control */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div
              onClick={() => setIsAccountOpen((prev) => !prev)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(192, 193, 255, 0.4)',
              }}
              title="Account Profile"
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--on-primary)', fontSize: '18px' }}>
                person
              </span>
            </div>

            {/* Account Popover Menu */}
            {isAccountOpen && (
              <div
                className="glass-card"
                style={{
                  position: 'absolute',
                  top: '135%',
                  right: 0,
                  width: '240px',
                  background: '#1c1f2a',
                  borderRadius: '0.85rem',
                  padding: '0.85rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>{user?.name || 'Alex Sterling'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>{user?.email || 'alex@agencyflow.io'}</p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '0.3rem',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '9999px',
                      background: 'rgba(192, 193, 255, 0.15)',
                      color: 'var(--primary)',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                    }}
                  >
                    WORKSPACE {user?.role || 'OWNER'}
                  </span>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setIsAccountOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem',
                    borderRadius: '0.4rem',
                    color: 'var(--on-surface)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                  }}
                >
                  <Settings size={16} /> Account Settings
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem',
                    borderRadius: '0.4rem',
                    color: 'var(--error)',
                    fontSize: '0.85rem',
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={16} /> Log Out Session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cmd+K Global Search Overlay Modal */}
      {isSearchOpen && (
        <div
          onClick={() => setIsSearchOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '6rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#1c1f2a',
              borderRadius: '1rem',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            }}
          >
            {/* Search Input Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={20} color="var(--primary)" />
              <input
                type="text"
                autoFocus
                placeholder="Search leads, deals, tasks, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '1rem', outline: 'none' }}
              />
              <button onClick={() => setIsSearchOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Search Results List */}
            <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.5rem' }}>
              {searchResults.length > 0 ? (
                searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push(res.path);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-container-high)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>{res.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>{res.client}</p>
                    </div>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(192, 193, 255, 0.15)', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 700 }}>
                      {res.type}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
                  No matching records found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div
          onClick={() => setIsHelpOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ width: '100%', maxWidth: '480px', background: '#1c1f2a', borderRadius: '1rem', padding: '1.75rem', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)' }}>AgencyFlow Help & Documentation</h3>
              </div>
              <button onClick={() => setIsHelpOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Keyboard size={16} color="var(--secondary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)' }}>Keyboard Shortcuts</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                  Press <kbd style={{ background: 'var(--surface-container-highest)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>Cmd + K</kbd> to launch global search anywhere.
                </p>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <Shield size={16} color="var(--tertiary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)' }}>System Status</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, margin: 0 }}>
                  ✓ All API Services & Database Operational (Next.js 16.3)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setIsHelpOpen(false)} className="btn btn-primary">
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
