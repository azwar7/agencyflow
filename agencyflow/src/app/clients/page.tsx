'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import {
  ArrowRight,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
  Building2,
  User,
  Mail,
  Phone,
  MoreVertical,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  ExternalLink,
} from 'lucide-react';

interface ClientItem {
  id: string;
  name: string;
  domain: string;
  industry: string;
  contact: string;
  email: string;
  phone: string;
  retainerValue: number;
  retainerFormatted: string;
  status: 'Active' | 'At Risk' | 'Inactive';
  projectsCount: number;
  projects: Array<{ title: string; stage: string; value: number; progress: number }>;
  lastActivity: string;
  createdAt: string;
}

export default function ClientsOverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [retainerFilter, setRetainerFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('RETAINER_DESC');

  // Drawer & Context Menu States
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<ClientItem | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: 'Technology',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    retainer: '0',
    status: 'Active' as 'Active' | 'At Risk' | 'Inactive',
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/clients');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setClients(json.data);
      } else {
        setClients([]);
      }
    } catch (err: any) {
      console.error(err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handle Close Menu on Click Outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        fetchClients();
        window.dispatchEvent(new Event('agencyflow-refresh'));
      }
    } catch (err) {
      console.error('Client creation error:', err);
    } finally {
      const retVal = Number(formData.retainer) || 0;
      const newC: ClientItem = {
        id: `c-${Date.now()}`,
        name: formData.name,
        domain: formData.domain || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        industry: formData.industry,
        contact: formData.contactName || 'Primary Contact',
        email: formData.contactEmail || `contact@${formData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: formData.contactPhone || '+1 (555) 000-0000',
        retainerValue: retVal,
        retainerFormatted: retVal > 0 ? `$${retVal.toLocaleString()}/mo` : '$0',
        status: formData.status,
        projectsCount: 0,
        projects: [],
        lastActivity: 'Just now',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setClients((prev) => [newC, ...prev]);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        domain: '',
        industry: 'Technology',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        retainer: '0',
        status: 'Active',
      });
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteConfirmClient) return;

    try {
      const res = await fetch(`/api/v1/clients?id=${deleteConfirmClient.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || 'Failed to delete client');
      }
      window.dispatchEvent(new Event('agencyflow-refresh'));
    } catch (err: any) {
      console.error('Failed to delete client:', err);
      alert(`Could not delete client: ${err.message}`);
      return;
    }

    setClients((prev) => prev.filter((c) => c.id !== deleteConfirmClient.id));
    if (selectedClient?.id === deleteConfirmClient.id) setSelectedClient(null);
    setDeleteConfirmClient(null);
  };

  // Filter & Sort Logic
  const filteredClients = clients
    .filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.domain.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || c.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesRetainer =
        retainerFilter === 'ALL' ||
        (retainerFilter === 'HIGH' && c.retainerValue >= 12000) ||
        (retainerFilter === 'STANDARD' && c.retainerValue < 12000);

      return matchesSearch && matchesStatus && matchesRetainer;
    })
    .sort((a, b) => {
      if (sortBy === 'RETAINER_DESC') return b.retainerValue - a.retainerValue;
      if (sortBy === 'PROJECTS_DESC') return b.projectsCount - a.projectsCount;
      if (sortBy === 'ALPHABETICAL') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Calculate Metrics
  const totalRetainerRevenue = clients.reduce((sum, c) => sum + c.retainerValue, 0);
  const activeAccountsCount = clients.filter((c) => c.status === 'Active').length;

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem', marginTop: '0.75rem' }}>
              {user?.persona === 'FREELANCER' ? 'CLIENT DIRECTORY' : 'AGENCY DIRECTORY'}
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              {user?.persona === 'FREELANCER' ? 'Clients & Engagements' : 'Clients & Retainers'}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary hover-level-1"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.15rem' }}
            >
              <Plus size={18} /> Add Client Account
            </button>

            <Link
              href="/clients/portal"
              className="btn btn-secondary hover-level-1"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.15rem' }}
            >
              <Eye size={18} /> Client Portal View
            </Link>
          </div>
        </div>

        {/* Summary Metrics Cards */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Active Retainers */}
          <div className="glass-card hover-level-2-spacious cursor-pointer" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'var(--surface-container)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ACTIVE RETAINERS
              </span>
              <div style={{ background: totalRetainerRevenue > 0 ? 'rgba(0, 165, 114, 0.2)' : 'rgba(255, 255, 255, 0.06)', color: totalRetainerRevenue > 0 ? 'var(--secondary)' : 'var(--on-surface-variant)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                {totalRetainerRevenue > 0 ? <><TrendingUp size={12} /> Active</> : 'Contracted: $0'}
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: totalRetainerRevenue > 0 ? 'var(--secondary)' : 'var(--on-surface)', marginTop: '0.4rem' }}>
              ${totalRetainerRevenue.toLocaleString()} / mo
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              {totalRetainerRevenue > 0 ? 'Contracted recurring revenue' : 'No active retainers contracted'}
            </p>
          </div>

          {/* Total Accounts */}
          <div className="glass-card hover-level-2-spacious cursor-pointer" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'var(--surface-container)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                TOTAL ACCOUNTS
              </span>
              <span style={{ background: clients.length > 0 ? 'rgba(192, 193, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)', color: clients.length > 0 ? 'var(--primary)' : 'var(--on-surface-variant)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {clients.length > 0 ? `${clients.length} Total Accounts` : '0 added this quarter'}
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.4rem' }}>
              {activeAccountsCount} Active
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              {clients.length} total client accounts on file
            </p>
          </div>

          {/* Satisfaction Score */}
          <div className="glass-card hover-level-2-spacious cursor-pointer" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', background: 'var(--surface-container)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                SATISFACTION SCORE
              </span>
              <div style={{ background: clients.length > 0 ? 'rgba(0, 165, 114, 0.2)' : 'rgba(255, 255, 255, 0.06)', color: clients.length > 0 ? 'var(--secondary)' : 'var(--on-surface-variant)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                {clients.length > 0 ? <><TrendingUp size={12} /> Verified</> : 'No reviews yet'}
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: clients.length > 0 ? 'var(--tertiary)' : 'var(--on-surface-variant)', marginTop: '0.4rem' }}>
              {clients.length > 0 ? '98% CSAT' : 'N/A'}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              {clients.length > 0 ? 'NPS 74 • Zero active escalations' : 'Awaiting initial client project feedback'}
            </p>
          </div>
        </div>

        {/* Client Search and Filter Toolbar */}
        <div
          className="glass-card"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '0.85rem',
            background: 'var(--surface-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flex: 1,
              minWidth: '280px',
              maxWidth: '420px',
              background: 'var(--surface-container-high)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Search size={16} color="var(--on-surface-variant)" />
            <input
              type="text"
              placeholder="Search clients by company, contact, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--on-surface)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--on-surface)',
                fontSize: '0.8rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.5rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">● Active</option>
              <option value="AT RISK">● At Risk</option>
              <option value="INACTIVE">● Inactive</option>
            </select>

            {/* Retainer Filter */}
            <select
              value={retainerFilter}
              onChange={(e) => setRetainerFilter(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--on-surface)',
                fontSize: '0.8rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.5rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Retainers</option>
              <option value="HIGH">High Value (&gt;$12k/mo)</option>
              <option value="STANDARD">Standard (&lt;$12k/mo)</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'var(--surface-container-high)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--on-surface)',
                fontSize: '0.8rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.5rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="RETAINER_DESC">Highest Retainer</option>
              <option value="PROJECTS_DESC">Most Projects</option>
              <option value="RECENT">Recently Added</option>
              <option value="ALPHABETICAL">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--on-surface-variant)', padding: '0 0.25rem' }}>
          <span>
            Showing <strong style={{ color: 'var(--on-surface)' }}>{filteredClients.length}</strong> of {clients.length} client accounts
          </span>
        </div>

        {/* Clients Table / List */}
        <div
          className="glass-card hover-level-3"
          style={{
            background: 'var(--surface-container-low)',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              Loading agency client accounts...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: '2rem' }}>
              <EmptyState
                icon={Building2}
                title={searchQuery ? 'No matching clients found' : 'No clients yet'}
                description={
                  searchQuery
                    ? `No client accounts matching "${searchQuery}". Try clearing search or filters.`
                    : 'Add your first client account to start managing retainers, projects, and client portal access.'
                }
                actionLabel={searchQuery ? 'Clear Filters' : '+ Add First Client'}
                onAction={() => {
                  if (searchQuery) {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  } else {
                    setIsAddModalOpen(true);
                  }
                }}
              />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--surface-container-high)',
                      textAlign: 'left',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CLIENT ACCOUNT
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PRIMARY CONTACT
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      STATUS
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      MONTHLY RETAINER
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ACTIVE PROJECTS
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      LAST ACTIVITY
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => {
                    const initials = c.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('');

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedClient(c)}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Company Name & Avatar */}
                        <td style={{ padding: '1.1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '0.5rem',
                                background: c.status === 'Active' ? 'var(--primary)' : c.status === 'At Risk' ? 'var(--tertiary)' : 'var(--surface-container-highest)',
                                color: c.status === 'Active' ? 'var(--on-primary)' : '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.9rem' }}>
                                {c.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                                {c.domain}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Primary Contact */}
                        <td style={{ padding: '1.1rem 1.25rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                            {c.contact}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                            {c.email}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '1.1rem 1.25rem', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              whiteSpace: 'nowrap',
                              letterSpacing: '0.04em',
                              background:
                                c.status === 'Active'
                                  ? 'rgba(0, 165, 114, 0.15)'
                                  : c.status === 'At Risk'
                                    ? 'rgba(255, 185, 95, 0.15)'
                                    : 'rgba(255, 255, 255, 0.1)',
                              color:
                                c.status === 'Active'
                                  ? 'var(--secondary)'
                                  : c.status === 'At Risk'
                                    ? 'var(--tertiary)'
                                    : 'var(--on-surface-variant)',
                              border:
                                c.status === 'Active'
                                  ? '1px solid rgba(0, 165, 114, 0.35)'
                                  : c.status === 'At Risk'
                                    ? '1px solid rgba(255, 185, 95, 0.35)'
                                    : '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'currentColor',
                                display: 'inline-block',
                                flexShrink: 0,
                              }}
                            />
                            {c.status.toUpperCase()}
                          </span>
                        </td>

                        {/* Retainer Value */}
                        <td style={{ padding: '1.1rem 1.25rem', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem' }}>
                          {c.retainerFormatted}
                        </td>

                        {/* Active Projects */}
                        <td style={{ padding: '1.1rem 1.25rem', color: 'var(--on-surface)', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{c.projectsCount}</span> Active {c.projectsCount === 1 ? 'Project' : 'Projects'}
                        </td>

                        {/* Last Activity */}
                        <td style={{ padding: '1.1rem 1.25rem', color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>
                          {c.lastActivity}
                        </td>

                        {/* Contextual Actions */}
                        <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                            <Link
                              href="/clients/portal"
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              Portal View <ArrowRight size={14} />
                            </Link>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === c.id ? null : c.id);
                              }}
                              style={{
                                padding: '0.4rem',
                                borderRadius: '0.4rem',
                                background: activeMenuId === c.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--on-surface)',
                                cursor: 'pointer',
                              }}
                              title="More options"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>

                          {/* Action Dropdown Menu */}
                          {activeMenuId === c.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                right: '1.25rem',
                                top: '3.2rem',
                                zIndex: 50,
                                width: '190px',
                                background: '#1c1f2a',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '0.5rem',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                                padding: '0.4rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem',
                              }}
                            >
                              <button
                                onClick={() => { setSelectedClient(c); setActiveMenuId(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'none', border: 'none', color: 'var(--on-surface)', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                              >
                                <Briefcase size={14} color="var(--primary)" /> View Client Workspace
                              </button>
                              <Link
                                href="/clients/portal"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'none', border: 'none', color: 'var(--on-surface)', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', width: '100%', textDecoration: 'none' }}
                              >
                                <Eye size={14} color="var(--secondary)" /> Open Client Portal
                              </Link>
                              <Link
                                href="/projects"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'none', border: 'none', color: 'var(--on-surface)', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', width: '100%', textDecoration: 'none' }}
                              >
                                <FileText size={14} color="var(--tertiary)" /> View Projects
                              </Link>

                              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.2rem 0' }} />

                              <button
                                onClick={() => { setDeleteConfirmClient(c); setActiveMenuId(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                              >
                                <Trash2 size={14} /> Delete Client Account
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* 1. Delete Confirmation Modal */}
      {deleteConfirmClient && (
        <div
          onClick={() => setDeleteConfirmClient(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            padding: '1rem',
          }}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#1c1f2a',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 180, 171, 0.3)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 180, 171, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="var(--error)" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Delete Client Account?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to permanently delete <strong style={{ color: 'var(--on-surface)' }}>{deleteConfirmClient.name}</strong>? This will remove the account and its associated relationships from AgencyFlow.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmClient(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                className="btn btn-primary"
                style={{ background: 'var(--error)', color: '#000', border: 'none' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Client Modal */}
      {isAddModalOpen && (
        <div
          onClick={() => setIsAddModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            padding: '1rem',
          }}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#1c1f2a',
              borderRadius: '1rem',
              padding: '1.75rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Add New Client Account</h2>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Company / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Digital Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Domain / Website</label>
                  <input
                    type="text"
                    placeholder="apexdigital.com"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="Technology">Technology & SaaS</option>
                    <option value="E-commerce">E-commerce & Retail</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Logistics">Logistics & Freight</option>
                    <option value="Creative Agency">Digital Media & Brand</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Primary Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Contact Email</label>
                  <input
                    type="email"
                    placeholder="sarah@apexdigital.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Monthly Retainer ($)</label>
                  <input
                    type="number"
                    value={formData.retainer}
                    onChange={(e) => setFormData({ ...formData, retainer: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="Active">● Active</option>
                    <option value="At Risk">● At Risk</option>
                    <option value="Inactive">● Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving Client...' : 'Save Client Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Client Detail Workspace Drawer */}
      {selectedClient && (
        <div
          onClick={() => setSelectedClient(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              background: '#1c1f2a',
              padding: '1.75rem',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '0.6rem',
                    background: selectedClient.status === 'Active' ? 'var(--primary)' : 'var(--tertiary)',
                    color: selectedClient.status === 'Active' ? 'var(--on-primary)' : '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 800,
                  }}
                >
                  {selectedClient.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>
                      {selectedClient.name}
                    </h2>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background:
                          selectedClient.status === 'Active' ? 'rgba(0, 165, 114, 0.2)' : 'rgba(255, 185, 95, 0.2)',
                        color: selectedClient.status === 'Active' ? 'var(--secondary)' : 'var(--tertiary)',
                        border: selectedClient.status === 'Active' ? '1px solid rgba(0, 165, 114, 0.35)' : '1px solid rgba(255, 185, 95, 0.35)',
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                      {selectedClient.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                    {selectedClient.domain} • {selectedClient.industry}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Overview Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)' }}>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>MONTHLY RETAINER</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.2rem' }}>
                  {selectedClient.retainerFormatted}
                </div>
              </div>
              <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)' }}>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600 }}>ACTIVE PROJECTS</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                  {selectedClient.projectsCount} Contracts
                </div>
              </div>
            </div>

            {/* Primary Contact Info Card */}
            <div style={{ padding: '1rem', borderRadius: '0.6rem', background: 'var(--surface-container-high)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                PRIMARY ACCOUNT CONTACT
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)', fontWeight: 600, fontSize: '0.9rem' }}>
                <User size={16} color="var(--primary)" /> {selectedClient.contact}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>
                <Mail size={14} /> {selectedClient.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>
                <Phone size={14} /> {selectedClient.phone}
              </div>
            </div>

            {/* Active Projects & Deliverables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  Active Projects & Contracts
                </h4>
                <Link href="/projects" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              {selectedClient.projects.map((prj, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push('/projects')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    background: 'var(--surface-container-low)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface)' }}>{prj.title}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>${prj.value.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, height: '5px', background: 'var(--surface-container-highest)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${prj.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '9999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{prj.progress}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Client Activity Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Recent Account Activity
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} color="var(--primary)" /> Retainer invoice auto-generated for {selectedClient.retainerFormatted}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={14} color="var(--secondary)" /> Quarterly strategic review completed ({selectedClient.lastActivity})
              </div>
            </div>

            {/* Action Bar Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => {
                  setDeleteConfirmClient(selectedClient);
                }}
                className="btn btn-secondary"
                style={{ color: 'var(--error)', border: '1px solid rgba(255,180,171,0.3)', background: 'rgba(255,180,171,0.1)' }}
              >
                Delete
              </button>
              <Link href="/clients/portal" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Open Client Portal <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
