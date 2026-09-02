'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft, Lock, ArrowRight } from 'lucide-react';
import { SETTINGS_REGISTRY } from '@/config/settings-registry';

interface SettingsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSetting: (tabId: string, sectionId?: string) => void;
  userRole?: string;
}

export function SettingsSearchModal({
  isOpen,
  onClose,
  onSelectSetting,
  userRole = 'MEMBER',
}: SettingsSearchModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
      setSelectedIndex(0);
    }, 150);
    return () => clearTimeout(handler);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery('');
        setDebouncedQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter settings registry
  const filteredSettings = React.useMemo(() => {
    if (!debouncedQuery) {
      // Show top 6 recommended settings
      return SETTINGS_REGISTRY.slice(0, 6);
    }

    return SETTINGS_REGISTRY.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(debouncedQuery);
      const matchDesc = item.description.toLowerCase().includes(debouncedQuery);
      const matchCategory = item.category.toLowerCase().includes(debouncedQuery);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(debouncedQuery));
      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [debouncedQuery]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredSettings.length > 0 ? (prev + 1) % filteredSettings.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredSettings.length > 0 ? (prev - 1 + filteredSettings.length) % filteredSettings.length : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredSettings[selectedIndex]) {
          const item = filteredSettings[selectedIndex];
          onSelectSetting(item.tabId, item.sectionId);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredSettings, selectedIndex, onClose, onSelectSetting]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 14, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10vh 1rem 2rem 1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'linear-gradient(180deg, #181c28 0%, #10131d 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(124, 58, 237, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Search size={20} color="#a78bfa" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all settings, pages, regional options, or keywords..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          )}
          <span
            style={{
              fontSize: '0.7rem',
              color: '#94a3b8',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {filteredSettings.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
                No matching settings found
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                Try searching for &quot;currency&quot;, &quot;timezone&quot;, &quot;theme&quot;, &quot;logo&quot;, or &quot;notifications&quot;.
              </p>
            </div>
          ) : (
            filteredSettings.map((item, index) => {
              const isSelected = index === selectedIndex;
              const hasRole = !item.roleRequired || userRole === 'OWNER' || (item.roleRequired === 'ADMIN' && (userRole === 'ADMIN' || userRole === 'OWNER'));

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectSetting(item.tabId, item.sectionId);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#c4b5fd',
                          background: 'rgba(139, 92, 246, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.category}
                      </span>
                      {!hasRole && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '0.65rem',
                            color: '#f87171',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          <Lock size={10} /> {item.roleRequired} ONLY
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isSelected ? '#a78bfa' : '#64748b' }}>
                    {isSelected && (
                      <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', color: '#a78bfa' }}>
                        Jump <CornerDownLeft size={12} />
                      </span>
                    )}
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          <span>Use ↑ and ↓ to navigate</span>
          <span>Press Enter to select</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
