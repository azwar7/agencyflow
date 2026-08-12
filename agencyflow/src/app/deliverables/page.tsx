'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Send,
  MessageSquare,
  Download,
  Search,
  Plus,
  X,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Calendar,
  User,
  History,
  CornerDownRight,
  Sparkles,
  Inbox,
  RefreshCw,
} from 'lucide-react';

interface DeliverableItem {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'zip' | 'figma' | 'video';
  projectName: string;
  version: string;
  status: 'PENDING CLIENT REVIEW' | 'APPROVED' | 'REVISION REQUESTED';
  statusType: 'pending' | 'approved' | 'revisions';
  accentColor: string;
  sentDate: string;
  dueDate: string;
  isOverdue?: boolean;
  hoursAgo?: number;
  clientContact?: string;
  clientAvatar?: string;
  approvedBy?: string;
  approvedDate?: string;
  approvedAvatar?: string;
  commenterName?: string;
  commenterAvatar?: string;
  commentTime?: string;
  commentText?: string;
  commentsCount: number;
  threadCount?: number;
  isNew?: boolean;
}

export default function DeliverablesPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revisions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'client' | 'status'>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);
  const [mobileMenuOpenId, setMobileMenuOpenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial loading simulation for skeleton demo
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut (⌘K / Ctrl+K) handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Rich Deliverables Dataset
  const deliverables: DeliverableItem[] = [
    {
      id: 'del-1',
      fileName: 'v2.4_Database_Schema_Architecture.pdf',
      fileType: 'pdf',
      projectName: 'TechFlow Cloud Portal',
      version: 'v2.4',
      status: 'PENDING CLIENT REVIEW',
      statusType: 'pending',
      accentColor: '#ffb95f',
      sentDate: 'Aug 12, 2:00 PM',
      dueDate: 'Due in 2 days',
      hoursAgo: 4,
      clientContact: 'Marcus Vance',
      clientAvatar: 'MV',
      commentsCount: 0,
      isNew: true,
    },
    {
      id: 'del-2',
      fileName: 'Brand_Identity_Guidelines_Final.zip',
      fileType: 'zip',
      projectName: 'Acme Brand Identity',
      version: 'v1.0',
      status: 'APPROVED',
      statusType: 'approved',
      accentColor: '#4edea3',
      sentDate: 'Aug 10, 11:00 AM',
      dueDate: 'Completed Aug 12',
      approvedBy: 'Alex Rivera',
      approvedDate: 'Aug 12',
      approvedAvatar: 'AR',
      commentsCount: 2,
    },
    {
      id: 'del-3',
      fileName: 'UI_Kit_Component_Library_Draft.fig',
      fileType: 'figma',
      projectName: 'Nexus Cloud Infrastructure',
      version: 'v0.8',
      status: 'REVISION REQUESTED',
      statusType: 'revisions',
      accentColor: '#ffb4ab',
      sentDate: 'Aug 11, 9:30 AM',
      dueDate: 'Overdue by 1 day',
      isOverdue: true,
      commenterName: 'Sarah Jenkins',
      commenterAvatar: 'SJ',
      commentTime: 'Yesterday, 2:45 PM',
      commentText:
        '"Please update section 3.2 to include OAuth2 details. The current flow doesn\'t match our latest security requirements. Everything else looks solid."',
      commentsCount: 3,
      threadCount: 3,
    },
    {
      id: 'del-4',
      fileName: 'Q3_Marketing_Campaign_Video_Cut.mp4',
      fileType: 'video',
      projectName: 'Apex Global Marketing',
      version: 'v1.2',
      status: 'PENDING CLIENT REVIEW',
      statusType: 'pending',
      accentColor: '#ffb95f',
      sentDate: 'Aug 11, 4:15 PM',
      dueDate: 'Due Tomorrow',
      hoursAgo: 30,
      clientContact: 'David Kim',
      clientAvatar: 'DK',
      commentsCount: 0,
    },
    {
      id: 'del-5',
      fileName: 'Enterprise_SaaS_SLA_Agreement.pdf',
      fileType: 'pdf',
      projectName: 'CloudScale Enterprise',
      version: 'v2.0',
      status: 'APPROVED',
      statusType: 'approved',
      accentColor: '#4edea3',
      sentDate: 'Aug 09, 3:00 PM',
      dueDate: 'Completed Aug 11',
      approvedBy: 'Elena Rostova',
      approvedDate: 'Aug 11',
      approvedAvatar: 'ER',
      commentsCount: 1,
    },
    {
      id: 'del-6',
      fileName: 'Product_Strategy_Deck_2026.pdf',
      fileType: 'pdf',
      projectName: 'Horizon Media',
      version: 'v1.5',
      status: 'PENDING CLIENT REVIEW',
      statusType: 'pending',
      accentColor: '#ffb95f',
      sentDate: 'Aug 08, 10:00 AM',
      dueDate: 'Overdue by 2 days',
      isOverdue: true,
      hoursAgo: 84,
      clientContact: 'Samantha Reed',
      clientAvatar: 'SR',
      commentsCount: 0,
    },
    {
      id: 'del-7',
      fileName: 'Mobile_App_Wireframes_v3.fig',
      fileType: 'figma',
      projectName: 'Nova Mobile Systems',
      version: 'v3.0',
      status: 'APPROVED',
      statusType: 'approved',
      accentColor: '#4edea3',
      sentDate: 'Aug 07, 1:45 PM',
      dueDate: 'Completed Aug 10',
      approvedBy: 'Jason Wu',
      approvedDate: 'Aug 10',
      approvedAvatar: 'JW',
      commentsCount: 4,
    },
    {
      id: 'del-8',
      fileName: 'API_Integration_Documentation.zip',
      fileType: 'zip',
      projectName: 'TechFlow Cloud Portal',
      version: 'v1.1',
      status: 'REVISION REQUESTED',
      statusType: 'revisions',
      accentColor: '#ffb4ab',
      sentDate: 'Aug 09, 2:30 PM',
      dueDate: 'Due Today',
      commenterName: 'Michael Chang',
      commenterAvatar: 'MC',
      commentTime: 'Aug 10, 5:12 PM',
      commentText:
        '"Endpoint rate limit specs are missing for webhooks. Please revise section 4 before final sign-off."',
      commentsCount: 5,
      threadCount: 5,
    },
    {
      id: 'del-9',
      fileName: 'Hero_Animation_Assets.zip',
      fileType: 'zip',
      projectName: 'Acme Brand Identity',
      version: 'v2.1',
      status: 'APPROVED',
      statusType: 'approved',
      accentColor: '#4edea3',
      sentDate: 'Aug 06, 11:20 AM',
      dueDate: 'Completed Aug 09',
      approvedBy: 'Alex Rivera',
      approvedDate: 'Aug 09',
      approvedAvatar: 'AR',
      commentsCount: 0,
    },
    {
      id: 'del-10',
      fileName: 'Financial_Audit_Report_2026.pdf',
      fileType: 'pdf',
      projectName: 'Zenith Capital',
      version: 'v1.0',
      status: 'APPROVED',
      statusType: 'approved',
      accentColor: '#4edea3',
      sentDate: 'Aug 05, 4:00 PM',
      dueDate: 'Completed Aug 08',
      approvedBy: 'Patricia Moore',
      approvedDate: 'Aug 08',
      approvedAvatar: 'PM',
      commentsCount: 1,
    },
    {
      id: 'del-11',
      fileName: 'Promo_Explainer_Video_Final.mp4',
      fileType: 'video',
      projectName: 'Horizon Media',
      version: 'v2.0',
      status: 'APPROVED',
      statusType: 'approved',
      accentColor: '#4edea3',
      sentDate: 'Aug 04, 10:15 AM',
      dueDate: 'Completed Aug 07',
      approvedBy: 'Samantha Reed',
      approvedDate: 'Aug 07',
      approvedAvatar: 'SR',
      commentsCount: 2,
    },
    {
      id: 'del-12',
      fileName: 'Customer_Onboarding_Flow_Mockups.fig',
      fileType: 'figma',
      projectName: 'CloudScale Enterprise',
      version: 'v1.0',
      status: 'PENDING CLIENT REVIEW',
      statusType: 'pending',
      accentColor: '#ffb95f',
      sentDate: 'Aug 12, 8:00 AM',
      dueDate: 'Due in 3 days',
      hoursAgo: 18,
      clientContact: 'Elena Rostova',
      clientAvatar: 'ER',
      commentsCount: 0,
      isNew: true,
    },
  ];

  // Dynamic counts for Filter Tabs
  const counts = {
    all: deliverables.length,
    pending: deliverables.filter((d) => d.statusType === 'pending').length,
    approved: deliverables.filter((d) => d.statusType === 'approved').length,
    revisions: deliverables.filter((d) => d.statusType === 'revisions').length,
  };

  // Filter & Sort Logic
  const filteredDeliverables = deliverables
    .filter((item) => {
      if (filter !== 'all' && item.statusType !== filter) return false;
      if (
        searchQuery &&
        !item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.projectName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id.localeCompare(a.id);
      if (sortBy === 'oldest') return a.id.localeCompare(b.id);
      if (sortBy === 'client') return a.projectName.localeCompare(b.projectName);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  // Urgency styling calculation helper
  const getUrgencyDetails = (hoursAgo?: number) => {
    if (!hoursAgo) return { text: '', color: 'var(--on-surface-variant)', icon: 'schedule' };
    if (hoursAgo < 24) {
      return {
        text: `Waiting for client feedback (${hoursAgo}h ago)`,
        color: 'var(--on-surface-variant)',
        icon: 'schedule',
      };
    }
    if (hoursAgo <= 72) {
      return {
        text: `Waiting for client feedback (${Math.round(hoursAgo / 24)}d ago)`,
        color: '#ffb95f',
        icon: 'pending',
      };
    }
    return {
      text: `Stale: Waiting for client feedback (${Math.round(hoursAgo / 24)} days ago)`,
      color: '#ffb4ab',
      icon: 'error_outline',
    };
  };

  // File Type Visual System Mapping
  const getFileTypeBadge = (type: DeliverableItem['fileType']) => {
    switch (type) {
      case 'pdf':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          icon: 'picture_as_pdf',
          label: 'PDF',
        };
      case 'zip':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.3)',
          color: '#60a5fa',
          icon: 'folder_zip',
          label: 'ZIP Archive',
        };
      case 'figma':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          border: 'rgba(168, 85, 247, 0.3)',
          color: '#c084fc',
          icon: 'design_services',
          label: 'Figma Design',
        };
      case 'video':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          icon: 'movie',
          label: 'Video Cut',
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          border: 'rgba(148, 163, 184, 0.3)',
          color: '#cbd5e1',
          icon: 'insert_drive_file',
          label: 'File',
        };
    }
  };

  return (
    <AppShell>
      <div className="page-content">
        {/* Header Title & Main CTA Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontWeight: 700,
                marginBottom: '0.1rem',
              }}
            >
              WORKFLOW / CLIENT TOUCHPOINTS
            </p>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--on-surface)', lineHeight: 1.15 }}>
              Deliverables & Approvals
            </h1>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.825rem',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(192, 193, 255, 0.18)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
              upload_file
            </span>
            Upload Deliverable
          </button>
        </div>

        {/* Unified Control Row: Filter Tabs (Left) + Search & Tools (Right) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.65rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Filter Pills Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              alignItems: 'center',
            }}
          >
            {[
              { id: 'all', label: 'All Deliverables', count: counts.all },
              { id: 'pending', label: 'Pending Review', count: counts.pending },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'revisions', label: 'Revisions Requested', count: counts.revisions },
            ].map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: isActive ? 'rgba(192, 193, 255, 0.18)' : 'rgba(23, 27, 38, 0.5)',
                    color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                    border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isActive ? '0 0 10px rgba(192, 193, 255, 0.15)' : 'none',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '0.05rem 0.35rem',
                      borderRadius: '9999px',
                      background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search, Sort, View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Search Input (Compact 220px) */}
            <div style={{ position: 'relative', width: '220px' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--on-surface-variant)',
                  fontSize: '16px',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(23, 27, 38, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(192, 193, 255, 0.2)',
                  borderRadius: 'var(--radius-DEFAULT)',
                  padding: '0.4rem 3.2rem 0.4rem 2.1rem',
                  fontSize: '0.8rem',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(192, 193, 255, 0.2)')}
              />
              <kbd
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '3px',
                  padding: '0.1rem 0.35rem',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: 'var(--on-surface-variant)',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ArrowUpDown size={14} style={{ color: 'var(--on-surface-variant)' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort deliverables"
                style={{
                  background: 'rgba(23, 27, 38, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-DEFAULT)',
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.8rem',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="client">Sort: Project</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(23, 27, 38, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-DEFAULT)',
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                aria-label="List View"
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '4px',
                  background: viewMode === 'list' ? 'rgba(192, 193, 255, 0.2)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary)' : 'var(--on-surface-variant)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ListIcon size={14} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                aria-label="Grid View"
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '4px',
                  background: viewMode === 'grid' ? 'rgba(192, 193, 255, 0.2)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--on-surface-variant)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Thin Sleek Summary Stats Bar */}
        <div
          style={{
            background: 'rgba(23, 27, 38, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0.6rem',
            padding: '0.35rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.775rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--on-surface-variant)' }}>
            <Clock size={13} style={{ color: '#4edea3' }} />
            <span>Avg. Approval:</span>
            <strong style={{ color: 'var(--on-surface)' }}>1.2 days</strong>
          </div>

          <div style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ffb95f' }}>
              schedule
            </span>
            <span>Awaiting Review:</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '0.05rem 0.35rem',
                borderRadius: '9999px',
                background: 'rgba(255, 185, 95, 0.15)',
                color: '#ffb95f',
                border: '1px solid rgba(255, 185, 95, 0.3)',
              }}
            >
              4 items
            </span>
          </div>

          <div style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ffb4ab' }}>
              error_outline
            </span>
            <span>Overdue SLA:</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '0.05rem 0.35rem',
                borderRadius: '9999px',
                background: 'rgba(255, 180, 171, 0.15)',
                color: '#ffb4ab',
                border: '1px solid rgba(255, 180, 171, 0.3)',
              }}
            >
              2 items
            </span>
          </div>

          <div style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--on-surface-variant)' }}>
            <Calendar size={13} style={{ color: 'var(--primary)' }} />
            <span>Next Milestone:</span>
            <strong style={{ color: 'var(--on-surface)' }}>Aug 15 (TechFlow v2.4)</strong>
          </div>
        </div>

        {/* Skeleton Loading State */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="glass-card"
                style={{
                  height: '140px',
                  background: 'rgba(23, 27, 38, 0.4)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        ) : filteredDeliverables.length === 0 ? (
          /* Empty State */
          <div
            className="glass-card"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(23, 27, 38, 0.5)',
              borderRadius: '1rem',
              border: '1px dashed rgba(192, 193, 255, 0.2)',
              marginTop: '1rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(192, 193, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '1rem',
              }}
            >
              <Inbox size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.4rem' }}>
              No deliverables found
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', maxWidth: '420px', marginBottom: '1.5rem' }}>
              No deliverables match your active filter or search query. Try clearing filters or uploading a new file.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={15} /> Reset Filters
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Upload Deliverable
              </button>
            </div>
          </div>
        ) : (
          /* Deliverables Cards Stack (Supports List & Grid View) */
          <div
            style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(360px, 1fr))' : undefined,
              flexDirection: viewMode === 'list' ? 'column' : undefined,
              gap: '1.25rem',
            }}
          >
            {filteredDeliverables.map((item) => {
              const fileTypeBadge = getFileTypeBadge(item.fileType);
              const urgency = getUrgencyDetails(item.hoursAgo);

              // Background tint calculated per status type
              const cardBg =
                item.statusType === 'pending'
                  ? 'rgba(245, 158, 11, 0.03)'
                  : item.statusType === 'approved'
                  ? 'rgba(78, 222, 163, 0.03)'
                  : 'rgba(255, 180, 171, 0.04)';

              return (
                <div
                  key={item.id}
                  className="glass-card deliverable-card"
                  style={{
                    display: 'flex',
                    flexDirection: viewMode === 'list' ? 'row' : 'column',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    background: cardBg,
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = item.accentColor;
                    e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.25), 0 0 10px ${item.accentColor}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Left Accent Colored Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: item.accentColor,
                      boxShadow: `0 0 15px ${item.accentColor}`,
                    }}
                  />

                  {/* New Upload Pulse Indicator */}
                  {item.isNew && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: 'rgba(192, 193, 255, 0.2)',
                        border: '1px solid var(--primary)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                      }}
                    >
                      <Sparkles size={11} /> NEW
                    </div>
                  )}

                  {/* Main Content Area */}
                  <div style={{ flex: 1, minWidth: viewMode === 'list' ? '300px' : 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        {/* Type Colored Icon Badge */}
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '0.65rem',
                            background: fileTypeBadge.bg,
                            border: `1px solid ${fileTypeBadge.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ color: fileTypeBadge.color, fontSize: '24px' }}>
                            {fileTypeBadge.icon}
                          </span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.3 }}>
                              {item.fileName}
                            </h3>
                          </div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--on-surface-variant)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '0.3rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>
                                folder_open
                              </span>
                              {item.projectName}
                            </span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--outline-variant)' }} />
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                fontFamily: 'monospace',
                                color: 'var(--on-surface)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              {item.version}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Status Badge Pill with Tooltip */}
                      <div style={{ position: 'relative' }}>
                        <div
                          onMouseEnter={() => setHoveredBadgeId(item.id)}
                          onMouseLeave={() => setHoveredBadgeId(null)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '9999px',
                            background:
                              item.statusType === 'pending'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : item.statusType === 'approved'
                                ? 'rgba(78, 222, 163, 0.15)'
                                : 'rgba(255, 180, 171, 0.15)',
                            border: `1px solid ${item.accentColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            flexShrink: 0,
                            cursor: 'help',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ color: item.accentColor, fontSize: '14px' }}>
                            {item.statusType === 'pending'
                              ? 'schedule'
                              : item.statusType === 'approved'
                              ? 'check_circle'
                              : 'flag'}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.accentColor, letterSpacing: '0.05em' }}>
                            {item.status}
                          </span>
                        </div>

                        {/* Tooltip on Badge Hover */}
                        {hoveredBadgeId === item.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '6px',
                              padding: '0.5rem 0.75rem',
                              background: '#141721',
                              border: '1px solid rgba(192, 193, 255, 0.3)',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                              zIndex: 30,
                              whiteSpace: 'nowrap',
                              fontSize: '11px',
                              color: 'var(--on-surface)',
                            }}
                          >
                            <p style={{ margin: 0, fontWeight: 600 }}>Sent: {item.sentDate}</p>
                            <p style={{ margin: '2px 0 0 0', color: 'var(--on-surface-variant)' }}>SLA: {item.dueDate}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub Info Footer / SLA Row */}
                    <div style={{ marginTop: '0.5rem' }}>
                      {/* SLA Due Date / Urgency Badge Row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.6rem',
                          flexWrap: 'wrap',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: item.isOverdue ? '#ffb4ab' : 'var(--on-surface-variant)',
                            fontWeight: item.isOverdue ? 600 : 400,
                          }}
                        >
                          <Calendar size={14} style={{ color: item.isOverdue ? '#ffb4ab' : 'var(--primary)' }} />
                          {item.dueDate}
                        </span>

                        {item.statusType === 'pending' && urgency.text && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: urgency.color, fontWeight: 500 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              {urgency.icon}
                            </span>
                            {urgency.text}
                          </span>
                        )}
                      </div>

                      {/* Pending Client Review Footer */}
                      {item.statusType === 'pending' && (
                        <div
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(28, 31, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(255, 185, 95, 0.2)',
                              border: '1px solid #ffb95f',
                              color: '#ffb95f',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {item.clientAvatar || 'CL'}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                            Waiting on client review from <strong style={{ color: 'var(--on-surface)' }}>{item.clientContact}</strong>
                          </p>
                        </div>
                      )}

                      {/* Approved Footer */}
                      {item.statusType === 'approved' && (
                        <div
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(78, 222, 163, 0.08)',
                            border: '1px solid rgba(78, 222, 163, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#4edea3',
                              color: '#003822',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {item.approvedAvatar || 'AR'}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: '#4edea3', margin: 0 }}>
                            Approved by <strong>{item.approvedBy}</strong> on {item.approvedDate}
                          </p>
                        </div>
                      )}

                      {/* Revision Requested Footer */}
                      {item.statusType === 'revisions' && (
                        <div
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '0.5rem',
                            background: 'rgba(255, 180, 171, 0.08)',
                            border: '1px solid rgba(255, 180, 171, 0.2)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#ffb4ab',
                              color: '#600004',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {item.commenterAvatar || 'REV'}
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffb4ab', marginBottom: '0.2rem', margin: 0 }}>
                              {item.commenterName}{' '}
                              <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400, marginLeft: '0.4rem', fontSize: '11px' }}>
                                {item.commentTime}
                              </span>
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface)', marginTop: '0.25rem', margin: 0 }}>
                              {item.commentText}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Column — Hierarchical Button Grouping & Mobile Overflow */}
                  <div
                    style={{
                      width: viewMode === 'list' ? '240px' : '100%',
                      display: 'flex',
                      flexDirection: viewMode === 'list' ? 'column' : 'row',
                      gap: '0.5rem',
                      justifyContent: 'center',
                      paddingLeft: viewMode === 'list' ? '1.25rem' : '0',
                      borderLeft: viewMode === 'list' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                      borderTop: viewMode === 'grid' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                      paddingTop: viewMode === 'grid' ? '1rem' : '0',
                    }}
                  >
                    {/* Primary Button */}
                    {item.statusType === 'pending' && (
                      <button
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          upload
                        </span>
                        New Version
                      </button>
                    )}

                    {item.statusType === 'approved' && (
                      <button
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          download
                        </span>
                        Download Final
                      </button>
                    )}

                    {item.statusType === 'revisions' && (
                      <button
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          upload
                        </span>
                        Upload v0.9
                      </button>
                    )}

                    {/* Secondary Ghost Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
                      {item.statusType === 'pending' && (
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            send
                          </span>
                          Resend
                        </button>
                      )}

                      {item.statusType === 'approved' && (
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            history
                          </span>
                          History
                        </button>
                      )}

                      {item.statusType === 'revisions' && (
                        <button
                          className="btn btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            forum
                          </span>
                          Thread ({item.threadCount || 3})
                        </button>
                      )}

                      {/* Comments Button (Icon-only when 0, Labeled when > 0) */}
                      {item.commentsCount === 0 ? (
                        <button
                          className="btn btn-secondary"
                          title="No comments"
                          style={{
                            padding: '0.45rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.6,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            chat_bubble_outline
                          </span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            forum
                          </span>
                          ({item.commentsCount})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Deliverable Modal */}
      {uploadModalOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setUploadModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '90%',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              background: 'var(--surface-container-low)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>Upload New Deliverable</h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                aria-label="Close modal"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.4rem' }}>
                Select Project
              </label>
              <select
                aria-label="Select Project"
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  outline: 'none',
                }}
              >
                <option>TechFlow Cloud Portal</option>
                <option>Acme Brand Identity</option>
                <option>Nexus Cloud Infrastructure</option>
                <option>Apex Global Marketing</option>
              </select>
            </div>

            <div
              style={{
                border: '2px dashed rgba(192, 193, 255, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(192, 193, 255, 0.05)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>
                cloud_upload
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', marginTop: '0.5rem' }}>
                Click or drag file to upload
              </p>
              <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
                PDF, ZIP, FIG, or MP4 up to 50MB
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setUploadModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  alert('Deliverable uploaded & sent for client review!');
                }}
                className="btn btn-primary"
              >
                Upload & Request Review
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
