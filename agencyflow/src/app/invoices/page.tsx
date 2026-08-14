'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
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
} from 'lucide-react';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  issued: string;
  due: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

import { EmptyState } from '@/components/EmptyState';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('15000');
  const [remindSuccess, setRemindSuccess] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/v1/invoices');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setInvoices(json.data);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error(err);
      setInvoices([]);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    try {
      await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, amount }),
      });
    } catch (err) {
      console.error(err);
    }

    const created: Invoice = {
      id: `INV-2026-0${Math.floor(Math.random() * 90) + 10}`,
      client,
      amount: parseFloat(amount) || 15000,
      issued: new Date().toISOString().split('T')[0],
      due: '2026-08-30',
      status: 'PENDING',
    };

    setInvoices([created, ...invoices]);
    setIsModalOpen(false);
    setClient('');
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await fetch('/api/v1/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PAID' }),
      });
    } catch (err) {
      console.error(err);
    }
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: 'PAID' } : inv)));
  };

  const handleSendReminder = (id: string, clientName: string) => {
    setRemindSuccess(`Payment reminder sent to ${clientName}`);
    setTimeout(() => setRemindSuccess(null), 3000);
  };

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
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(0, 165, 114, 0.2)', border: '1px solid rgba(78, 222, 163, 0.3)', color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={12} /> PAID
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(202, 129, 0, 0.2)', border: '1px solid rgba(255, 185, 95, 0.3)', color: 'var(--tertiary)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertCircle size={12} /> PENDING
          </span>
        );
      case 'OVERDUE':
        return (
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(147, 0, 10, 0.3)', border: '1px solid rgba(255, 180, 171, 0.4)', color: 'var(--error)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertCircle size={12} /> OVERDUE
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Toast Alert */}
        {remindSuccess && (
          <div style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', background: 'rgba(78, 222, 163, 0.2)', border: '1px solid rgba(78, 222, 163, 0.4)', color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> {remindSuccess}
          </div>
        )}

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>Financial Invoicing & Billing</h1>
            <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>Manage agency retainers, automated invoice generation, and revenue collection</p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
            <Plus size={18} /> Create New Invoice
          </button>
        </div>

        {/* Top Metric KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL INVOICED</p>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.4rem 0' }}>$136,000</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <ArrowUpRight size={14} /> +18.2% vs last month
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PAID RETAINERS</p>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)', margin: '0.4rem 0' }}>$79,500</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>3 invoices settled</span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>OUTSTANDING / OVERDUE</p>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--error)', margin: '0.4rem 0' }}>$56,500</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600 }}>1 overdue payment</span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1rem', background: 'var(--surface-container)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AVG DAYS TO PAY</p>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', margin: '0.4rem 0' }}>12 days</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>-3 days faster</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '0.75rem', background: 'var(--surface-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '400px', background: 'var(--surface-container-high)', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Search size={18} color="var(--on-surface-variant)" />
            <input
              type="text"
              placeholder="Search by invoice # or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '0.875rem', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterStatus === st ? 'var(--primary)' : 'var(--surface-container-high)',
                  color: filterStatus === st ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  border: 'none',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Data Table */}
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search || filterStatus !== 'ALL' ? 'No matching invoices found' : 'No invoices yet'}
            description={
              search || filterStatus !== 'ALL'
                ? 'Try adjusting your search criteria or clear status filters.'
                : 'Create invoices, manage retainer billing cycles, and record client payment transactions.'
            }
            actionLabel={search || filterStatus !== 'ALL' ? 'Clear Filters' : '+ Create First Invoice'}
            onAction={() => {
              if (search || filterStatus !== 'ALL') {
                setSearch('');
                setFilterStatus('ALL');
              } else {
                setIsModalOpen(true);
              }
            }}
          />
        ) : (
          <div className="glass-card" style={{ borderRadius: '1rem', background: 'var(--surface-container)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>INVOICE ID</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CLIENT</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AMOUNT</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ISSUED DATE</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DUE DATE</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>STATUS</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>{inv.id}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>{inv.client}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }}>${inv.amount.toLocaleString()}.00</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{inv.issued}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>{inv.due}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>{getStatusBadge(inv.status)}</td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {inv.status !== 'PAID' && (
                          <button onClick={() => handleMarkPaid(inv.id)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'rgba(78, 222, 163, 0.2)', border: '1px solid rgba(78, 222, 163, 0.3)', color: 'var(--secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => handleSendReminder(inv.id, inv.client)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Send size={14} /> Remind
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

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', background: '#1c1f2a', borderRadius: '1rem', padding: '1.75rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>Create New Invoice</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TechFlow Systems"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Invoice Amount ($)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.875rem', marginTop: '0.3rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
