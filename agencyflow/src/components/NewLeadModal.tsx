'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Sparkles, CheckCircle2, Bot, Search, MapPin, Globe, Loader2, ArrowRight } from 'lucide-react';
import { useLeadFinder } from '@/context/LeadFinderContext';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: 'manual' | 'n8n';
}

export function NewLeadModal({ isOpen, onClose, onSuccess, initialTab = 'manual' }: NewLeadModalProps) {
  const { isJobRunning, startJob, activeJob } = useLeadFinder();
  const [activeTab, setActiveTab] = useState<'manual' | 'n8n'>(initialTab);

  // Manual Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    source: 'Website Inbound',
  });

  // n8n Finder Form State
  const [finderData, setFinderData] = useState({
    query: 'Gyms & Fitness Centers',
    location: 'Peshawar, Pakistan',
    webhookUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Dynamic CRM Settings & Custom Fields
  const [availableSources, setAvailableSources] = useState<string[]>([
    'Website Inbound',
    'LinkedIn Outreach',
    'Cold Email',
    'Client Referral',
    'Strategic Partner',
    'Paid Search / Ads',
  ]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  // Fetch dynamic lead sources and custom fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError('');
      setSuccessToast('');
      // 1. Fetch sources
      fetch('/api/v1/settings/crm-defaults')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.leadSources) {
            setAvailableSources(json.data.leadSources);
          }
        })
        .catch(() => {});

      // 2. Fetch custom fields for LEAD
      fetch('/api/v1/settings/custom-fields?entityType=LEAD')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setCustomFields(json.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Handle Escape key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and Last name are required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customFields: customValues,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create lead.');
      }

      setSuccessToast(`Lead for ${formData.firstName} ${formData.lastName} created successfully!`);
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        source: 'Website Inbound',
      });

      onSuccess();

      setTimeout(() => {
        setSuccessToast('');
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('New Lead Creation Error:', err);
      setError(err.message || 'Unable to create lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleN8nTriggerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!finderData.query.trim()) {
      setError('Please specify a business category or industry query.');
      return;
    }
    if (!finderData.location.trim()) {
      setError('Please specify a target city or geographic location.');
      return;
    }

    if (isJobRunning) {
      setError('A lead search is already running in your workspace. Please check the bottom-right status widget.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await startJob(
        finderData.query,
        finderData.location,
        finderData.webhookUrl || undefined
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to trigger AI Lead Finder.');
      }

      setSuccessToast('🚀 AI Lead Finder started in background! You can close this modal or continue working.');

      setTimeout(() => {
        setSuccessToast('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('n8n Trigger Error:', err);
      setError(err.message || 'Unable to trigger AI Lead Finder. Ensure webhook is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          background: '#1c1f2a',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-container-high)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: activeTab === 'n8n' ? 'rgba(111, 251, 190, 0.15)' : 'rgba(192, 193, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {activeTab === 'n8n' ? (
                <Bot size={20} color="#6ffbbe" />
              ) : (
                <UserPlus size={18} color="var(--primary)" />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                {activeTab === 'n8n' ? 'Find Leads with AI' : 'Create New Inbound Lead'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                {activeTab === 'n8n'
                  ? 'Automated multi-source lead search, enrichment & AI qualification'
                  : 'Add lead manually to trigger AI scoring & pipeline tracking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}
            title="Close modal (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2-Option Mode Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--surface-container-low)',
            padding: '0.4rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setError('');
            }}
            style={{
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'manual' ? 'var(--surface-container-high)' : 'transparent',
              color: activeTab === 'manual' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'manual' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <UserPlus size={16} /> Add Manually
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('n8n');
              setError('');
            }}
            style={{
              padding: '0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === 'n8n' ? '1px solid rgba(111, 251, 190, 0.3)' : 'none',
              background: activeTab === 'n8n' ? 'rgba(111, 251, 190, 0.12)' : 'transparent',
              color: activeTab === 'n8n' ? '#6ffbbe' : 'var(--on-surface-variant)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'n8n' ? '0 2px 8px rgba(111, 251, 190, 0.15)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} /> ⚡ Find Leads with AI
          </button>
        </div>

        {/* Form Body */}
        {activeTab === 'manual' ? (
          /* MANUAL FORM */
          <form
            onSubmit={handleManualSubmit}
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 180, 171, 0.15)',
                  border: '1px solid rgba(255, 180, 171, 0.3)',
                  color: 'var(--error)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {successToast && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(78, 222, 163, 0.15)',
                  border: '1px solid rgba(78, 222, 163, 0.3)',
                  color: 'var(--secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={18} color="var(--secondary)" /> {successToast}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                  First Name <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Sarah"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--on-surface)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                  Last Name <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Jenkins"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--on-surface)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                Work Email Address <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah@company.com"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--on-surface)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Apex Digital"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--on-surface)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--on-surface)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                Acquisition Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--on-surface)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {availableSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Custom Fields Section */}
            {customFields.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c4b5fd' }}>
                  Custom Fields ({customFields.length})
                </span>
                {customFields.map((f) => (
                  <div key={f.id}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--on-surface-variant)' }}>
                      {f.name} {f.isRequired && <span style={{ color: 'var(--error)' }}>*</span>}
                    </label>

                    {f.fieldType === 'DROPDOWN' && f.options ? (
                      <select
                        required={f.isRequired}
                        value={customValues[f.key] || ''}
                        onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="">Select an option...</option>
                        {f.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : f.fieldType === 'CHECKBOX' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(customValues[f.key])}
                          onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                        />
                        {f.placeholder || f.name}
                      </label>
                    ) : f.fieldType === 'DATE' ? (
                      <input
                        type="date"
                        required={f.isRequired}
                        value={customValues[f.key] || ''}
                        onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    ) : f.fieldType === 'NUMBER' || f.fieldType === 'CURRENCY' ? (
                      <input
                        type="number"
                        required={f.isRequired}
                        placeholder={f.placeholder || '0'}
                        value={customValues[f.key] || ''}
                        onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    ) : (
                      <input
                        type="text"
                        required={f.isRequired}
                        placeholder={f.placeholder || ''}
                        value={customValues[f.key] || ''}
                        onChange={(e) => setCustomValues({ ...customValues, [f.key]: e.target.value })}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {loading ? 'Creating Lead...' : <><Sparkles size={16} /> Save Lead & Auto-Score</>}
              </button>
            </div>
          </form>
        ) : (
          /* n8n WORKFLOW FINDER FORM */
          <form
            onSubmit={handleN8nTriggerSubmit}
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {/* Value Proposition Box */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(111, 251, 190, 0.1) 0%, rgba(192, 193, 255, 0.05) 100%)',
                border: '1px solid rgba(111, 251, 190, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Bot size={18} color="#6ffbbe" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6ffbbe' }}>
                  Autonomous AI Lead Discovery & Qualification
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.4 }}>
                Searches Google Places, maps directories & business web listings, scrapes company data, scores ICP fit with Gemini AI, and ingests leads directly into AgencyFlow.
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 180, 171, 0.15)',
                  border: '1px solid rgba(255, 180, 171, 0.3)',
                  color: 'var(--error)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {successToast && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(78, 222, 163, 0.15)',
                  border: '1px solid rgba(78, 222, 163, 0.3)',
                  color: 'var(--secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={18} color="var(--secondary)" /> {successToast}
              </div>
            )}

            {/* Target Category / Query */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                <Search size={14} color="#6ffbbe" /> Business Category / Keyword <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                required
                type="text"
                value={finderData.query}
                onChange={(e) => setFinderData({ ...finderData, query: e.target.value })}
                placeholder="e.g. Gyms & Fitness Centers, Pizza Places, Dental Clinics"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--on-surface)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem', display: 'block' }}>
                Used in Places API and Google search filters.
              </span>
            </div>

            {/* Target Location */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                <MapPin size={14} color="#6ffbbe" /> Target City / Location <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                required
                type="text"
                value={finderData.location}
                onChange={(e) => setFinderData({ ...finderData, location: e.target.value })}
                placeholder="e.g. Peshawar, Pakistan or London, UK"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--on-surface)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Optional Custom Webhook URL */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--on-surface-variant)' }}>
                <Globe size={14} /> n8n Webhook URL (Optional override)
              </label>
              <input
                type="url"
                value={finderData.webhookUrl}
                onChange={(e) => setFinderData({ ...finderData, webhookUrl: e.target.value })}
                placeholder="https://your-n8n.app.n8n.cloud/webhook/find-leads"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  background: 'var(--surface-container-high)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--on-surface)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem', display: 'block' }}>
                Defaults to <code style={{ color: 'var(--primary)' }}>N8N_WEBHOOK_URL</code> in your CRM settings.
              </span>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isJobRunning}
                className="btn btn-primary"
                style={{
                  background: isJobRunning
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'linear-gradient(135deg, #4edea3 0%, #6ffbbe 100%)',
                  color: isJobRunning ? 'var(--on-surface-variant)' : '#0a2318',
                  fontWeight: 700,
                  border: isJobRunning ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isJobRunning ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" /> Starting AI Search...
                  </>
                ) : isJobRunning ? (
                  <>
                    <Loader2 size={16} className="spin" color="#38bdf8" /> ⚡ Workflow Already Running...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> 🚀 Run AI Lead Finder
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
