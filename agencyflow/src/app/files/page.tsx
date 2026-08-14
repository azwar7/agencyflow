'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  X,
  Plus,
  Briefcase,
  User,
  Clock,
  HardDrive,
  Grid,
  List,
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'PDF' | 'IMAGE' | 'SPREADSHEET' | 'ARCHIVE' | 'DOC';
  size: string;
  category: 'Contract' | 'Proposal' | 'Deliverable' | 'Brand Asset';
  client: string;
  project?: string;
  uploadedBy: string;
  uploadedDate: string;
}

import { EmptyState } from '@/components/EmptyState';

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<FileItem['category']>('Deliverable');
  const [uploadClient, setUploadClient] = useState('');

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/v1/files');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFiles(json.data);
      } else {
        setFiles([]);
      }
    } catch {
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName) return;

    const extension = uploadName.slice(uploadName.lastIndexOf('.')).toLowerCase();
    let fileType: FileItem['type'] = 'PDF';
    if (['.jpg', '.png', '.svg', '.webp'].includes(extension)) fileType = 'IMAGE';
    if (['.zip', '.tar', '.gz'].includes(extension)) fileType = 'ARCHIVE';
    if (['.xlsx', '.csv'].includes(extension)) fileType = 'SPREADSHEET';
    if (['.docx', '.txt'].includes(extension)) fileType = 'DOC';

    try {
      await fetch('/api/v1/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadName,
          type: fileType,
          size: '2.5 MB',
          category: uploadCategory,
          client: uploadClient || 'General',
        }),
      });
      fetchFiles();
    } catch (err) {
      console.error(err);
    }

    setIsUploadModalOpen(false);
    setUploadName('');
    setUploadClient('');
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.client || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.uploadedBy || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (typeFilter !== 'ALL' && f.type !== typeFilter) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;

    return true;
  });

  const getFileIcon = (type: FileItem['type']) => {
    switch (type) {
      case 'PDF':
        return <FileText size={22} color="var(--error)" />;
      case 'IMAGE':
        return <ImageIcon size={22} color="var(--secondary)" />;
      case 'SPREADSHEET':
        return <FileSpreadsheet size={22} color="var(--tertiary)" />;
      case 'ARCHIVE':
        return <FileArchive size={22} color="var(--primary)" />;
      default:
        return <FolderOpen size={22} color="var(--on-surface-variant)" />;
    }
  };

  const getCategoryBadge = (category: FileItem['category']) => {
    switch (category) {
      case 'Contract':
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(147, 0, 10, 0.2)', border: '1px solid rgba(255, 180, 171, 0.3)', color: 'var(--error)', fontSize: '0.7rem', fontWeight: 700 }}>
            CONTRACT
          </span>
        );
      case 'Proposal':
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(202, 129, 0, 0.2)', border: '1px solid rgba(255, 185, 95, 0.3)', color: 'var(--tertiary)', fontSize: '0.7rem', fontWeight: 700 }}>
            PROPOSAL
          </span>
        );
      case 'Deliverable':
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(0, 165, 114, 0.2)', border: '1px solid rgba(78, 222, 163, 0.3)', color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: 700 }}>
            DELIVERABLE
          </span>
        );
      default:
        return (
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(128, 131, 255, 0.15)', border: '1px solid rgba(192, 193, 255, 0.3)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700 }}>
            BRAND ASSET
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minHeight: 'calc(100vh - 4rem)' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>Files & Assets</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
              Centralized document storage for client contracts, project deliverables, proposals, and design assets.
            </p>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.6rem 1.15rem' }}
          >
            <Upload size={18} /> Upload File
          </button>
        </div>

        {/* Storage KPI Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>STORAGE USED</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.3rem 0' }}>4.2 GB</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>of 50 GB Cloud Quota</span>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>TOTAL DOCUMENTS</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: '0.3rem 0' }}>{files.length}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Active workspace files</span>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CLIENT DELIVERABLES</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)', margin: '0.3rem 0' }}>
              {files.filter((f) => f.category === 'Deliverable').length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>Shared with clients</span>
          </div>

          <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '0.85rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CONTRACTS & PROPOSALS</p>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--tertiary)', margin: '0.3rem 0' }}>
              {files.filter((f) => f.category === 'Contract' || f.category === 'Proposal').length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 600 }}>Legal & sales docs</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '0.85rem', background: 'var(--surface-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px', background: 'var(--surface-container-high)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Search size={16} color="var(--on-surface-variant)" />
            <input
              type="text"
              placeholder="Search files by title, client, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '0.85rem', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.85rem',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All File Types</option>
              <option value="PDF">PDF Documents</option>
              <option value="IMAGE">Design Assets</option>
              <option value="SPREADSHEET">Spreadsheets</option>
              <option value="ARCHIVE">Archives & Kits</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.85rem',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="Contract">Contracts</option>
              <option value="Proposal">Proposals</option>
              <option value="Deliverable">Deliverables</option>
              <option value="Brand Asset">Brand Assets</option>
            </select>

            {(searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Files Data Table */}
        {filteredFiles.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL' ? 'No matching files found' : 'No files uploaded yet'}
            description={
              searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'Try adjusting your search query or reset file type/category filters.'
                : 'Upload contract PDFs, design kits, project spreadsheets, and creative deliverables.'
            }
            actionLabel={searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL' ? 'Clear Filters' : '+ Upload First File'}
            onAction={() => {
              if (searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL') {
                setSearchQuery('');
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
              } else {
                setIsUploadModalOpen(true);
              }
            }}
          />
        ) : (
          <div className="glass-card" style={{ padding: '0', borderRadius: '0.85rem', background: 'var(--surface-container)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DOCUMENT NAME</th>
                  <th>CATEGORY</th>
                  <th>CLIENT / PROJECT</th>
                  <th>SIZE</th>
                  <th>UPLOADED BY</th>
                  <th>DATE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    {/* File Icon & Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '0.5rem',
                            background: 'var(--surface-container-high)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getFileIcon(file.type)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>{getCategoryBadge(file.category)}</td>

                    {/* Client / Project */}
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                        {file.client}
                      </span>
                      {file.project && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          {file.project}
                        </p>
                      )}
                    </td>

                    {/* Size */}
                    <td style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{file.size}</td>

                    {/* Uploaded By */}
                    <td style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>{file.uploadedBy}</td>

                    {/* Date */}
                    <td style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{file.uploadedDate}</td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => alert(`Downloading ${file.name}`)}
                          style={{ padding: '0.35rem 0.65rem', borderRadius: '0.35rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Download size={14} /> Download
                        </button>

                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          style={{ padding: '0.35rem 0.5rem', borderRadius: '0.35rem', background: 'rgba(255, 180, 171, 0.1)', border: '1px solid rgba(255, 180, 171, 0.2)', color: 'var(--error)', fontSize: '0.75rem', cursor: 'pointer' }}
                          title="Delete file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#1c1f2a',
              borderRadius: '1rem',
              padding: '1.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>Upload Asset or File</h2>
              <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>File Name / Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elevate_Creative_Retainer_SOW.pdf"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Related Client</label>
                <input
                  type="text"
                  placeholder="e.g. Elevate Creative Co."
                  value={uploadClient}
                  onChange={(e) => setUploadClient(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Document Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                >
                  <option value="Deliverable">Deliverable (Project asset)</option>
                  <option value="Contract">Contract (MSA / Retainer)</option>
                  <option value="Proposal">Proposal / Pitch Deck</option>
                  <option value="Brand Asset">Brand Asset / Figma Kit</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
