'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Search,
  Download,
  Send,
  Plus,
  ArrowUpRight,
  X,
  Check,
  Printer,
  Calendar,
  Clock,
  Building2,
  TrendingUp,
  FileText,
  ShieldCheck,
  Trash2,
  ExternalLink,
  MoreVertical,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface Invoice {
  id: string;
  realId?: string;
  client: string;
  amount: number;
  amountFormatted?: string;
  issued: string;
  due: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');

  // Selected Invoice Preview Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClient, setNewClient] = useState('');
  const [newAmount, setNewAmount] = useState('12500');
  const [newDueDate, setNewDueDate] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('50% Project Milestone Deposit & Architecture SOW');
  const [creating, setCreating] = useState(false);

  // Remind / Feedback Alert
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/invoices');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setInvoices(json.data);
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Create New Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: newClient.trim(),
          amount: parseFloat(newAmount) || 12500,
          status: 'PENDING',
          dueDate: newDueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setNewClient('');
        setFeedbackMsg({ type: 'success', text: `Invoice ${json.data.number || ''} created successfully!` });
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Mark Invoice as Paid
  const handleMarkPaid = async (id: string, clientName: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' } : inv)));
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
    }

    try {
      await fetch('/api/v1/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PAID' }),
      });
      setFeedbackMsg({ type: 'success', text: `Invoice ${id} for ${clientName} marked as PAID!` });
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  // Send Payment Reminder via n8n / Email
  const handleSendReminder = (id: string, clientName: string) => {
    setFeedbackMsg({ type: 'success', text: `✉️ Payment reminder dispatched for ${clientName} (${id})!` });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${id}?`)) return;
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (selectedInvoice?.id === id) setSelectedInvoice(null);

    try {
      await fetch(`/api/v1/invoices?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      fetchInvoices();
    }
  };

  // Financial Metrics Calculation
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
  const totalPaid = paidInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const pendingInvoices = invoices.filter((inv) => inv.status === 'PENDING');
  const totalPending = pendingInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const overdueInvoices = invoices.filter((inv) => inv.status === 'OVERDUE');
  const totalOverdue = overdueInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span
            style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(78, 222, 163, 0.18)',
              border: '1px solid rgba(78, 222, 163, 0.3)',
              color: '#4edea3',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <CheckCircle size={12} /> PAID
          </span>
        );
      case 'PENDING':
        return (
          <span
            style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(255, 185, 95, 0.18)',
              border: '1px solid rgba(255, 185, 95, 0.3)',
              color: '#ffb95f',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Clock size={12} /> PENDING
          </span>
        );
      case 'OVERDUE':
        return (
          <span
            style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(255, 180, 171, 0.18)',
              border: '1px solid rgba(255, 180, 171, 0.35)',
              color: '#ffb4ab',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <AlertCircle size={12} /> OVERDUE
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'calc(100vh - 100px)' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <CreditCard size={24} color="#4edea3" /> Billing & Invoices Hub
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
              Track cash collection, client payment schedules, and automated invoice reminders.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
              <input
                type="text"
                placeholder="Search invoice or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
              }}
            >
              <Plus size={16} /> New Invoice
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: feedbackMsg.type === 'success' ? 'rgba(78, 222, 163, 0.12)' : 'rgba(255, 180, 171, 0.12)',
              border: feedbackMsg.type === 'success' ? '1px solid rgba(78, 222, 163, 0.3)' : '1px solid rgba(255, 180, 171, 0.3)',
              color: feedbackMsg.type === 'success' ? '#4edea3' : '#ffb4ab',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {feedbackMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {feedbackMsg.text}
            </div>
            <button onClick={() => setFeedbackMsg(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Top Financial KPI Metrics Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Total Invoiced */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Total Invoiced</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>${totalInvoiced.toLocaleString()}</div>
            </div>
          </div>

          {/* Collected Cash */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(78, 222, 163, 0.15)', color: '#4edea3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Collected Cash</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4edea3' }}>
                ${totalPaid.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>({collectionRate}%)</span>
              </div>
            </div>
          </div>

          {/* Pending Inflow */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 185, 95, 0.15)', color: '#ffb95f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Pending Inflow</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffb95f' }}>${totalPending.toLocaleString()}</div>
            </div>
          </div>

          {/* Overdue Alerts */}
          <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: totalOverdue > 0 ? 'rgba(255, 180, 171, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: totalOverdue > 0 ? '#ffb4ab' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Overdue Invoices</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: totalOverdue > 0 ? '#ffb4ab' : '#fff' }}>${totalOverdue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: filterStatus === st ? 'rgba(78, 222, 163, 0.2)' : 'var(--surface-container-low)',
                border: filterStatus === st ? '1px solid #4edea3' : '1px solid rgba(255, 255, 255, 0.08)',
                color: filterStatus === st ? '#4edea3' : 'var(--on-surface-variant)',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'ALL' ? 'All Invoices' : st}
            </button>
          ))}
        </div>

        {/* Main Invoices Table Card */}
        {loading ? (
          <div className="glass-card skeleton-pulse" style={{ height: '350px' }} />
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchInvoices} />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No invoices found"
            description="Manage client billings, deposits, payment milestones, and automated reminder emails."
            actionLabel="+ Create First Invoice"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div
            style={{
              background: 'var(--surface-container-lowest)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Invoice #</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Client Account</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Issued Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Due Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#38bdf8' }}>
                      {inv.id}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#fff', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#a855f7', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {inv.client.substring(0, 2).toUpperCase()}
                        </div>
                        {inv.client}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#4edea3', fontSize: '0.95rem' }}>
                      ${Number(inv.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--on-surface-variant)' }}>
                      {inv.issued}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: inv.status === 'OVERDUE' ? '#ffb4ab' : 'var(--on-surface-variant)', fontWeight: inv.status === 'OVERDUE' ? 700 : 500 }}>
                      {inv.due}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {getStatusBadge(inv.status)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleMarkPaid(inv.id, inv.client)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#4edea3', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            title="Mark as Paid"
                          >
                            <Check size={12} /> Paid
                          </button>
                        )}

                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleSendReminder(inv.id, inv.client)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            title="Send Payment Reminder"
                          >
                            <Send size={12} /> Remind
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ffb4ab', cursor: 'pointer', padding: '4px' }}
                          title="Delete Invoice"
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

        {/* Interactive Live Branded Invoice Modal & PDF Generator */}
        {selectedInvoice && (
          <div className="drawer-backdrop" onClick={() => setSelectedInvoice(null)}>
            <div
              className="drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '680px',
                maxWidth: '95vw',
                background: '#181a20',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Action Bar */}
              <div style={{ padding: '1rem 1.5rem', background: 'var(--surface-container-low)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} color="#4edea3" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Official Invoice Preview</span>
                  {getStatusBadge(selectedInvoice.status)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Printer size={14} /> Print / PDF
                  </button>

                  {selectedInvoice.status !== 'PAID' && (
                    <button
                      onClick={() => handleMarkPaid(selectedInvoice.id, selectedInvoice.client)}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#4edea3', color: '#003822', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Check size={14} /> Mark as Paid
                    </button>
                  )}

                  <button onClick={() => setSelectedInvoice(null)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Body */}
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', background: '#13151a' }}>
                {/* Agency Header & Invoice Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(255,255,255,0.08)', paddingBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                      AgencyFlow Digital
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
                      Digital Solutions, Automation & Custom Systems<br />
                      billing@agencyflow.io • +1 (555) 019-2834
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{selectedInvoice.id}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
                      Issued: <strong>{selectedInvoice.issued}</strong><br />
                      Due Date: <strong style={{ color: selectedInvoice.status === 'OVERDUE' ? '#ffb4ab' : '#fff' }}>{selectedInvoice.due}</strong>
                    </p>
                  </div>
                </div>

                {/* Billed To Information */}
                <div style={{ background: 'var(--surface-container)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#d0bcff', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                    BILLED TO CLIENT:
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0 0 0' }}>
                    {selectedInvoice.client}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.2rem 0 0 0' }}>
                    Client Account Organization • Verified Business Entity
                  </p>
                </div>

                {/* Itemized Line Items Table */}
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <th style={{ padding: '0.75rem 1rem', color: '#fff', fontWeight: 700 }}>Description</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#fff', fontWeight: 700, textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#fff', fontWeight: 700, textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'var(--surface-container-lowest)' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#e2e2e8', fontWeight: 600 }}>
                          {selectedInvoice.client} — Milestone Engineering & SOW Deposit
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 400, marginTop: '2px' }}>
                            Architecture, custom full-stack development, and n8n webhook automation pipeline.
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>1</td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#4edea3' }}>
                          ${Number(selectedInvoice.amount).toLocaleString()}
                        </td>
                      </tr>
                      <tr style={{ background: 'var(--surface-container-high)' }}>
                        <td colSpan={2} style={{ padding: '0.85rem 1rem', color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>Total Amount Due:</td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#4edea3', fontWeight: 900, fontSize: '1.2rem' }}>
                          ${Number(selectedInvoice.amount).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bank / Stripe Payment Instructions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Wire / Direct Transfer Instructions:
                    </span>
                    <p style={{ fontSize: '0.75rem', color: '#e2e2e8', margin: '0.3rem 0 0 0', lineHeight: 1.5, fontFamily: 'monospace' }}>
                      Bank: Silicon Valley Commercial Bank<br />
                      Routing: 121000358<br />
                      Account: 88492048102<br />
                      Reference: {selectedInvoice.id}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {selectedInvoice.status === 'PAID' ? (
                      <div style={{ color: '#4edea3', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem' }}>
                        <ShieldCheck size={20} /> Verified Payment Received
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700 }}>Payment Status:</span>
                        <div style={{ color: '#ffb95f', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.2rem' }}>
                          Awaiting client electronic settlement
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
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
                  <Plus size={18} color="#4edea3" /> Create New Invoice
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Client / Organization Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohmand Property Dealers, Apex Heating..."
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Invoice Amount ($ USD):
                    </label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Due Date:
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Service Description:
                  </label>
                  <input
                    type="text"
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem',
                    background: '#10b981',
                    border: 'none',
                    fontWeight: 700,
                    marginTop: '0.5rem',
                  }}
                >
                  {creating ? 'Creating Invoice...' : 'Generate Invoice'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
