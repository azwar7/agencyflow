'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DataManagementTabProps {
  currentUserRole?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function DataManagementTab({ currentUserRole = 'MEMBER', showToast }: DataManagementTabProps) {
  const isViewer = currentUserRole === 'VIEWER';
  const isOwnerOrAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // Import State
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importEntity, setImportEntity] = useState<'LEAD' | 'CONTACT'>('LEAD');
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);

  // Export State
  const [exportEntity, setExportEntity] = useState('leads');
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  // Parse CSV helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        showToast('CSV must contain at least a header row and one data row', 'error');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.replace(/^["']|["']$/g, '').trim());
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      setParsedRows(rows);
      showToast(`Parsed ${rows.length} rows from CSV`);
    } catch (err: any) {
      showToast('Error parsing CSV: ' + err.message, 'error');
    }
  };

  const handleRunImport = async () => {
    if (parsedRows.length === 0) return;

    try {
      setImporting(true);
      const res = await fetch('/api/v1/settings/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: importEntity, rows: parsedRows }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setImportSummary(json.data);
        showToast(json.message);
      } else {
        showToast(json.error?.message || 'Import failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleRunExport = async () => {
    if (isViewer) {
      showToast('Viewers do not have permission to export workspace data.', 'error');
      return;
    }

    try {
      setExporting(true);
      const url = `/api/v1/settings/data/export?entity=${exportEntity}&format=${exportFormat}`;
      window.location.href = url;
      showToast(`Exporting ${exportEntity.toUpperCase()} as ${exportFormat.toUpperCase()}...`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* 1. CSV DATA IMPORT WIZARD */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={18} color="#10b981" /> CSV Data Import Engine
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Batch import prospective leads or contacts. Duplicates are automatically evaluated against workspace duplicate rules.
          </p>
        </div>

        <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Target Entity
              </label>
              <select
                value={importEntity}
                onChange={(e) => setImportEntity(e.target.value as any)}
                style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="LEAD">Leads (Sales Pipeline Intake)</option>
                <option value="CONTACT">Contacts (Client Directory)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                style={{ width: '100%', padding: '0.45rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#cbd5e1', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* Sample Format Guide */}
          <div style={{ background: 'var(--surface-container-lowest)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
            Expected CSV header columns: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>First Name, Last Name, Email, Phone, Company, Source</span>
          </div>

          {parsedRows.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                ✓ {parsedRows.length} rows ready for ingestion.
              </span>
              <button
                type="button"
                disabled={importing}
                onClick={handleRunImport}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
              >
                {importing ? 'Importing...' : 'Execute Import'}
              </button>
            </div>
          )}

          {importSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Processed</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{importSummary.totalRows}</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Imported</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{importSummary.importedCount}</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Duplicates Skipped</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{importSummary.duplicateCount}</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#f87171' }}>Errors</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171' }}>{importSummary.errorCount}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ROLE-ENFORCED DATA EXPORT */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} color="#38bdf8" /> Role-Based Data Export
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
            Export CRM records with server-side permission gates: Admins receive full tenant data, Sales Reps receive assigned records only, and Viewers are blocked.
          </p>
        </div>

        <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Data Entity
              </label>
              <select
                value={exportEntity}
                onChange={(e) => setExportEntity(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="leads">Leads</option>
                <option value="contacts">Contacts</option>
                <option value="deals">Deals</option>
                <option value="tasks">Tasks</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.35rem' }}>
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', background: 'var(--surface-container-lowest)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="csv">CSV (Spreadsheet Format)</option>
                <option value="json">JSON (Developer Data)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Your Role Scope:{' '}
              <span style={{ fontWeight: 700, color: isViewer ? '#f87171' : isOwnerOrAdmin ? '#10b981' : '#f59e0b' }}>
                {isViewer
                  ? 'Viewer (Export Prohibited)'
                  : isOwnerOrAdmin
                  ? 'Administrator (Full Workspace Records)'
                  : 'Representative (Assigned Records Only)'}
              </span>
            </div>

            <button
              type="button"
              disabled={isViewer || exporting}
              onClick={handleRunExport}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            >
              <Download size={14} />
              {exporting ? 'Generating Export...' : `Download ${exportEntity.toUpperCase()} (${exportFormat.toUpperCase()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
