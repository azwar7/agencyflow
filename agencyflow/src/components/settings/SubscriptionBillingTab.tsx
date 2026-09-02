'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Users,
  Database,
  Sparkles,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

interface SubscriptionBillingTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SubscriptionBillingTab({ currentUserRole = 'MEMBER', showToast }: SubscriptionBillingTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/settings/billing-usage');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="skeleton-pulse" style={{ height: '140px', borderRadius: '12px' }} />
        <div className="skeleton-pulse" style={{ height: '240px', borderRadius: '12px' }} />
      </div>
    );
  }

  const { workspace, usage, paymentConnector } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={18} color="#8b5cf6" /> Subscription & Resource Usage
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
          Real resource consumption metrics across team seats, database entities, and AI executions.
        </p>
      </div>

      {/* 1. Plan Overview Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(56, 189, 248, 0.1))',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Workspace Tier
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0.25rem 0' }}>
            {workspace.tierName}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Organization: <strong>{workspace.name}</strong> • Active since {new Date(workspace.memberSince).toLocaleDateString()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '20px', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
          <CheckCircle2 size={15} /> Active Workspace
        </div>
      </div>

      {/* 2. Real Resource Consumption Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          Live Workspace Metrics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          
          {/* Team Seats */}
          <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
              <Users size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>Team Members</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: '0.5rem 0 0.2rem 0' }}>
              {usage.teamMembers.current}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active seat licenses</span>
          </div>

          {/* CRM Records */}
          <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
              <Database size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>CRM Records</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: '0.5rem 0 0.2rem 0' }}>
              {usage.crmRecords.total}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {usage.crmRecords.leads} leads • {usage.crmRecords.deals} deals • {usage.crmRecords.contacts} contacts
            </span>
          </div>

          {/* AI Executions */}
          <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>AI Executions</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: '0.5rem 0 0.2rem 0' }}>
              {usage.aiAutomation.totalAnalyses}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {usage.aiAutomation.outreachSent} outreach emails dispatched
            </span>
          </div>

          {/* File Storage */}
          <div style={{ background: 'var(--surface-container)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
              <HardDrive size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>Storage Assets</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: '0.5rem 0 0.2rem 0' }}>
              {usage.storage.fileCount}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              ~{Math.round(usage.storage.estimatedBytes / 1024)} KB indexed
            </span>
          </div>
        </div>
      </div>

      {/* 3. External Payment Gateway Callout */}
      <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            {paymentConnector.label}
          </h4>
          <span style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', padding: '2px 10px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
            Future Integration Connector
          </span>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
          {paymentConnector.note} AgencyFlow operates with unmetered access under your self-hosted database instance. When SaaS billing connectors are released, webhook endpoints will link here.
        </p>
      </div>
    </div>
  );
}
