'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Save,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Send,
} from 'lucide-react';

interface EmailOutreachTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export function EmailOutreachTab({ currentUserRole = 'MEMBER', showToast }: EmailOutreachTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [emailSenderName, setEmailSenderName] = useState('');
  const [emailReplyTo, setEmailReplyTo] = useState('');
  const [emailSignature, setEmailSignature] = useState('');
  const [outreachDailyLimit, setOutreachDailyLimit] = useState(50);
  const [outreachSendingHoursStart, setOutreachSendingHoursStart] = useState('09:00');
  const [outreachSendingHoursEnd, setOutreachSendingHoursEnd] = useState('18:00');
  const [outreachSendingDays, setOutreachSendingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [outreachDelayBetweenEmails, setOutreachDelayBetweenEmails] = useState(30);
  const [outreachDefaultSenderAccount, setOutreachDefaultSenderAccount] = useState('GMAIL_SMTP');

  // Usage Meter
  const [sentToday, setSentToday] = useState(0);
  const [remainingToday, setRemainingToday] = useState(50);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/settings/email-outreach');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setEmailSenderName(d.emailSenderName || '');
        setEmailReplyTo(d.emailReplyTo || '');
        setEmailSignature(d.emailSignature || '');
        setOutreachDailyLimit(d.outreachDailyLimit ?? 50);
        setOutreachSendingHoursStart(d.outreachSendingHoursStart || '09:00');
        setOutreachSendingHoursEnd(d.outreachSendingHoursEnd || '18:00');
        setOutreachSendingDays(d.outreachSendingDays || [1, 2, 3, 4, 5]);
        setOutreachDelayBetweenEmails(d.outreachDelayBetweenEmails ?? 30);
        setOutreachDefaultSenderAccount(d.outreachDefaultSenderAccount || 'GMAIL_SMTP');

        setSentToday(d.sentToday ?? 0);
        setRemainingToday(d.remainingToday ?? 50);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading outreach settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDayToggle = (dayId: number) => {
    if (!isOwnerOrAdmin) return;
    if (outreachSendingDays.includes(dayId)) {
      if (outreachSendingDays.length === 1) {
        showToast('At least one sending day must be selected.', 'error');
        return;
      }
      setOutreachSendingDays(outreachSendingDays.filter((d) => d !== dayId));
    } else {
      setOutreachSendingDays([...outreachSendingDays, dayId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;

    try {
      setSaving(true);
      const res = await fetch('/api/v1/settings/email-outreach', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSenderName: emailSenderName.trim() || null,
          emailReplyTo: emailReplyTo.trim() || null,
          emailSignature: emailSignature.trim() || null,
          outreachDailyLimit: Number(outreachDailyLimit),
          outreachSendingHoursStart,
          outreachSendingHoursEnd,
          outreachSendingDays,
          outreachDelayBetweenEmails: Number(outreachDelayBetweenEmails),
          outreachDefaultSenderAccount,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Email preferences & outreach sending rules saved.');
        fetchData();
      } else {
        showToast(json.error?.message || 'Failed to save settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const usagePercent = Math.min(100, Math.round((sentToday / outreachDailyLimit) * 100));

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Email Communication & Outreach Rules
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Sender identity branding, daily delivery caps, sending windows, and anti-spam delivery spacing.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !isOwnerOrAdmin}
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            border: 'none',
            padding: '0.55rem 1.15rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Outreach Rules'}
        </button>
      </div>

      {/* 1. Today's Delivery Usage Card */}
      <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Today's Dispatch Quota
          </span>
          <span style={{ fontSize: '0.8rem', color: '#c4b5fd', fontWeight: 600 }}>
            {sentToday} of {outreachDailyLimit} sent ({remainingToday} remaining today)
          </span>
        </div>

        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${usagePercent}%`,
              height: '100%',
              background: usagePercent > 90 ? '#ef4444' : 'linear-gradient(90deg, #8b5cf6, #38bdf8)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 2. Sender Identity & Signatures */}
      <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Mail size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Sender Identity & Branding
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Default Sender Display Name
            </label>
            <input
              type="text"
              disabled={!isOwnerOrAdmin}
              placeholder="e.g. Alex Sterling | Apex Growth"
              value={emailSenderName}
              onChange={(e) => setEmailSenderName(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Default Reply-To Address
            </label>
            <input
              type="email"
              disabled={!isOwnerOrAdmin}
              placeholder="e.g. proposals@agencyflow.io"
              value={emailReplyTo}
              onChange={(e) => setEmailReplyTo(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
            Agency Email Signature (Appended to Outbound Outreach)
          </label>
          <textarea
            rows={3}
            disabled={!isOwnerOrAdmin}
            placeholder="Best regards,&#10;The AgencyFlow Team | agencyflow.io"
            value={emailSignature}
            onChange={(e) => setEmailSignature(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* 3. Outreach Sending Constraints */}
      <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Clock size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Delivery Window & Anti-Spam Constraints
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Daily Sending Limit (Max / Day)
            </label>
            <input
              type="number"
              min={1}
              max={5000}
              disabled={!isOwnerOrAdmin}
              value={outreachDailyLimit}
              onChange={(e) => setOutreachDailyLimit(Number(e.target.value))}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Sending Hours (Start - End)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="time"
                disabled={!isOwnerOrAdmin}
                value={outreachSendingHoursStart}
                onChange={(e) => setOutreachSendingHoursStart(e.target.value)}
                style={{ flex: 1, padding: '0.55rem 0.5rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
              <span style={{ color: '#64748b' }}>to</span>
              <input
                type="time"
                disabled={!isOwnerOrAdmin}
                value={outreachSendingHoursEnd}
                onChange={(e) => setOutreachSendingHoursEnd(e.target.value)}
                style={{ flex: 1, padding: '0.55rem 0.5rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
              Delay Between Emails (Seconds)
            </label>
            <input
              type="number"
              min={0}
              max={3600}
              disabled={!isOwnerOrAdmin}
              value={outreachDelayBetweenEmails}
              onChange={(e) => setOutreachDelayBetweenEmails(Number(e.target.value))}
              style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Active Sending Days */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.5rem' }}>
            Active Outreach Delivery Days
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {DAYS_OF_WEEK.map((d) => {
              const active = outreachSendingDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDayToggle(d.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
                    background: active ? 'rgba(139, 92, 246, 0.2)' : 'var(--surface-container-lowest)',
                    color: active ? '#fff' : '#94a3b8',
                    fontWeight: active ? 700 : 500,
                    cursor: isOwnerOrAdmin ? 'pointer' : 'not-allowed',
                    fontSize: '0.8rem',
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
}
