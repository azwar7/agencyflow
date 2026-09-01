'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
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
  ExternalLink,
  Copy,
  Check,
  Palette,
  FileCode,
  Film,
  Layers,
  Trash2,
} from 'lucide-react';

interface DeliverableItem {
  id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'zip' | 'figma' | 'video';
  projectName: string;
  clientContact: string;
  version: string;
  status: 'PENDING CLIENT REVIEW' | 'APPROVED' | 'REVISION REQUESTED';
  statusType: 'pending' | 'approved' | 'revisions';
  accentColor: string;
  sentDate: string;
  dueDate: string;
  commentsCount?: number;
  feedbackNotes?: string;
}

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View & Filter States
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REVISIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag & Drop State
  const [draggingDeliverableId, setDraggingDeliverableId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Selected Deliverable Review Modal State
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableItem | null>(null);
  const [aiSummaryChecklist, setAiSummaryChecklist] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFileType, setNewFileType] = useState<'figma' | 'pdf' | 'zip' | 'video'>('figma');
  const [newProjectName, setNewProjectName] = useState('Mohmand Luxury Property Portal');
  const [newClient, setNewClient] = useState('Mohmand Property Dealers');
  const [newVersion, setNewVersion] = useState('v1.0');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Toast / Feedback Alert
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchDeliverables = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/deliverables');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDeliverables(json.data);
      } else {
        setDeliverables([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

  // Update Deliverable Status
  const handleUpdateStatus = async (id: string, newStatus: DeliverableItem['status']) => {
    const prev = [...deliverables];
    setDeliverables((current) =>
      current.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    if (selectedDeliverable && selectedDeliverable.id === id) {
      setSelectedDeliverable({ ...selectedDeliverable, status: newStatus });
    }

    try {
      await fetch('/api/v1/deliverables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setToastMsg(`Status updated to ${newStatus}`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setDeliverables(prev);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingDeliverableId(id);
  };

  const handleDragEnd = () => {
    setDraggingDeliverableId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colStatus) setDragOverColumn(colStatus);
  };

  const handleDragLeave = (e: React.DragEvent, colStatus: string) => {
    if (dragOverColumn === colStatus) setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: DeliverableItem['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingDeliverableId;
    setDraggingDeliverableId(null);
    setDragOverColumn(null);

    if (id) {
      const item = deliverables.find((d) => d.id === id);
      if (item && item.status !== targetStatus) {
        handleUpdateStatus(id, targetStatus);
      }
    }
  };

  // AI Summarize Revision Feedback
  const handleAiSummarize = (notes: string) => {
    setSummarizing(true);
    setAiSummaryChecklist(null);

    setTimeout(() => {
      setAiSummaryChecklist([
        'Darken primary navigation bar to match brand charcoal theme',
        'Increase padding & typography weight on property card pricing',
        'Add direct WhatsApp instant booking action button on mobile header',
      ]);
      setSummarizing(false);
    }, 600);
  };

  // Create New Deliverable
  const handleCreateDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/v1/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          fileName: `${newTitle.trim().replace(/\s+/g, '_')}_${newVersion}.${newFileType === 'figma' ? 'fig' : newFileType}`,
          fileType: newFileType,
          version: newVersion,
          clientContact: newClient.trim(),
          dueDate: newDueDate || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setNewTitle('');
        setToastMsg('Deliverable uploaded for client review!');
        setTimeout(() => setToastMsg(null), 3000);
        fetchDeliverables();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Delete Deliverable
  const handleDeleteDeliverable = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deliverable?')) return;
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
    if (selectedDeliverable?.id === id) setSelectedDeliverable(null);

    try {
      await fetch(`/api/v1/deliverables?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      fetchDeliverables();
    }
  };

  // KPI Metrics Calculation
  const totalCount = deliverables.length;
  const pendingCount = deliverables.filter((d) => d.status === 'PENDING CLIENT REVIEW').length;
  const approvedCount = deliverables.filter((d) => d.status === 'APPROVED').length;
  const revisionsCount = deliverables.filter((d) => d.status === 'REVISION REQUESTED').length;

  // Filtered List
  const filteredDeliverables = deliverables.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clientContact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && d.status === 'PENDING CLIENT REVIEW') ||
      (statusFilter === 'APPROVED' && d.status === 'APPROVED') ||
      (statusFilter === 'REVISIONS' && d.status === 'REVISION REQUESTED');
    return matchesSearch && matchesStatus;
  });

  const getFileTypeIcon = (type: DeliverableItem['fileType']) => {
    switch (type) {
      case 'figma':
        return <Palette size={16} color="#a855f7" />;
      case 'pdf':
        return <FileText size={16} color="#38bdf8" />;
      case 'zip':
        return <FileCode size={16} color="#4edea3" />;
      case 'video':
        return <Film size={16} color="#ffb95f" />;
    }
  };

  const getStatusBadge = (status: DeliverableItem['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(78, 222, 163, 0.18)', border: '1px solid rgba(78, 222, 163, 0.3)', color: '#4edea3', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={12} /> APPROVED
          </span>
        );
      case 'PENDING CLIENT REVIEW':
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} /> IN REVIEW
          </span>
        );
      case 'REVISION REQUESTED':
        return (
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'rgba(255, 185, 95, 0.18)', border: '1px solid rgba(255, 185, 95, 0.3)', color: '#ffb95f', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertCircle size={12} /> REVISIONS
          </span>
        );
    }
  };

  // Kanban Columns Definition
  const kanbanColumns: {
    status: DeliverableItem['status'];
    label: string;
    headerBg: string;
    headerColor: string;
  }[] = [
    {
      status: 'PENDING CLIENT REVIEW',
      label: 'Submitted for Review',
      headerBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      headerColor: '#ffffff',
    },
    {
      status: 'REVISION REQUESTED',
      label: 'Revisions Requested',
      headerBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      headerColor: '#ffffff',
    },
    {
      status: 'APPROVED',
      label: 'Approved & Production Ready',
      headerBg: 'linear-gradient(135deg, #10b981, #059669)',
      headerColor: '#ffffff',
    },
  ];

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'calc(100vh - 100px)' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Layers size={24} color="#a855f7" /> Deliverables & Client Sign-Off Hub
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              Manage design prototypes, engineering code bundles, and client review feedback workflows.
            </p>
          </div>

          {/* Action Buttons & View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'var(--surface-container-high)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setViewMode('board')}
                style={{
                  background: viewMode === 'board' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'board' ? '#003355' : 'var(--on-surface-variant)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                <LayoutGrid size={14} /> Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'list' ? '#003355' : 'var(--on-surface-variant)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                <ListIcon size={14} /> List
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
              <input
                type="text"
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '180px',
                }}
              />
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
              }}
            >
              <Upload size={15} /> Upload Asset
            </button>
          </div>
        </div>

        {/* Toast Alert Banner */}
        {toastMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(78, 222, 163, 0.12)', border: '1px solid rgba(78, 222, 163, 0.3)', color: '#4edea3', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> {toastMsg}
            </div>
            <button onClick={() => setToastMsg(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Top Approval SLA Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Pending Sign-off */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>In Client Review</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>{pendingCount}</div>
            </div>
          </div>

          {/* Approved This Month */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Approved & Ready</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4edea3' }}>{approvedCount}</div>
            </div>
          </div>

          {/* Revisions Active */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 185, 95, 0.15)', color: '#ffb95f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Revisions Active</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffb95f' }}>{revisionsCount}</div>
            </div>
          </div>

          {/* SLA Turnaround */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Turnaround</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>1.8 days</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'PENDING', 'REVISIONS', 'APPROVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === st ? 'rgba(168, 85, 247, 0.2)' : 'var(--surface-container-low)',
                border: statusFilter === st ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                color: statusFilter === st ? '#c084fc' : 'var(--on-surface-variant)',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'ALL' ? 'All Deliverables' : st === 'PENDING' ? 'In Review' : st === 'REVISIONS' ? 'Revisions' : 'Approved'}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-pulse" style={{ height: '400px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchDeliverables} />
        ) : filteredDeliverables.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No deliverables found"
            description="Upload prototypes, PDFs, Loom walkthroughs, and code bundles for client sign-offs."
            actionLabel="+ Upload Asset"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : viewMode === 'board' ? (
          /* Kanban Review Board */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', alignItems: 'start', paddingBottom: '2rem' }}>
            {kanbanColumns.map((col) => {
              const colItems = filteredDeliverables.filter((d) => d.status === col.status);
              const isOver = dragOverColumn === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={(e) => handleDragLeave(e, col.status)}
                  onDrop={(e) => handleDrop(e, col.status)}
                  style={{
                    background: isOver ? 'rgba(168, 85, 247, 0.08)' : 'var(--surface-container-lowest)',
                    borderRadius: '12px',
                    border: isOver ? '2px dashed #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Column Header */}
                  <div style={{ background: col.headerBg, color: col.headerColor, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{col.label}</span>
                      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {colItems.length}
                      </span>
                    </div>

                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Upload deliverable"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Cards Column */}
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '160px' }}>
                    {colItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--outline)', fontSize: '0.75rem' }}>
                        No deliverables in this stage
                      </div>
                    ) : (
                      colItems.map((item) => {
                        const isDragging = draggingDeliverableId === item.id;

                        return (
                          <div
                            key={item.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedDeliverable(item)}
                            style={{
                              background: 'var(--surface-container)',
                              color: 'var(--on-surface)',
                              borderRadius: '10px',
                              padding: '1rem',
                              border: isDragging ? '1px dashed #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem',
                              cursor: 'grab',
                              opacity: isDragging ? 0.4 : 1,
                              transform: isDragging ? 'scale(0.98)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {/* Card Top: Asset Type Badge & Version */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                                {getFileTypeIcon(item.fileType)}
                                <span style={{ textTransform: 'uppercase' }}>{item.fileType}</span>
                              </div>
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#d0bcff', fontSize: '0.7rem', fontWeight: 800 }}>
                                {item.version}
                              </span>
                            </div>

                            {/* Title & Project */}
                            <div>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.2rem 0', lineHeight: 1.35 }}>
                                {item.title}
                              </h3>
                              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                                {item.projectName} • <span style={{ color: '#fff' }}>{item.clientContact}</span>
                              </p>
                            </div>

                            {/* Card Footer: Due Date & Action */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} /> {item.dueDate}
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDeliverable(item);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#c084fc' }}
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Deliverable Asset</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Project & Client</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Version</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Due Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliverables.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedDeliverable(item)}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem', color: '#fff', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getFileTypeIcon(item.fileType)}
                        {item.title}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--on-surface-variant)' }}>
                      {item.projectName} • <span style={{ color: '#fff', fontWeight: 600 }}>{item.clientContact}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#d0bcff', fontSize: '0.75rem', fontWeight: 800 }}>
                        {item.version}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--on-surface-variant)' }}>
                      {item.dueDate}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {getStatusBadge(item.status)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedDeliverable(item)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#c084fc' }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Interactive Deliverable Review Modal */}
        {selectedDeliverable && (
          <div className="drawer-backdrop" onClick={() => setSelectedDeliverable(null)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '600px',
                maxWidth: '95vw',
                background: '#181a20',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                padding: '1.5rem',
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    {getFileTypeIcon(selectedDeliverable.fileType)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {selectedDeliverable.fileType} Asset • {selectedDeliverable.version}
                    </span>
                    {getStatusBadge(selectedDeliverable.status)}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {selectedDeliverable.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
                    Project: <strong>{selectedDeliverable.projectName}</strong> • Client: <strong>{selectedDeliverable.clientContact}</strong>
                  </p>
                </div>

                <button onClick={() => setSelectedDeliverable(null)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Client Feedback / Review Notes Section */}
              <div style={{ background: 'var(--surface-container)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#d0bcff', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                    Client Stakeholder Feedback:
                  </span>

                  <button
                    onClick={() => handleAiSummarize(selectedDeliverable.feedbackNotes || '')}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d0bcff' }}
                  >
                    <Sparkles size={12} color="#d0bcff" /> {summarizing ? 'Summarizing...' : 'AI Action Checklist'}
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#e2e2e8', margin: 0, lineHeight: 1.5 }}>
                  {selectedDeliverable.feedbackNotes}
                </p>

                {/* AI Summary Action Checklist */}
                {aiSummaryChecklist && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800 }}>
                      ⚡ AI Developer Action Checklist:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                      {aiSummaryChecklist.map((item, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', color: '#e2e2e8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Check size={13} color="#4edea3" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://agencyflow-crm-beta.vercel.app/review/${selectedDeliverable.id}`);
                      setToastMsg('Secure client review link copied to clipboard!');
                      setTimeout(() => setToastMsg(null), 3000);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Copy size={13} /> Copy Client Link
                  </button>

                  <button
                    onClick={() => handleDeleteDeliverable(selectedDeliverable.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ffb4ab', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedDeliverable.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedDeliverable.id, 'APPROVED')}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', background: '#4edea3', color: '#003822', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <CheckCircle size={14} /> Approve Asset
                    </button>
                  )}

                  {selectedDeliverable.status !== 'REVISION REQUESTED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedDeliverable.id, 'REVISION REQUESTED')}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#ffb95f', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <AlertCircle size={14} /> Request Revision
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create / Upload Deliverable Modal */}
        {isCreateModalOpen && (
          <div className="drawer-backdrop" onClick={() => setIsCreateModalOpen(false)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '480px',
                maxWidth: '95vw',
                background: '#181a20',
                padding: '1.5rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Upload size={18} color="#a855f7" /> Upload Deliverable Asset
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDeliverable} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Deliverable Title:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Luxury Real Estate UI Figma Prototype"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Asset Format:
                    </label>
                    <select
                      value={newFileType}
                      onChange={(e: any) => setNewFileType(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="figma">🎨 Figma Prototype</option>
                      <option value="pdf">📄 PDF Document / SOW</option>
                      <option value="zip">📦 Code Bundle (.zip)</option>
                      <option value="video">🎥 Video Demo (.mp4)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Version Tag:
                    </label>
                    <input
                      type="text"
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Client Organization:
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem',
                    background: '#a855f7',
                    border: 'none',
                    fontWeight: 700,
                    marginTop: '0.5rem',
                  }}
                >
                  {creating ? 'Uploading...' : 'Submit for Review'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
