'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Check,
  Lock,
  Download,
  ArrowRight,
  Eye,
  CreditCard,
  CheckCircle2,
  FileText,
  FolderArchive,
  FileCode,
  CheckSquare,
  MessageSquare,
  HardDrive,
  X,
  Send,
  Flag,
  Sparkles,
  ShieldCheck,
  Receipt,
  ArrowLeft,
  ChevronDown,
  Building2,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import './portal.css';

interface PrimaryContact {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  initials: string;
}

interface ClientData {
  id: string;
  name: string;
  domain: string;
  industry: string;
  primaryContact: PrimaryContact;
}

interface ProjectData {
  title: string;
  day: number;
  totalDays: number;
  elapsedPercent: number;
  targetDate: string;
  sprintTitle: string;
}

interface MilestoneItem {
  tag: string;
  title: string;
  status: 'COMPLETED' | 'ACTIVE' | 'LOCKED';
  date: string;
  metric: string;
}

interface ResourceItem {
  id: string;
  name: string;
  category: 'specs' | 'assets' | 'contracts';
  size: string;
  updated: string;
  type: 'pdf' | 'zip' | 'doc';
  description?: string;
}

interface InvoiceItem {
  id: string;
  number: string;
  description: string;
  amount: number;
  status: 'OUTSTANDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
}

interface ActivityItem {
  id: string;
  avatar: string;
  avatarClass: string;
  userName: string;
  actionPhrase: string;
  objectTitle: string;
  supportingText: string;
  time: string;
}

interface WorkspaceClientSummary {
  id: string;
  name: string;
  contactName: string;
  type?: 'COMPANY' | 'LEAD';
}

interface PortalPayload {
  client: ClientData;
  project: ProjectData | null;
  milestones: MilestoneItem[];
  actionRequired: {
    id: string;
    title: string;
    specTitle: string;
    submittedMeta: string;
    document: {
      id: string;
      name: string;
      size: string;
      updated: string;
      type: string;
      description: string;
    };
  } | null;
  summaryStats: {
    activeOpen: number;
    activeSub: string;
    unreadCount: number;
    unreadSub: string;
    vaultFilesCount: number;
    vaultSub: string;
    dueAmount: number;
    dueFormatted: string;
    dueDateText: string;
  };
  resources: ResourceItem[];
  allVaultFiles: ResourceItem[];
  invoices: InvoiceItem[];
  activities: ActivityItem[];
  allWorkspaceClients: WorkspaceClientSummary[];
}

function ClientPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId') || searchParams.get('leadId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<PortalPayload | null>(null);

  // Interactive UI States
  const [signedOff, setSignedOff] = useState(false);
  const [showRevisionModal, setRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paidInvoices, setPaidInvoices] = useState<{ [id: string]: boolean }>({});
  const [activeResourceTab, setActiveResourceTab] = useState<'all' | 'specs' | 'assets' | 'contracts'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDocModal, setPreviewDocModal] = useState<ResourceItem | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Fetch dynamic portal data whenever clientId changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setSignedOff(false);

    const endpoint = clientId
      ? `/api/v1/clients/portal?clientId=${encodeURIComponent(clientId)}`
      : '/api/v1/clients/portal';

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success && json.data) {
          setPortalData(json.data);
        } else {
          setError(json.error?.message || 'Unable to load client portal.');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to connect to client portal service.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleApprove = () => {
    setSignedOff(true);
    showToast(`✓ Deliverable signed off & approved for ${portalData?.client.name}!`);
  };

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    setRevisionModal(false);
    setRevisionNote('');
    showToast(`Feedback submitted for ${portalData?.client.name}. Revision request logged.`);
  };

  const handlePayInvoice = (invoiceId: string, amount: number) => {
    setPaidInvoices((prev) => ({ ...prev, [invoiceId]: true }));
    setShowPayModal(false);
    showToast(`✓ Payment of $${amount.toLocaleString()} processed successfully via Stripe.`);
  };

  if (loading) {
    return (
      <div className="portal-standalone-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(139, 92, 246, 0.2)',
              borderTopColor: '#a855f7',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1.25rem',
            }}
          />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
            Loading Client Portal...
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)' }}>
            Retrieving real-time workspace records, milestones, and deliverables.
          </p>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="portal-standalone-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="portal-panel" style={{ maxWidth: '480px', padding: '2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
            Account Not Found
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--portal-text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'The requested client or lead portal could not be found in this workspace.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              href="/clients"
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Clients Section
            </Link>
            <Link
              href="/leads"
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Leads Section
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { client, project, milestones, actionRequired, summaryStats, resources, allVaultFiles, invoices, activities, allWorkspaceClients } = portalData;

  const filteredResources =
    activeResourceTab === 'all'
      ? resources
      : resources.filter((r) => r.category === activeResourceTab);

  const outstandingInvoice = invoices.find((i) => i.status === 'OUTSTANDING');
  const isTargetInvoicePaid = outstandingInvoice ? Boolean(paidInvoices[outstandingInvoice.id]) : false;

  return (
    <div className="portal-standalone-wrapper">
      <div className="portal-root">
        {/* Decorative ambient lighting */}
        <div className="portal-ambient-glow" />

        {/* Top Navigation / Preview Bar */}
        <div className="portal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 14px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Sparkles size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                  {client.name} — Client Workspace
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '4px',
                    background: project ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: project ? '#c4b5fd' : 'var(--portal-text-secondary)',
                    border: project ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {project ? project.sprintTitle : 'Client Account'}
                </span>

                {/* Quick Client Switcher Dropdown */}
                {allWorkspaceClients.length > 1 && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowClientDropdown(!showClientDropdown)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: 'var(--portal-text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.16s ease',
                      }}
                      title="Switch account view"
                    >
                      <Building2 size={12} /> Switch Client <ChevronDown size={12} />
                    </button>

                    {showClientDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '120%',
                          left: 0,
                          width: '260px',
                          maxHeight: '340px',
                          overflowY: 'auto',
                          background: '#161928',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
                          padding: '0.4rem',
                          zIndex: 50,
                        }}
                      >
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--portal-text-muted)', textTransform: 'uppercase', padding: '0.35rem 0.6rem', letterSpacing: '0.05em' }}>
                          Workspace Accounts ({allWorkspaceClients.length})
                        </div>
                        {allWorkspaceClients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setShowClientDropdown(false);
                              router.push(`/clients/portal?clientId=${c.id}`);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '6px',
                              background: c.id === client.id ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                              border: 'none',
                              color: c.id === client.id ? '#c4b5fd' : '#ffffff',
                              fontSize: '0.78rem',
                              fontWeight: c.id === client.id ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <div>{c.name}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--portal-text-muted)' }}>{c.contactName}</div>
                            </div>
                            {c.id === client.id && <Check size={14} color="#a78bfa" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--portal-text-muted)', margin: '0.1rem 0 0' }}>
                Active portal for <strong style={{ color: '#ffffff' }}>{client.primaryContact.fullName}</strong> ({client.primaryContact.title})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Link
              href="/clients"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.42rem 0.85rem',
                borderRadius: '7px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--portal-text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                transition: 'all 0.16s ease',
              }}
              className="hover-level-1"
            >
              <ArrowLeft size={14} /> Back to Clients
            </Link>

            <Link
              href="/leads"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.42rem 0.85rem',
                borderRadius: '7px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--portal-text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                transition: 'all 0.16s ease',
              }}
              className="hover-level-1"
            >
              <UserCheck size={14} /> Back to Leads
            </Link>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {client.primaryContact.initials}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>
                {client.primaryContact.fullName}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Content Container */}
        <div className="portal-layout-wrapper">
          {/* =========================================================
              ROW 1: TOP PROJECT OVERVIEW (Full Width)
              ========================================================= */}
          <div className="portal-panel project-overview-card portal-card-interactive">
            <div className="project-overview-content">
              <div>
                <div className="project-eyebrow">
                  <Sparkles size={13} color="#a78bfa" /> PROJECT STATUS • {client.name}
                </div>
                <h1 className="project-title">
                  Welcome{client.primaryContact.firstName ? `, ${client.primaryContact.firstName}` : ''}.
                </h1>
                <p className="project-subtitle">
                  {project
                    ? `Live status and milestone tracking for ${project.title}.`
                    : `Account onboarding & project workspace for ${client.name}.`}
                </p>
              </div>

              <div className="project-metric-box">
                {project ? (
                  <>
                    <div className="project-day-value">Day {project.day}</div>
                    <div className="project-day-label">of {project.totalDays} Day Sprint</div>

                    {/* Progress bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '9999px',
                        margin: '0.65rem 0 0.35rem',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${project.elapsedPercent}%`,
                          background: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)',
                          boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)',
                        }}
                      />
                    </div>

                    <div className="project-meta-row">
                      <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{project.elapsedPercent}% Progress</span>
                      <span style={{ opacity: 0.35 }}>•</span>
                      <span>Target: {project.targetDate}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="project-day-value" style={{ fontSize: '1.25rem' }}>Sprint Setup</div>
                    <div className="project-day-label">Discovery & Intake Phase</div>

                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '9999px',
                        margin: '0.65rem 0 0.35rem',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: '0%',
                          background: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)',
                        }}
                      />
                    </div>

                    <div className="project-meta-row">
                      <span style={{ color: 'var(--portal-text-muted)', fontWeight: 500 }}>No active sprint underway</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================
              ROW 2: MILESTONE PROGRESS STEPPER (Full Width)
              ========================================================= */}
          <div className="portal-panel milestone-panel portal-card-interactive">
            <div className="milestone-header">
              <div className="milestone-title-group">
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa',
                  }}
                >
                  <Flag size={15} />
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Milestone Progress
                </h2>
                <span className="milestone-badge">
                  {project ? project.sprintTitle : 'Milestones'}
                </span>
              </div>

              {milestones.length > 0 && (
                <button
                  className="milestone-link hover-level-1"
                  onClick={() => setShowRoadmapModal(true)}
                >
                  View Milestone Roadmap <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Stepper Timeline or Empty State */}
            {milestones.length > 0 ? (
              <div className="milestone-stepper">
                <div className="milestone-track-bg" />
                <div className="milestone-track-progress" />

                {milestones.map((m, idx) => {
                  const isCompleted = m.status === 'COMPLETED';
                  const isActive = m.status === 'ACTIVE';

                  return (
                    <div key={idx} className="milestone-step-item" style={{ opacity: m.status === 'LOCKED' ? 0.55 : 1 }}>
                      <div
                        className={`milestone-node ${
                          isCompleted
                            ? 'milestone-node-completed'
                            : isActive
                            ? 'milestone-node-active'
                            : 'milestone-node-locked'
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={20} strokeWidth={2.5} />
                        ) : isActive ? (
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#c084fc',
                              boxShadow: '0 0 8px #c084fc',
                            }}
                          />
                        ) : (
                          <Lock size={16} />
                        )}
                      </div>

                      <div className="milestone-step-tag" style={{ color: isActive ? '#c084fc' : undefined }}>
                        {m.tag}
                      </div>
                      <div className="milestone-step-name" style={{ color: isActive ? '#ffffff' : undefined }}>
                        {m.title}
                      </div>
                      <div className="milestone-step-date">{m.date}</div>
                      <div
                        className="milestone-step-metric"
                        style={
                          isCompleted
                            ? { background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.2)' }
                            : !isActive
                            ? { color: 'var(--portal-text-muted)', borderColor: 'rgba(255, 255, 255, 0.08)' }
                            : undefined
                        }
                      >
                        {m.metric}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  margin: '0.75rem 0',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#c4b5fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                  }}
                >
                  <Flag size={20} />
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                  No Active Sprints or Milestones Scheduled
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--portal-text-muted)', margin: 0, maxWidth: '440px', marginInline: 'auto' }}>
                  Deliverable milestones and sprint timelines will appear here once projects are configured in AgencyFlow for {client.name}.
                </p>
              </div>
            )}
          </div>

          {/* =========================================================
              ROW 3: TWO-COLUMN BOTTOM GRID
              - Left (32%): Action Required + 2x2 Summaries
              - Right (68%): Shared Resources + Invoices + Activity
              ========================================================= */}
          <div className="portal-bottom-grid">
            {/* Left Column */}
            <div className="portal-left-column">
              {/* Action Required Panel */}
              <div className="portal-panel action-required-card portal-card-interactive">
                <div className="action-header-row">
                  <span
                    className={actionRequired && !signedOff ? 'action-pill-amber' : 'action-pill-amber'}
                    style={
                      !actionRequired || signedOff
                        ? { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.25)' }
                        : undefined
                    }
                  >
                    {!actionRequired || signedOff ? '✓ All Clear' : 'Action Required'}
                  </span>
                  <span
                    className="action-pending-badge"
                    style={
                      !actionRequired || signedOff
                        ? { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }
                        : undefined
                    }
                  >
                    {!actionRequired || signedOff ? '0 Pending' : '1 Item Pending'}
                  </span>
                </div>

                {signedOff ? (
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      marginBottom: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#10b981',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.6rem',
                        boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)',
                      }}
                    >
                      <Check size={20} strokeWidth={3} />
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.2rem' }}>
                      Deliverable Approved!
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#a7f3d0', margin: 0 }}>
                      Signed off by {client.primaryContact.fullName} on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. The team has received your confirmation.
                    </p>
                    <button
                      className="btn-secondary-link"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => {
                        setSignedOff(false);
                        showToast('Deliverable status reverted to pending review.');
                      }}
                    >
                      Undo Sign-off
                    </button>
                  </div>
                ) : actionRequired ? (
                  <>
                    <h3 className="action-main-title">{actionRequired.title}</h3>
                    <div className="action-spec-title">{actionRequired.specTitle}</div>
                    <div className="action-submitted-meta">{actionRequired.submittedMeta}</div>

                    {/* Document Preview Thumbnail */}
                    <div
                      className="document-preview-chip"
                      onClick={() =>
                        setPreviewDocModal({
                          id: actionRequired.document.id,
                          name: actionRequired.document.name,
                          category: 'specs',
                          size: actionRequired.document.size,
                          updated: actionRequired.document.updated,
                          type: (actionRequired.document.type === 'zip' ? 'zip' : actionRequired.document.type === 'doc' ? 'doc' : 'pdf'),
                          description: actionRequired.document.description,
                        })
                      }
                      title="Click to preview deliverable"
                    >
                      <div className="doc-chip-left">
                        <div className="doc-chip-icon">
                          <FileText size={16} />
                        </div>
                        <div className="doc-chip-text">
                          <div className="doc-chip-name">{actionRequired.document.name}</div>
                          <div className="doc-chip-sub">{actionRequired.document.size} • {actionRequired.document.updated}</div>
                        </div>
                      </div>
                      <Eye size={15} color="var(--portal-text-muted)" />
                    </div>

                    {/* Approve Button CTA */}
                    <button
                      className="btn-approve-cta hover-level-1"
                      onClick={handleApprove}
                    >
                      <Check size={18} strokeWidth={2.5} /> Approve Deliverable
                    </button>

                    {/* Secondary Action */}
                    <button
                      className="btn-secondary-link"
                      onClick={() => setRevisionModal(true)}
                    >
                      Request Changes or Clarification
                    </button>
                  </>
                ) : (
                  <div style={{ padding: '1.25rem 0.5rem', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.6rem',
                      }}
                    >
                      <CheckCircle2 size={22} />
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.2rem' }}>
                      All Caught Up
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--portal-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      No deliverables or actions currently require sign-off for {client.name}.
                    </p>
                  </div>
                )}
              </div>

              {/* 2x2 Small Summary Cards */}
              <div className="portal-summary-grid">
                {/* Card 1: ACTIVE */}
                <div
                  className="portal-stat-card hover-level-2"
                  onClick={() => showToast(`Active Items: ${summaryStats.activeOpen} open for ${client.name}`)}
                >
                  <div className="stat-card-top">
                    <span className="stat-card-eyebrow" style={{ color: '#a78bfa' }}>
                      ACTIVE
                    </span>
                    <div className="stat-card-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                      <CheckSquare size={13} color="#a78bfa" />
                    </div>
                  </div>
                  <div>
                    <div className="stat-card-value">{summaryStats.activeOpen} Open</div>
                    <div className="stat-card-sub">{summaryStats.activeSub}</div>
                  </div>
                </div>

                {/* Card 2: UNREAD */}
                <div
                  className="portal-stat-card hover-level-2"
                  onClick={() => showToast(`Unread Messages: ${summaryStats.unreadCount} new messages for ${client.name}`)}
                >
                  <div className="stat-card-top">
                    <span className="stat-card-eyebrow" style={{ color: '#38bdf8' }}>
                      UNREAD
                    </span>
                    <div className="stat-card-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
                      <MessageSquare size={13} color="#38bdf8" />
                    </div>
                  </div>
                  <div>
                    <div className="stat-card-value">{summaryStats.unreadCount} New</div>
                    <div className="stat-card-sub">{summaryStats.unreadSub}</div>
                  </div>
                </div>

                {/* Card 3: VAULT */}
                <div
                  className="portal-stat-card hover-level-2"
                  onClick={() => {
                    if (allVaultFiles.length > 0) setShowVaultModal(true);
                    else showToast(`No documents uploaded in vault for ${client.name}.`);
                  }}
                >
                  <div className="stat-card-top">
                    <span className="stat-card-eyebrow" style={{ color: '#cbd5e1' }}>
                      VAULT
                    </span>
                    <div className="stat-card-icon-wrap" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                      <HardDrive size={13} color="#cbd5e1" />
                    </div>
                  </div>
                  <div>
                    <div className="stat-card-value">{summaryStats.vaultFilesCount} Files</div>
                    <div className="stat-card-sub">{summaryStats.vaultSub}</div>
                  </div>
                </div>

                {/* Card 4: DUE */}
                <div
                  className="portal-stat-card hover-level-2"
                  onClick={() => {
                    if (!isTargetInvoicePaid && outstandingInvoice) setShowPayModal(true);
                    else showToast(`All billing for ${client.name} is settled.`);
                  }}
                >
                  <div className="stat-card-top">
                    <span className="stat-card-eyebrow" style={{ color: '#fbbf24' }}>
                      DUE
                    </span>
                    <div className="stat-card-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                      <CreditCard size={13} color="#fbbf24" />
                    </div>
                  </div>
                  <div>
                    <div
                      className="stat-card-value"
                      style={{ color: summaryStats.dueAmount === 0 || isTargetInvoicePaid ? '#10b981' : '#fbbf24' }}
                    >
                      {isTargetInvoicePaid ? '$0.00' : summaryStats.dueFormatted}
                    </div>
                    <div className="stat-card-sub">
                      {isTargetInvoicePaid ? 'All Paid ✓' : summaryStats.dueDateText}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="portal-main-column">
              {/* Shared Resources Panel */}
              <div className="portal-panel resources-panel portal-card-interactive">
                <div className="resources-header">
                  <div className="resources-title-group">
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      Shared Resources
                    </h2>
                    <span className="resources-badge">{allVaultFiles.length} Total</span>
                  </div>

                  {/* Filter / Navigation Options */}
                  {allVaultFiles.length > 0 && (
                    <div className="resources-filter-tabs">
                      {(['all', 'specs', 'assets', 'contracts'] as const).map((tab) => (
                        <button
                          key={tab}
                          className={`filter-tab-btn ${activeResourceTab === tab ? 'active' : ''}`}
                          onClick={() => setActiveResourceTab(tab)}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}

                  {allVaultFiles.length > 0 && (
                    <button
                      className="milestone-link hover-level-1"
                      onClick={() => setShowVaultModal(true)}
                    >
                      View All <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {/* Document Cards or Empty State */}
                {filteredResources.length > 0 ? (
                  <div className="resources-grid">
                    {filteredResources.map((doc) => {
                      const isPdf = doc.type === 'pdf';
                      const isZip = doc.type === 'zip';
                      return (
                        <div
                          key={doc.id}
                          className="resource-card hover-level-2"
                          onClick={() => setPreviewDocModal(doc)}
                        >
                          <div className="resource-card-top">
                            <div
                              className={`resource-type-icon ${
                                isPdf
                                  ? 'resource-icon-pdf'
                                  : isZip
                                  ? 'resource-icon-zip'
                                  : 'resource-icon-doc'
                              }`}
                            >
                              {isPdf ? (
                                <FileText size={18} />
                              ) : isZip ? (
                                <FolderArchive size={18} />
                              ) : (
                                <FileCode size={18} />
                              )}
                            </div>

                            <button
                              className="resource-download-btn hover-level-1"
                              title={`Download ${doc.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast(`Downloading ${doc.name} (${doc.size})...`);
                              }}
                            >
                              <Download size={14} />
                            </button>
                          </div>

                          <div>
                            <div className="resource-name">{doc.name}</div>
                            <div className="resource-meta">
                              {doc.size} • {doc.updated}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '2.5rem 1.5rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <HardDrive size={28} color="var(--portal-text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                      No Shared Documents in Vault
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--portal-text-muted)', margin: 0 }}>
                      Contracts, design specifications, and deliverables uploaded for {client.name} will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Invoices Panel */}
              <div className="portal-panel invoices-panel portal-card-interactive">
                <div className="invoices-header">
                  <div className="invoices-title-group">
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      Recent Invoices
                    </h2>
                    <span className="invoices-subtext">
                      {invoices.length > 0 ? `${invoices.length} Statements` : 'Statements'}
                    </span>
                  </div>

                  <button
                    className="milestone-link hover-level-1"
                    onClick={() => showToast(`Opening billing statements for ${client.name}...`)}
                  >
                    Billing Portal <ArrowRight size={14} />
                  </button>
                </div>

                {/* Invoice Rows or Empty State */}
                {invoices.length > 0 ? (
                  <div className="invoices-list">
                    {invoices.map((inv) => {
                      const isPaid = inv.status === 'PAID' || Boolean(paidInvoices[inv.id]);
                      const isOutstanding = !isPaid;

                      return (
                        <div
                          key={inv.id}
                          className={`invoice-row ${isOutstanding ? 'invoice-row-outstanding' : ''}`}
                        >
                          <div className="invoice-left-block">
                            <div
                              className="invoice-icon-wrap"
                              style={{ color: isPaid ? '#10b981' : '#f59e0b' }}
                            >
                              <Receipt size={18} />
                            </div>
                            <div className="invoice-number-col">
                              <span className="invoice-number-text">{inv.number}</span>
                              <span className="invoice-desc-text">{inv.description} • {inv.dueDate}</span>
                            </div>
                          </div>

                          <div className="invoice-right-block">
                            <span
                              className="invoice-amount-text"
                              style={{ color: isPaid ? 'var(--portal-text-secondary)' : '#ffffff' }}
                            >
                              ${inv.amount.toLocaleString()}.00
                            </span>
                            {isPaid ? (
                              <span className="invoice-badge-paid">Paid</span>
                            ) : (
                              <span className="invoice-badge-outstanding">Outstanding</span>
                            )}

                            {isPaid ? (
                              <button
                                className="btn-invoice-download hover-level-1"
                                title="Download receipt"
                                onClick={() => showToast(`Downloading Receipt for ${inv.number}...`)}
                              >
                                <Download size={15} />
                              </button>
                            ) : (
                              <button
                                className="btn-pay-now hover-level-1"
                                onClick={() => setShowPayModal(true)}
                              >
                                <CreditCard size={13} /> Pay Now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '2.5rem 1.5rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Receipt size={28} color="var(--portal-text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                      No Invoices Issued
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--portal-text-muted)', margin: 0 }}>
                      There are currently no outstanding or paid billing statements on record for {client.name}.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Activity Panel */}
              <div className="portal-panel activity-panel portal-card-interactive">
                <div className="activity-header">
                  <div className="activity-live-dot">
                    <span className="live-dot-green" />
                    <span>Recent Activity</span>
                  </div>
                  <span className="activity-sync-badge">Live DB Sync</span>
                </div>

                {/* Vertical Timeline or Empty State */}
                {activities.length > 0 ? (
                  <div className="activity-timeline">
                    {activities.map((act) => (
                      <div key={act.id} className="activity-row">
                        <div className={`activity-avatar ${act.avatarClass}`}>
                          {act.avatar}
                        </div>
                        <div className="activity-content">
                          <div className="activity-text-line">
                            <span className="activity-user-name">{act.userName}</span> {act.actionPhrase}{' '}
                            <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{act.objectTitle}</span>
                          </div>
                          <div className="activity-sub-desc">{act.supportingText}</div>
                        </div>
                        <span className="activity-timestamp">{act.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--portal-text-muted)', fontSize: '0.82rem' }}>
                    <Clock size={24} style={{ margin: '0 auto 0.4rem', opacity: 0.6 }} />
                    <div>No timeline activities logged yet for this account.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            INTERACTIVE MODALS & DRAWERS
            ========================================================= */}

        {/* Modal 1: Request Revision Modal */}
        {showRevisionModal && actionRequired && (
          <div className="portal-modal-backdrop" onClick={() => setRevisionModal(false)}>
            <div className="portal-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="portal-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Request Revision or Clarification
                  </h3>
                </div>
                <button
                  onClick={() => setRevisionModal(false)}
                  style={{ color: 'var(--portal-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRevisionSubmit}>
                <div className="portal-modal-body">
                  <div style={{ fontSize: '0.8rem', color: 'var(--portal-text-secondary)', marginBottom: '0.85rem' }}>
                    Target Item: <strong style={{ color: '#ffffff' }}>{actionRequired.specTitle}</strong>
                  </div>

                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#c4b5fd', marginBottom: '0.4rem' }}>
                    Feedback / Change Request Notes for {client.name}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="Please specify sections, deliverables, or specifications you'd like our team to revise..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(10, 12, 20, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--portal-text-muted)', marginTop: '0.4rem', display: 'block' }}>
                    The project lead for {client.name} will be notified immediately.
                  </span>
                </div>

                <div className="portal-modal-footer">
                  <button
                    type="button"
                    onClick={() => setRevisionModal(false)}
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--portal-text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={14} /> Send Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Pay Now Checkout Modal */}
        {showPayModal && outstandingInvoice && (
          <div className="portal-modal-backdrop" onClick={() => setShowPayModal(false)}>
            <div className="portal-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="portal-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CreditCard size={18} color="#a78bfa" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Pay {outstandingInvoice.number} — {client.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  style={{ color: 'var(--portal-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="portal-modal-body">
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-muted)' }}>Amount Due</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                      ${outstandingInvoice.amount.toLocaleString()}.00
                    </div>
                  </div>
                  <span className="invoice-badge-outstanding">{outstandingInvoice.dueDate}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(139, 92, 246, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1e293b',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                        }}
                      >
                        VISA
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                          Corporate Card (•••• 4242)
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--portal-text-muted)' }}>
                          Expires 08/28 • Default Billing Method
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 size={18} color="#34d399" />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: 'var(--portal-text-muted)' }}>
                  <ShieldCheck size={14} color="#34d399" /> Encrypted 256-bit Stripe checkout. A receipt will be sent to {client.primaryContact.email && !client.primaryContact.email.includes('not available') && !client.primaryContact.email.includes('.internal') ? client.primaryContact.email : 'your verified billing email'}.
                </div>
              </div>

              <div className="portal-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--portal-text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePayInvoice(outstandingInvoice.id, outstandingInvoice.amount)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={16} strokeWidth={2.5} /> Confirm & Pay ${outstandingInvoice.amount.toLocaleString()}.00
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: Milestone Roadmap Detailed Modal */}
        {showRoadmapModal && milestones.length > 0 && (
          <div className="portal-modal-backdrop" onClick={() => setShowRoadmapModal(false)}>
            <div className="portal-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
              <div className="portal-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Flag size={18} color="#a78bfa" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {client.name} — Sprint Roadmap
                  </h3>
                </div>
                <button
                  onClick={() => setShowRoadmapModal(false)}
                  style={{ color: 'var(--portal-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="portal-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: m.status === 'ACTIVE' ? 'rgba(139, 92, 246, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                        border:
                          m.status === 'COMPLETED'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : m.status === 'ACTIVE'
                            ? '1px solid rgba(168, 85, 247, 0.35)'
                            : '1px dashed rgba(255, 255, 255, 0.12)',
                        opacity: m.status === 'LOCKED' ? 0.65 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{m.title}</span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: m.status === 'COMPLETED' ? '#34d399' : m.status === 'ACTIVE' ? '#c4b5fd' : 'var(--portal-text-muted)',
                            fontWeight: 600,
                            background: m.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.12)' : m.status === 'ACTIVE' ? 'rgba(139, 92, 246, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          {m.date}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--portal-text-secondary)', margin: '0 0 0.5rem' }}>
                        Milestone stage and deliverable targets for {client.name}.
                      </p>
                      <div style={{ fontSize: '0.72rem', color: m.status === 'COMPLETED' ? '#34d399' : '#c4b5fd', fontWeight: 600 }}>
                        {m.metric}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="portal-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowRoadmapModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close Roadmap
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 4: File Vault Modal ("View All") */}
        {showVaultModal && allVaultFiles.length > 0 && (
          <div className="portal-modal-backdrop" onClick={() => setShowVaultModal(false)}>
            <div className="portal-modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div className="portal-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <HardDrive size={18} color="#a78bfa" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {client.name} Resource Vault ({allVaultFiles.length} Files)
                  </h3>
                </div>
                <button
                  onClick={() => setShowVaultModal(false)}
                  style={{ color: 'var(--portal-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="portal-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {allVaultFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.16s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background:
                              file.type === 'pdf'
                                ? 'rgba(244, 63, 94, 0.14)'
                                : file.type === 'zip'
                                ? 'rgba(245, 158, 11, 0.14)'
                                : 'rgba(59, 130, 246, 0.14)',
                            color:
                              file.type === 'pdf'
                                ? '#fb7185'
                                : file.type === 'zip'
                                ? '#fbbf24'
                                : '#60a5fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {file.type === 'pdf' ? (
                            <FileText size={16} />
                          ) : file.type === 'zip' ? (
                            <FolderArchive size={16} />
                          ) : (
                            <FileCode size={16} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--portal-text-muted)' }}>
                            {file.size} • {file.updated}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => showToast(`Downloading ${file.name}...`)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.25)',
                          color: '#c4b5fd',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={13} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="portal-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 5: Document Preview Modal */}
        {previewDocModal && (
          <div className="portal-modal-backdrop" onClick={() => setPreviewDocModal(null)}>
            <div className="portal-modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
              <div className="portal-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Eye size={18} color="#a78bfa" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {previewDocModal.name}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewDocModal(null)}
                  style={{ color: 'var(--portal-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="portal-modal-body">
                <div
                  style={{
                    height: '180px',
                    borderRadius: '10px',
                    background: 'rgba(10, 12, 20, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c4b5fd',
                    }}
                  >
                    <FileText size={24} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--portal-text-secondary)', fontWeight: 500 }}>
                    Encrypted Client Document Preview Available
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--portal-text-secondary)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                  {previewDocModal.description || `Production document for ${client.name}.`}
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--portal-text-muted)' }}>
                  File Size: <strong style={{ color: '#ffffff' }}>{previewDocModal.size}</strong> • Last Updated: <strong style={{ color: '#ffffff' }}>{previewDocModal.updated}</strong>
                </div>
              </div>

              <div className="portal-modal-footer">
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--portal-text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Downloading ${previewDocModal.name}...`);
                    setPreviewDocModal(null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} /> Download Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Toast Notification */}
        {toastMessage && (
          <div className="portal-toast">
            <Sparkles size={16} color="#c084fc" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-standalone-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#ffffff' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(139, 92, 246, 0.2)',
                borderTopColor: '#a855f7',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading Client Portal...</div>
          </div>
        </div>
      }
    >
      <ClientPortalContent />
    </Suspense>
  );
}
