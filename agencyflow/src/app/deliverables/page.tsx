'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function DeliverablesPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revisions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Mock Deliverables Data matching Stitch visual source of truth
  const deliverables = [
    {
      id: 'del-1',
      fileName: 'v2.4_Database_Schema_Architecture.pdf',
      fileType: 'pdf',
      projectName: 'TechFlow Cloud Portal',
      version: 'v2.4',
      status: 'PENDING CLIENT REVIEW',
      statusType: 'pending',
      accentColor: 'var(--tertiary)',
      infoText: 'Waiting for client feedback since 4 hours ago.',
      commentsCount: 0,
    },
    {
      id: 'del-2',
      fileName: 'Brand_Identity_Guidelines_Final.zip',
      fileType: 'zip',
      projectName: 'Acme Brand Identity',
      version: 'v1.0',
      status: 'APPROVED',
      statusType: 'approved',
      accentColor: 'var(--secondary)',
      approvedBy: 'Alex Rivera',
      approvedDate: 'Aug 12',
    },
    {
      id: 'del-3',
      fileName: 'UI_Kit_Component_Library_Draft.fig',
      fileType: 'figma',
      projectName: 'Nexus Cloud Infrastructure',
      version: 'v0.8',
      status: 'REVISION REQUESTED',
      statusType: 'revisions',
      accentColor: 'var(--error)',
      commenterName: 'Sarah Jenkins',
      commentTime: 'Yesterday, 2:45 PM',
      commentText:
        '"Please update section 3.2 to include OAuth2 details. The current flow doesn\'t match our latest security requirements. Everything else looks solid."',
      threadCount: 3,
    },
  ];

  const filteredDeliverables = deliverables.filter((item) => {
    if (filter !== 'all' && item.statusType !== filter) return false;
    if (
      searchQuery &&
      !item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <AppShell>
      <div className="page-content">
        {/* Header Title Section */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '0.25rem' }}>
              WORKFLOW / CLIENT TOUCHPOINTS
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--on-surface)' }}>
              Deliverables & Approvals
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '440px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: '20px' }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(38, 42, 53, 0.5)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(192, 193, 255, 0.2)',
                  borderRadius: 'var(--radius-DEFAULT)',
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--on-surface)',
                  outline: 'none',
                }}
              />
            </div>

            <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                upload_file
              </span>
              Upload Deliverable
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { id: 'all', label: 'All Deliverables' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'revisions', label: 'Revisions' },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'rgba(192, 193, 255, 0.2)' : 'rgba(28, 31, 42, 0.5)',
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                  border: isActive ? '1px solid rgba(192, 193, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isActive ? '0 0 10px rgba(192, 193, 255, 0.15)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Deliverables Cards Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredDeliverables.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: '1.5rem',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(23, 27, 38, 0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
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

              {/* Left Main Content */}
              <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* File Icon Container */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '0.5rem',
                        background:
                          item.fileType === 'pdf'
                            ? 'rgba(147, 0, 10, 0.2)'
                            : item.fileType === 'zip'
                            ? 'var(--surface-container-high)'
                            : 'rgba(49, 53, 64, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.fileType === 'pdf' ? (
                        <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '24px' }}>
                          picture_as_pdf
                        </span>
                      ) : item.fileType === 'zip' ? (
                        <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '24px' }}>
                          folder_zip
                        </span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ color: '#F24E1E', fontSize: '24px' }}>
                          design_services
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.3 }}>
                        {item.fileName}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          folder_open
                        </span>
                        {item.projectName}
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--outline-variant)' }} />
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--surface-container-high)', fontFamily: 'monospace' }}>
                          {item.version}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge Pill */}
                  <div
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      background:
                        item.statusType === 'pending'
                          ? 'rgba(202, 129, 0, 0.2)'
                          : item.statusType === 'approved'
                          ? 'rgba(0, 165, 114, 0.2)'
                          : 'rgba(147, 0, 10, 0.2)',
                      border: `1px solid ${item.accentColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: item.accentColor,
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.accentColor, letterSpacing: '0.05em' }}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Sub Info Box */}
                {item.statusType === 'pending' && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(28, 31, 42, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '18px' }}>
                      schedule
                    </span>
                    <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                      {item.infoText}
                    </p>
                  </div>
                )}

                {item.statusType === 'approved' && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(78, 222, 163, 0.08)',
                      border: '1px solid rgba(78, 222, 163, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--secondary)',
                        color: 'var(--on-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      AR
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
                      Approved by <strong>{item.approvedBy}</strong> on {item.approvedDate}
                    </p>
                  </div>
                )}

                {item.statusType === 'revisions' && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(255, 180, 171, 0.08)',
                      border: '1px solid rgba(255, 180, 171, 0.15)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--error)',
                        color: 'var(--on-error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      SJ
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--error)', marginBottom: '0.2rem' }}>
                        {item.commenterName} <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '10px' }}>{item.commentTime}</span>
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)' }}>{item.commentText}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Action Column */}
              <div
                style={{
                  width: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  paddingLeft: '1.25rem',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {item.statusType === 'pending' && (
                  <>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span> New Version
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span> Resend Request
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>forum</span> Comments (0)
                    </button>
                  </>
                )}

                {item.statusType === 'approved' && (
                  <>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Download Final
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span> History
                    </button>
                  </>
                )}

                {item.statusType === 'revisions' && (
                  <>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span> Upload v0.9
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>forum</span> View Thread (3)
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Deliverable Modal */}
      {uploadModalOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setUploadModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '90%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--surface-container-low)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>Upload New Deliverable</h2>
              <button onClick={() => setUploadModalOpen(false)} style={{ color: 'var(--on-surface-variant)' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.4rem' }}>Select Project</label>
              <select
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
              <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>PDF, ZIP, FIG, or MP4 up to 50MB</p>
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
