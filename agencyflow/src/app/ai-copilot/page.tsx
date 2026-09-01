'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import {
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  Bot,
  User,
  Zap,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  CreditCard,
  Layers,
  ArrowRight,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  cards?: {
    title: string;
    type: string;
    badge?: string;
    link?: string;
    meta?: string;
  }[];
  actionTaken?: any;
}

export default function AICopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      content: `### 👋 Welcome to the AgencyFlow AI Brain!

I have live RAG (Retrieval-Augmented Generation) access to your CRM workspace database:
- **🎯 Leads & Sales Pipeline** (ICP scores, stages, cold outreach)
- **🚀 Active Projects & Delivery** (Milestones, SOWs, completion %)
- **💰 Invoices & Cashflow** (Paid volume, pending deposits, overdue accounts)
- **📋 Tasks & Sprint Matrix** (Assignees, high-priority blockers)

You can ask me questions, request executive summaries, or ask me to **create tasks** directly on your boards!`,
      timestamp: 'Just now',
      cards: [
        { title: 'Pipeline Leads', type: 'Leads', badge: 'AI Scored', link: '/leads', meta: 'Cold Outreach Pipeline' },
        { title: 'Active Projects', type: 'Projects', badge: 'Delivery Hub', link: '/projects', meta: 'Milestones & Timelines' },
        { title: 'Task Board', type: 'Tasks', badge: 'Sprint Matrix', link: '/tasks', meta: 'Kanban Board' },
        { title: 'Billing & Invoices', type: 'Invoices', badge: 'Cashflow', link: '/invoices', meta: 'Collections Tracker' },
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/ai/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();
      if (json.success) {
        const aiMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: json.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cards: json.cards || [],
          actionTaken: json.actionTaken,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            content: `⚠️ Error retrieving data: ${json.error || 'Failed to connect to CRM database'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ Failed to execute query. Please check your network connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: '📊 Pipeline Diagnostic', query: 'Give me a full diagnostic of our leads, deals and pipeline health.' },
    { label: '💰 Cashflow & Unpaid Invoices', query: 'How much money is pending or overdue in our invoices?' },
    { label: '🚀 High-Scoring Cold Leads', query: 'Show me all high-scoring prospects with an ICP score of 80+ that we need to contact.' },
    { label: '⚠️ Sprint Risk & Overdue Tasks', query: 'What are the highest priority tasks and delivery blockers?' },
    { label: '📝 Create Task: Review n8n Webhook', query: 'Create task: Test n8n webhook intake pipeline with High Priority' },
  ];

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)', gap: '1rem' }}>
        {/* Top Header Bar */}
        <div
          style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}>
                <Cpu size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                  AgencyFlow AI Brain & Knowledge RAG
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                  Real-time intelligence engine connected across Leads, Deals, Tasks, Invoices, and Projects.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(78, 222, 163, 0.15)',
                border: '1px solid rgba(78, 222, 163, 0.3)',
                color: '#4edea3',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4edea3', boxShadow: '0 0 8px #4edea3' }} />
              Live CRM Database Synced
            </div>

            <button
              onClick={() => setMessages(messages.slice(0, 1))}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '0.35rem 0.7rem',
                color: 'var(--on-surface-variant)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="Clear conversation"
            >
              <Trash2 size={13} /> Reset Chat
            </button>
          </div>
        </div>

        {/* Quick Executive Prompts Carousel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.query)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                background: 'var(--surface-container-low)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e2e8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
                e.currentTarget.style.borderColor = '#a855f7';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-container-low)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#e2e2e8';
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Container */}
        <div
          style={{
            flex: 1,
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '82%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      background: isUser ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--surface-container)',
                      color: '#fff',
                      padding: '1rem 1.25rem',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Interactive CRM Entity Cards (if provided) */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.6rem',
                        width: '100%',
                        marginTop: '0.3rem',
                      }}
                    >
                      {msg.cards.map((card, ci) => (
                        <Link
                          key={ci}
                          href={card.link || '#'}
                          style={{
                            background: 'var(--surface-container-high)',
                            borderRadius: '8px',
                            padding: '0.65rem 0.85rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            textDecoration: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700 }}>
                              {card.type}
                            </span>
                            {card.badge && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                                {card.badge}
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {card.title}
                          </h4>
                          {card.meta && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>
                              {card.meta}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Message Timestamp & Copy Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--on-surface-variant)', padding: '0 4px' }}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        {copiedId === msg.id ? <Check size={11} color="#4edea3" /> : <Copy size={11} />}
                        {copiedId === msg.id ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Bot size={18} />
              </div>
              <div style={{ background: 'var(--surface-container)', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                <RefreshCw size={15} className="animate-spin" color="#38bdf8" />
                Querying workspace database & synthesizing live insights...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.6rem 0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <input
            type="text"
            placeholder="Ask about Leads, Invoices, Projects, Cashflow, or type 'Create task: ...'"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              padding: '0.4rem 0.6rem',
            }}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || loading}
            style={{
              background: inputQuery.trim() && !loading ? 'linear-gradient(135deg, #a855f7, #38bdf8)' : 'var(--surface-container-high)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.1rem',
              color: inputQuery.trim() && !loading ? '#fff' : 'var(--outline)',
              cursor: inputQuery.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Send size={15} /> Send
          </button>
        </div>
      </div>
    </AppShell>
  );
}
