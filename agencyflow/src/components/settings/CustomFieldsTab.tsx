'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface CustomFieldItem {
  id: string;
  entityType: 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL';
  name: string;
  key: string;
  fieldType: 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'DROPDOWN' | 'MULTI_SELECT' | 'CHECKBOX' | 'URL';
  options?: string[] | null;
  placeholder?: string | null;
  description?: string | null;
  isRequired: boolean;
  order: number;
}

interface CustomFieldsTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function CustomFieldsTab({ currentUserRole = 'MEMBER', showToast }: CustomFieldsTabProps) {
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [activeEntityType, setActiveEntityType] = useState<'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL'>('LEAD');
  const [fields, setFields] = useState<CustomFieldItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldItem | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldItem['fieldType']>('TEXT');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/settings/custom-fields?entityType=${activeEntityType}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFields(json.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading custom fields', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeEntityType, showToast]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // Open Modal
  const openNewFieldModal = () => {
    setEditingField(null);
    setFieldName('');
    setFieldType('TEXT');
    setFieldOptions('');
    setFieldPlaceholder('');
    setFieldDescription('');
    setFieldRequired(false);
    setIsModalOpen(true);
  };

  const openEditModal = (f: CustomFieldItem) => {
    setEditingField(f);
    setFieldName(f.name);
    setFieldType(f.fieldType);
    setFieldOptions(f.options ? f.options.join(', ') : '');
    setFieldPlaceholder(f.placeholder || '');
    setFieldDescription(f.description || '');
    setFieldRequired(f.isRequired);
    setIsModalOpen(true);
  };

  // Save Field
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;

    const parsedOptions =
      fieldType === 'DROPDOWN' || fieldType === 'MULTI_SELECT'
        ? fieldOptions
            .split(',')
            .map((o) => o.trim())
            .filter((o) => o.length > 0)
        : undefined;

    try {
      setSaving(true);
      const url = editingField
        ? `/api/v1/settings/custom-fields/${editingField.id}`
        : `/api/v1/settings/custom-fields`;

      const method = editingField ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: activeEntityType,
          name: fieldName.trim(),
          fieldType,
          options: parsedOptions,
          placeholder: fieldPlaceholder.trim() || undefined,
          description: fieldDescription.trim() || undefined,
          isRequired: fieldRequired,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Custom field saved.');
        setIsModalOpen(false);
        fetchFields();
      } else {
        showToast(json.error?.message || 'Failed to save field', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Field
  const handleDeleteField = async (fieldId: string, name: string) => {
    if (!confirm(`Delete custom field '${name}'? All stored values for this field across ${activeEntityType}s will be deleted.`)) return;

    try {
      const res = await fetch(`/api/v1/settings/custom-fields/${fieldId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchFields();
      } else {
        showToast(json.error?.message || 'Failed to delete field', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'CURRENCY':
      case 'NUMBER':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'DATE':
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
      case 'DROPDOWN':
      case 'MULTI_SELECT':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' };
      case 'CHECKBOX':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Custom Fields & Data Schema
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
            Entity-Attribute-Value (EAV) schema: Custom properties render directly in CRM intake forms and deal drawers.
          </p>
        </div>

        <button
          onClick={openNewFieldModal}
          disabled={!isOwnerOrAdmin}
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <Plus size={16} /> Add Custom Field
        </button>
      </div>

      {/* Entity Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-container)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
        {(['LEAD', 'DEAL', 'CONTACT', 'COMPANY'] as const).map((ent) => (
          <button
            key={ent}
            onClick={() => setActiveEntityType(ent)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '6px',
              background: activeEntityType === ent ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeEntityType === ent ? '#fff' : '#94a3b8',
              fontWeight: activeEntityType === ent ? 700 : 500,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {ent}S
          </button>
        ))}
      </div>

      {/* Fields Table */}
      <div style={{ overflowX: 'auto', background: 'var(--surface-container)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: 'var(--outline)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>FIELD LABEL</th>
              <th style={{ padding: '0.75rem 1rem' }}>ATTRIBUTE KEY</th>
              <th style={{ padding: '0.75rem 1rem' }}>DATA TYPE</th>
              <th style={{ padding: '0.75rem 1rem' }}>OPTIONS / CONFIG</th>
              <th style={{ padding: '0.75rem 1rem' }}>REQUIRED</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  Loading custom fields...
                </td>
              </tr>
            ) : fields.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  No custom fields defined for {activeEntityType}s yet. Click "+ Add Custom Field" to create one.
                </td>
              </tr>
            ) : (
              fields.map((f) => {
                const badge = getTypeBadgeColor(f.fieldType);
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#fff' }}>
                      {f.name}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#a78bfa', fontSize: '0.8rem' }}>
                      {f.key}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: badge.bg, color: badge.color }}>
                        {f.fieldType}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                      {f.options && f.options.length > 0 ? (
                        <span>{f.options.join(', ')}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      {f.isRequired ? (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          REQUIRED
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Optional</span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {isOwnerOrAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => openEditModal(f)}
                            style={{ padding: '0.35rem 0.6rem', background: 'rgba(255, 255, 255, 0.06)', border: 'none', borderRadius: '4px', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteField(f.id, f.name)}
                            style={{ padding: '0.35rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CUSTOM FIELD */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 7, 14, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#161922', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                {editingField ? `Edit Field: ${editingField.name}` : `Add Custom Field for ${activeEntityType}s`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveField} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                  Field Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Budget, Tech Stack"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              {!editingField && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Data Type *
                  </label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as any)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="TEXT">Short Text (Single Line)</option>
                    <option value="LONG_TEXT">Long Text (Multi-Line Area)</option>
                    <option value="NUMBER">Number (Integer / Decimal)</option>
                    <option value="CURRENCY">Currency ($ USD)</option>
                    <option value="DATE">Calendar Date</option>
                    <option value="DROPDOWN">Dropdown (Single Select)</option>
                    <option value="MULTI_SELECT">Multi-Select Tags</option>
                    <option value="CHECKBOX">Boolean Checkbox (Yes / No)</option>
                    <option value="URL">Website / Portfolio URL</option>
                  </select>
                </div>
              )}

              {(fieldType === 'DROPDOWN' || fieldType === 'MULTI_SELECT') && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                    Selectable Options (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js, Shopify, WordPress, Webflow"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                  Placeholder Hint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enter target software budget..."
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--surface-container)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff', cursor: 'pointer', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                />
                Mandatory field (Required in creation forms)
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.45rem 1.15rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {saving ? 'Saving...' : 'Save Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
