'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import { EmptyState } from '@/components/EmptyState';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  X,
  AlertTriangle,
  MoreVertical,
  Briefcase,
  List,
  Kanban,
  Trash2,
  ChevronRight,
  Edit3,
  Filter,
  Check,
  Paperclip,
  MessageSquare,
  Sparkles,
  Users,
  Building2,
  Calendar,
  GripVertical,
  RefreshCw,
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  progress?: number;
  subtasksCount?: number;
  filesCount?: number;
  assignedTo?: { id?: string; fullName: string; email?: string };
  lead?: { id?: string; firstName: string; lastName: string; companyName?: string };
  deal?: { id?: string; title: string; value?: number };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View & Filter States
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Drag & Drop State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modals & Active Dropdowns
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [createInitialStatus, setCreateInitialStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'>('PENDING');

  // Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskLeadName, setTaskLeadName] = useState('');
  const [creating, setCreating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/tasks');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        const enriched: TaskItem[] = json.data.map((t: any, index: number) => {
          // Normalize status
          let normStatus: TaskItem['status'] = 'PENDING';
          if (t.status === 'IN_PROGRESS' || t.status === 'DOING') normStatus = 'IN_PROGRESS';
          else if (t.status === 'ON_HOLD' || t.status === 'REVIEW') normStatus = 'ON_HOLD';
          else if (t.status === 'COMPLETED' || t.status === 'DONE') normStatus = 'COMPLETED';

          // Deterministic progress and counts for demonstration based on task ID
          const defaultProgress = normStatus === 'COMPLETED' ? 100 : normStatus === 'IN_PROGRESS' ? (index % 2 === 0 ? 70 : 60) : normStatus === 'ON_HOLD' ? 40 : (index % 2 === 0 ? 60 : 30);
          const defaultSubtasks = (index % 4) + 2;
          const defaultFiles = (index % 5) + 1;

          return {
            ...t,
            status: normStatus,
            progress: t.progress ?? defaultProgress,
            subtasksCount: t.subtasksCount ?? defaultSubtasks,
            filesCount: t.filesCount ?? defaultFiles,
          };
        });
        setTasks(enriched);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ----------------------------------------------------
  // Drag and Drop Handlers
  // ----------------------------------------------------
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskItem['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    setDragOverColumn(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Optimistically update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              progress: targetStatus === 'COMPLETED' ? 100 : targetStatus === 'IN_PROGRESS' ? 70 : targetStatus === 'ON_HOLD' ? 40 : 25,
            }
          : t
      )
    );

    try {
      await fetch('/api/v1/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: targetStatus }),
      });
    } catch (err) {
      setTasks(previousTasks);
    }
  };

  // Create New Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          priority: taskPriority,
          dueDate: taskDueDate || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: createInitialStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setTaskTitle('');
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    setActiveMenuTaskId(null);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/v1/tasks?id=${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  // Calculate Overall Sprint Progress
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overallProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.lead?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // Columns definition matching the Cleario modern task board
  const columns: {
    id: TaskItem['status'];
    label: string;
    headerBg: string;
    headerColor: string;
    dotColor: string;
  }[] = [
    {
      id: 'PENDING',
      label: 'Pending',
      headerBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      headerColor: '#ffffff',
      dotColor: '#3b82f6',
    },
    {
      id: 'IN_PROGRESS',
      label: 'Inprogress',
      headerBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      headerColor: '#ffffff',
      dotColor: '#f59e0b',
    },
    {
      id: 'ON_HOLD',
      label: 'On Hold',
      headerBg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      headerColor: '#ffffff',
      dotColor: '#06b6d4',
    },
    {
      id: 'COMPLETED',
      label: 'Completed',
      headerBg: 'linear-gradient(135deg, #10b981, #059669)',
      headerColor: '#ffffff',
      dotColor: '#10b981',
    },
  ];

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'calc(100vh - 100px)' }}>
        {/* Top Header Card with Sprint Overview */}
        <div
          style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={24} color="#3b82f6" /> Task Board
              </h1>
            </div>

            {/* Lead & Team Avatar Stacks */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {/* Lead Stacks */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Lead</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#a855f7', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-container-lowest)' }}>
                    MP
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-container-lowest)', marginLeft: '-8px' }}>
                    AH
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginLeft: '6px' }}>+4</span>
                </div>
              </div>

              {/* Team Reps Stacks */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Team</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-container-lowest)' }}>
                    AR
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-container-lowest)', marginLeft: '-8px' }}>
                    SK
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ec4899', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-container-lowest)', marginLeft: '-8px' }}>
                    JD
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginLeft: '6px' }}>+12</span>
                </div>
              </div>

              {/* Search & New Task Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '0.45rem 0.75rem 0.45rem 2rem',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                      width: '160px',
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    setCreateInitialStatus('PENDING');
                    setIsCreateModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#3b82f6', border: 'none', fontWeight: 700 }}
                >
                  <Plus size={16} /> Create Task
                </button>
              </div>
            </div>
          </div>

          {/* Overall Sprint Completion Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', minWidth: '40px' }}>
              {overallProgress}%
            </span>
          </div>
        </div>

        {/* Kanban Task Columns Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-pulse" style={{ height: '500px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchTasks} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              alignItems: 'start',
              paddingBottom: '2rem',
            }}
          >
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              const isOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  className="hover-level-3"
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={(e) => handleDragLeave(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  style={{
                    background: isOver ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface-container-lowest)',
                    borderRadius: '12px',
                    border: isOver ? '2px dashed #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isOver ? '0 0 25px rgba(56, 189, 248, 0.15)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Distinct Colored Column Header matching reference UI */}
                  <div
                    style={{
                      background: col.headerBg,
                      color: col.headerColor,
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                        {col.label}
                      </span>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.25)',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Quick Add Button */}
                    <button
                      onClick={() => {
                        setCreateInitialStatus(col.id);
                        setIsCreateModalOpen(true);
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.25)',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={`Add task to ${col.label}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Task Cards Column Body */}
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '160px' }}>
                    {colTasks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: isOver ? '#38bdf8' : 'var(--outline)', fontSize: '0.75rem', border: isOver ? '1px dashed #38bdf8' : 'none', borderRadius: '6px' }}>
                        {isOver ? 'Drop task here' : 'No tasks in this list'}
                      </div>
                    ) : (
                      colTasks.map((t) => {
                        const isDragging = draggingTaskId === t.id;
                        const prog = t.progress ?? (t.status === 'COMPLETED' ? 100 : 50);

                        // Priority styling
                        const priorityBg =
                          t.priority === 'HIGH'
                            ? 'rgba(59, 130, 246, 0.18)'
                            : t.priority === 'LOW'
                            ? 'rgba(245, 158, 11, 0.18)'
                            : 'rgba(168, 85, 247, 0.18)';
                        const priorityColor =
                          t.priority === 'HIGH' ? '#60a5fa' : t.priority === 'LOW' ? '#fbbf24' : '#c084fc';
                        const priorityBorder =
                          t.priority === 'HIGH' ? '1px solid rgba(59, 130, 246, 0.3)' : t.priority === 'LOW' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)';

                        return (
                          <div
                            key={t.id}
                            draggable={true}
                            className={isDragging ? '' : 'hover-level-2'}
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            onDragEnd={handleDragEnd}
                            style={{
                              background: isDragging ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-container)',
                              color: 'var(--on-surface)',
                              borderRadius: '10px',
                              padding: '1rem',
                              border: isDragging ? '1px dashed #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem',
                              cursor: 'grab',
                              opacity: isDragging ? 0.4 : 1,
                              transform: isDragging ? 'scale(0.98)' : undefined,
                              position: 'relative',
                            }}
                          >
                            {/* Card Top Row: Title & 3-Dot Options */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.35 }}>
                                {t.title}
                              </h3>

                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuTaskId(activeMenuTaskId === t.id ? null : t.id);
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '2px' }}
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {activeMenuTaskId === t.id && (
                                  <div
                                    ref={dropdownRef}
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      right: 0,
                                      zIndex: 50,
                                      minWidth: '140px',
                                      background: '#1e293b',
                                      borderRadius: '8px',
                                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                      padding: '4px',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                  >
                                    <button
                                      onClick={() => handleDeleteTask(t.id)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 10px',
                                        color: '#ffb4ab',
                                        fontSize: '12px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Trash2 size={13} /> Delete Task
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Priority Badge & Due Date */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span
                                style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  background: priorityBg,
                                  color: priorityColor,
                                  border: priorityBorder,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {t.priority.toLowerCase()}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                                <Clock size={12} />
                                {new Date(t.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </div>
                            </div>

                            {/* Progress Bar & Percentage */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${prog}%`,
                                    background:
                                      t.status === 'COMPLETED'
                                        ? '#10b981'
                                        : t.status === 'IN_PROGRESS'
                                        ? '#f59e0b'
                                        : t.status === 'ON_HOLD'
                                        ? '#06b6d4'
                                        : '#3b82f6',
                                    borderRadius: '9999px',
                                  }}
                                />
                              </div>
                              <div style={{ textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                                {prog}%
                              </div>
                            </div>

                            {/* Card Footer: Assignee Stack, Attachments & Comments */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              {/* Team Avatar Stack */}
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1.5px solid var(--surface-container)',
                                  }}
                                >
                                  {t.assignedTo?.fullName ? t.assignedTo.fullName.split(' ').map((n) => n[0]).join('') : 'AR'}
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', fontWeight: 600, marginLeft: '4px' }}>
                                  +1
                                </span>
                              </div>

                              {/* Attachments & Subtasks */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <Paperclip size={12} />
                                  <span>{t.filesCount || 3}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <MessageSquare size={12} />
                                  <span>{t.subtasksCount || 2}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Task Modal */}
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
                  <Plus size={18} color="#3b82f6" /> Create New Task
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                    Task Title:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Website UI/UX Redesign, n8n Pipeline Setup..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--surface-container-high)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Priority:
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e: any) => setTaskPriority(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--surface-container-high)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium / Normal</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '0.3rem' }}>
                      Due Date:
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--surface-container-high)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem',
                    background: '#3b82f6',
                    border: 'none',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {creating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                  {creating ? 'Creating Task...' : 'Create Task'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
