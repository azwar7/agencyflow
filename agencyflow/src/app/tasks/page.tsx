'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { UIStateCard } from '@/components/UIStateCard';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  User,
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
  ArrowUpDown,
  Filter,
  Check,
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'COMPLETED';
  assignedTo?: { id?: string; fullName: string };
  lead?: { id?: string; firstName: string; lastName: string; companyName?: string };
  deal?: { id?: string; title: string; value?: number };
}

import { EmptyState } from '@/components/EmptyState';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View & Filter States
  const [activeTab, setActiveTab] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'UPCOMING'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Modals, Drawers & Action Menus
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Form State for Creating/Editing Tasks
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormPriority, setTaskFormPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [taskFormDueDate, setTaskFormDueDate] = useState('');
  const [taskFormAssignee, setTaskFormAssignee] = useState('Alex Rivera');
  const [taskFormRelatedDeal, setTaskFormRelatedDeal] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/tasks');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setTasks(json.data);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Check URL query parameters for taskId or search matching task
  useEffect(() => {
    if (typeof window !== 'undefined' && tasks.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const taskIdParam = params.get('taskId') || params.get('id');
      if (taskIdParam) {
        const found = tasks.find(
          (t) => t.id === taskIdParam || t.title.toLowerCase().includes(taskIdParam.toLowerCase())
        );
        if (found) setSelectedTask(found);
      }
    }
  }, [tasks]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: nextStatus as any });
    }

    try {
      await fetch('/api/v1/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskPriority = async (taskId: string, newPriority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, priority: newPriority });
    }
    setActiveMenuTaskId(null);

    try {
      await fetch('/api/v1/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, priority: newPriority }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormTitle.trim()) return;

    const newTaskObj: TaskItem = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      title: taskFormTitle,
      dueDate: taskFormDueDate ? new Date(taskFormDueDate).toISOString() : new Date().toISOString(),
      priority: taskFormPriority,
      status: 'PENDING',
      assignedTo: { fullName: taskFormAssignee },
      deal: taskFormRelatedDeal ? { title: taskFormRelatedDeal } : undefined,
    };

    setTasks([newTaskObj, ...tasks]);
    setIsCreateModalOpen(false);
    resetForm();

    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskFormTitle,
          priority: taskFormPriority,
          dueDate: taskFormDueDate,
        }),
      });
      if (res.ok) {
        fetchTasks();
        window.dispatchEvent(new Event('agencyflow-refresh'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !taskFormTitle.trim()) return;

    const updatedTask = {
      ...selectedTask,
      title: taskFormTitle,
      priority: taskFormPriority,
      dueDate: taskFormDueDate ? new Date(taskFormDueDate).toISOString() : selectedTask.dueDate,
      assignedTo: { fullName: taskFormAssignee },
      deal: taskFormRelatedDeal ? { title: taskFormRelatedDeal } : selectedTask.deal,
    };

    setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
    setIsEditModalOpen(false);
    resetForm();

    try {
      await fetch('/api/v1/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          title: taskFormTitle,
          priority: taskFormPriority,
          dueDate: taskFormDueDate,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
    setActiveMenuTaskId(null);

    try {
      await fetch(`/api/v1/tasks?id=${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTaskFormTitle('');
    setTaskFormPriority('MEDIUM');
    setTaskFormDueDate('');
    setTaskFormAssignee('Alex Rivera');
    setTaskFormRelatedDeal('');
  };

  const openEditModal = (task: TaskItem) => {
    setSelectedTask(task);
    setTaskFormTitle(task.title);
    setTaskFormPriority(task.priority);
    setTaskFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setTaskFormAssignee(task.assignedTo?.fullName || 'Alex Rivera');
    setTaskFormRelatedDeal(task.deal?.title || '');
    setIsEditModalOpen(true);
    setActiveMenuTaskId(null);
  };

  // KPI Calculations
  const now = new Date();
  const todayStr = now.toDateString();

  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  const dueTodayCount = tasks.filter((t) => {
    if (t.status === 'COMPLETED') return false;
    const d = new Date(t.dueDate);
    return d.toDateString() === todayStr;
  }).length;

  const overdueCount = tasks.filter((t) => {
    if (t.status === 'COMPLETED') return false;
    const d = new Date(t.dueDate);
    return d < now && d.toDateString() !== todayStr;
  }).length;

  const highPriorityCount = tasks.filter((t) => t.priority === 'HIGH' && t.status === 'PENDING').length;

  // Task Category Helper
  const getTaskCategory = (task: TaskItem): 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED' => {
    if (task.status === 'COMPLETED') return 'COMPLETED';
    const d = new Date(task.dueDate);
    if (d < now && d.toDateString() !== todayStr) return 'OVERDUE';
    if (d.toDateString() === todayStr) return 'TODAY';
    return 'UPCOMING';
  };

  // Unique assignees for filter
  const assigneesList = Array.from(
    new Set(tasks.map((t) => t.assignedTo?.fullName).filter(Boolean))
  );

  // Filter Tasks Logic
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedTo?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.deal?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lead?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (assigneeFilter !== 'ALL' && t.assignedTo?.fullName !== assigneeFilter) return false;

    const cat = getTaskCategory(t);
    if (activeTab === 'TODAY' && cat !== 'TODAY') return false;
    if (activeTab === 'OVERDUE' && cat !== 'OVERDUE') return false;
    if (activeTab === 'UPCOMING' && cat !== 'UPCOMING') return false;

    return true;
  });

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '0.25rem',
              background: 'rgba(255, 180, 171, 0.12)',
              border: '1px solid rgba(255, 180, 171, 0.25)',
              color: '#ffb4ab',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '0.25rem',
              background: 'rgba(255, 185, 95, 0.12)',
              border: '1px solid rgba(255, 185, 95, 0.25)',
              color: '#ffb95f',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '0.25rem',
              background: 'rgba(192, 193, 255, 0.12)',
              border: '1px solid rgba(192, 193, 255, 0.25)',
              color: '#c0c1ff',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            LOW
          </span>
        );
    }
  };

  const getDueDateLabel = (task: TaskItem) => {
    const cat = getTaskCategory(task);
    const d = new Date(task.dueDate);
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (cat === 'OVERDUE') {
      return (
        <span style={{ color: 'var(--error)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <AlertTriangle size={12} /> Overdue ({dateFormatted})
        </span>
      );
    }
    if (cat === 'TODAY') {
      return (
        <span style={{ color: 'var(--tertiary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={12} /> Due Today
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--on-surface-variant)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <CalendarIcon size={12} /> {dateFormatted}
      </span>
    );
  };

  const groupTasks = (taskList: TaskItem[]) => {
    const overdue = taskList.filter((t) => getTaskCategory(t) === 'OVERDUE');
    const today = taskList.filter((t) => getTaskCategory(t) === 'TODAY');
    const upcoming = taskList.filter((t) => getTaskCategory(t) === 'UPCOMING');
    const completed = taskList.filter((t) => getTaskCategory(t) === 'COMPLETED');

    return { overdue, today, upcoming, completed };
  };

  const grouped = groupTasks(filteredTasks);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        
        {/* 1. Header Section with Inline Summary Stat Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: 0 }}>
              TASKS
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem', margin: '0.2rem 0 0.5rem 0' }}>
              Manage your agency workload, deadlines, and assignments.
            </p>

            {/* Inline Stat Bar (Unboxed, horizontal, separated by dot dividers) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--on-surface-variant)', paddingTop: '0.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckSquare size={14} color="var(--primary)" />
                <strong style={{ color: 'var(--on-surface)', fontWeight: 800 }}>{totalCount}</strong> Total Tasks
                <span style={{ fontSize: '0.725rem', color: 'var(--on-surface-variant)', opacity: 0.7 }}>({pendingCount} pending)</span>
              </div>

              <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.75rem' }}>•</span>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} color={dueTodayCount > 0 ? '#ffb95f' : 'var(--on-surface-variant)'} />
                <strong style={{ color: dueTodayCount > 0 ? '#ffb95f' : 'var(--on-surface-variant)', fontWeight: 800 }}>{dueTodayCount}</strong> Due Today
              </div>

              <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.75rem' }}>•</span>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                {overdueCount > 0 && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff8c82', boxShadow: '0 0 8px #ff8c82', display: 'inline-block' }} />
                )}
                <AlertTriangle size={14} color={overdueCount > 0 ? '#ff8c82' : 'var(--on-surface-variant)'} />
                <strong style={{ color: overdueCount > 0 ? '#ff8c82' : 'var(--on-surface-variant)', fontWeight: 800 }}>{overdueCount}</strong> Overdue
              </div>

              <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.75rem' }}>•</span>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                {highPriorityCount > 0 && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffb95f', boxShadow: '0 0 8px #ffb95f', display: 'inline-block' }} />
                )}
                <span style={{ fontSize: '0.85rem' }}>🔥</span>
                <strong style={{ color: highPriorityCount > 0 ? '#ffb95f' : 'var(--on-surface-variant)', fontWeight: 800 }}>{highPriorityCount}</strong> High Priority
              </div>

              <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.75rem' }}>•</span>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} color="var(--secondary)" />
                <strong style={{ color: 'var(--secondary)', fontWeight: 800 }}>{completedCount}</strong> Completed
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Plus size={18} /> New Task
          </button>
        </div>

        {/* 3. Task Control Toolbar */}
        <div className="glass-card" style={{ padding: '0.85rem 1rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Row 1: Left Filter Tabs | Right View Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
              {[
                { id: 'ALL', label: 'All Tasks' },
                { id: 'TODAY', label: `Due Today (${dueTodayCount})` },
                { id: 'OVERDUE', label: `Overdue (${overdueCount})` },
                { id: 'UPCOMING', label: 'Upcoming' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '0.35rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeTab === tab.id ? 'var(--primary-container)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                    border: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List / Board Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container-high)', padding: '0.15rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.3rem',
                  background: viewMode === 'list' ? 'rgba(192,193,255,0.2)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary)' : 'var(--on-surface-variant)',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <List size={14} /> List
              </button>
              <button
                onClick={() => setViewMode('board')}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '0.3rem',
                  background: viewMode === 'board' ? 'rgba(192,193,255,0.2)' : 'transparent',
                  color: viewMode === 'board' ? 'var(--primary)' : 'var(--on-surface-variant)',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Kanban size={14} /> Board
              </button>
            </div>
          </div>

          {/* Row 2: Search Input & Advanced Dropdown Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', maxWidth: '440px', background: 'var(--surface-container-high)', padding: '0.45rem 0.85rem', borderRadius: '0.4rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Search size={15} color="var(--on-surface-variant)" />
              <input
                type="text"
                placeholder="Search tasks, clients, projects, or assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--on-surface)', fontSize: '0.8rem', outline: 'none', width: '100%' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                style={{
                  background: 'var(--surface-container-high)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">Priority: All</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  background: 'var(--surface-container-high)',
                  color: 'var(--on-surface)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">Status: All</option>
                <option value="PENDING">Pending Only</option>
                <option value="COMPLETED">Completed Only</option>
              </select>

              {assigneesList.length > 0 && (
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  style={{
                    background: 'var(--surface-container-high)',
                    color: 'var(--on-surface)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '0.4rem',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.75rem',
                    outline: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <option value="ALL">Assignee: All</option>
                  {assigneesList.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}

              {(searchQuery || priorityFilter !== 'ALL' || statusFilter !== 'ALL' || assigneeFilter !== 'ALL' || activeTab !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('ALL');
                    setStatusFilter('ALL');
                    setAssigneeFilter('ALL');
                    setActiveTab('ALL');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.35rem 0.5rem',
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Main Content Area */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card skeleton-pulse" style={{ height: '60px', borderRadius: '0.5rem' }} />
            ))}
          </div>
        ) : error ? (
          <UIStateCard type="error" description={error} onRetry={fetchTasks} />
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(192, 193, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <CheckSquare size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>No matching tasks</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
                {searchQuery || priorityFilter !== 'ALL' || statusFilter !== 'ALL' ? 'Try adjusting your search criteria or reset active filters.' : 'Create a new task to start organizing your agency workload.'}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Create Task
            </button>
          </div>
        ) : viewMode === 'board' ? (
          /* Kanban Board View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            {[
              { statusKey: 'PENDING', title: 'TO DO / IN PROGRESS', items: filteredTasks.filter((t) => t.status === 'PENDING') },
              { statusKey: 'COMPLETED', title: 'COMPLETED', items: filteredTasks.filter((t) => t.status === 'COMPLETED') },
            ].map((col) => (
              <div key={col.statusKey} className="glass-card" style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em' }}>
                    {col.title} ({col.items.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {col.items.map((task) => (
                    <div
                      key={task.id}
                      className="glass-card"
                      style={{
                        padding: '0.85rem',
                        borderRadius: '0.5rem',
                        background: 'var(--surface-container)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.3 }}>
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
                        <div>{getDueDateLabel(task)}</div>
                        <span style={{ fontWeight: 600 }}>{task.assignedTo?.fullName || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Refined Compact Task List View grouped cleanly */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* OVERDUE Tasks Group */}
            {grouped.overdue.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(255,180,171,0.2)', color: 'var(--error)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                    OVERDUE ({grouped.overdue.length})
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,180,171,0.15)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {grouped.overdue.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      activeMenuTaskId={activeMenuTaskId}
                      setActiveMenuTaskId={setActiveMenuTaskId}
                      onToggle={() => toggleTaskStatus(task.id, task.status)}
                      onSelect={() => setSelectedTask(task)}
                      onEdit={() => openEditModal(task)}
                      onPriorityChange={(p) => updateTaskPriority(task.id, p)}
                      onDelete={() => handleDeleteTask(task.id)}
                      getPriorityBadge={getPriorityBadge}
                      getDueDateLabel={getDueDateLabel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* DUE TODAY Tasks Group */}
            {grouped.today.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(255,185,95,0.2)', color: 'var(--tertiary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                    DUE TODAY ({grouped.today.length})
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,185,95,0.15)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {grouped.today.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      activeMenuTaskId={activeMenuTaskId}
                      setActiveMenuTaskId={setActiveMenuTaskId}
                      onToggle={() => toggleTaskStatus(task.id, task.status)}
                      onSelect={() => setSelectedTask(task)}
                      onEdit={() => openEditModal(task)}
                      onPriorityChange={(p) => updateTaskPriority(task.id, p)}
                      onDelete={() => handleDeleteTask(task.id)}
                      getPriorityBadge={getPriorityBadge}
                      getDueDateLabel={getDueDateLabel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* UPCOMING Tasks Group */}
            {grouped.upcoming.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(192,193,255,0.15)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                    UPCOMING ({grouped.upcoming.length})
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(192,193,255,0.12)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {grouped.upcoming.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      activeMenuTaskId={activeMenuTaskId}
                      setActiveMenuTaskId={setActiveMenuTaskId}
                      onToggle={() => toggleTaskStatus(task.id, task.status)}
                      onSelect={() => setSelectedTask(task)}
                      onEdit={() => openEditModal(task)}
                      onPriorityChange={(p) => updateTaskPriority(task.id, p)}
                      onDelete={() => handleDeleteTask(task.id)}
                      getPriorityBadge={getPriorityBadge}
                      getDueDateLabel={getDueDateLabel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED Tasks Group */}
            {grouped.completed.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(0,165,114,0.15)', color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                    COMPLETED ({grouped.completed.length})
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(0,165,114,0.12)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {grouped.completed.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      activeMenuTaskId={activeMenuTaskId}
                      setActiveMenuTaskId={setActiveMenuTaskId}
                      onToggle={() => toggleTaskStatus(task.id, task.status)}
                      onSelect={() => setSelectedTask(task)}
                      onEdit={() => openEditModal(task)}
                      onPriorityChange={(p) => updateTaskPriority(task.id, p)}
                      onDelete={() => handleDeleteTask(task.id)}
                      getPriorityBadge={getPriorityBadge}
                      getDueDateLabel={getDueDateLabel}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Task Detail Slide-Over Drawer */}
      {selectedTask && !isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              height: '100%',
              background: '#171b26',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>TASK #{selectedTask.id}</span>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.35, marginBottom: '0.6rem' }}>
                {selectedTask.title}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {getPriorityBadge(selectedTask.priority)}
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: selectedTask.status === 'COMPLETED' ? 'rgba(0,165,114,0.2)' : 'var(--surface-container-high)', color: selectedTask.status === 'COMPLETED' ? 'var(--secondary)' : 'var(--on-surface)', fontWeight: 600 }}>
                  {selectedTask.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.85rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-container-low)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>DUE DATE</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface)', marginTop: '0.15rem', margin: 0 }}>{getDueDateLabel(selectedTask)}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>ASSIGNEE</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface)', marginTop: '0.15rem', fontWeight: 600, margin: 0 }}>{selectedTask.assignedTo?.fullName || 'Unassigned'}</p>
              </div>

              {selectedTask.deal && (
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>RELATED PROJECT / DEAL</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.15rem', fontWeight: 600, margin: 0 }}>{selectedTask.deal.title}</p>
                </div>
              )}

              {selectedTask.lead && (
                <div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>RELATED CONTACT / CLIENT</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--on-surface)', marginTop: '0.15rem', fontWeight: 600, margin: 0 }}>
                    {selectedTask.lead.firstName} {selectedTask.lead.lastName} {selectedTask.lead.companyName ? `(${selectedTask.lead.companyName})` : ''}
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={() => toggleTaskStatus(selectedTask.id, selectedTask.status)}
                className="btn btn-primary"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <CheckCircle2 size={16} />
                {selectedTask.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Completed'}
              </button>
              <button
                onClick={() => openEditModal(selectedTask)}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
              >
                <Edit3 size={15} /> Edit
              </button>
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="btn btn-secondary"
                style={{ color: 'var(--error)', border: '1px solid rgba(255, 180, 171, 0.2)' }}
                title="Delete Task"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Task Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#1c1f2a',
              borderRadius: '0.85rem',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                {isEditModalOpen ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleEditTask : handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule technical architecture review..."
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Priority</label>
                  <select
                    value={taskFormPriority}
                    onChange={(e) => setTaskFormPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Due Date</label>
                  <input
                    type="date"
                    value={taskFormDueDate}
                    onChange={(e) => setTaskFormDueDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Assignee</label>
                  <input
                    type="text"
                    value={taskFormAssignee}
                    onChange={(e) => setTaskFormAssignee(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Related Project / Deal</label>
                  <input
                    type="text"
                    placeholder="e.g. Summit Operations System"
                    value={taskFormRelatedDeal}
                    onChange={(e) => setTaskFormRelatedDeal(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--on-surface)', fontSize: '0.85rem', marginTop: '0.2rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  {isEditModalOpen ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// Single Compact Task Row Component
function TaskRow({
  task,
  activeMenuTaskId,
  setActiveMenuTaskId,
  onToggle,
  onSelect,
  onEdit,
  onPriorityChange,
  onDelete,
  getPriorityBadge,
  getDueDateLabel,
}: {
  task: TaskItem;
  activeMenuTaskId: string | null;
  setActiveMenuTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onPriorityChange: (p: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  onDelete: () => void;
  getPriorityBadge: (p: TaskItem['priority']) => React.ReactNode;
  getDueDateLabel: (t: TaskItem) => React.ReactNode;
}) {
  const isCompleted = task.status === 'COMPLETED';
  const isMenuOpen = activeMenuTaskId === task.id;

  return (
    <div
      className="glass-card"
      style={{
        padding: '0.65rem 0.9rem',
        borderRadius: '0.5rem',
        background: isCompleted ? 'rgba(24, 27, 38, 0.4)' : 'var(--surface-container-low)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        opacity: isCompleted ? 0.7 : 1,
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        {/* Checkbox Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}
          title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
        >
          {isCompleted ? (
            <CheckCircle2 size={18} style={{ color: 'var(--secondary)' }} />
          ) : (
            <Circle size={18} style={{ color: 'var(--on-surface-variant)' }} />
          )}
        </button>

        {/* Task Info */}
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onSelect}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isCompleted ? 'var(--on-surface-variant)' : 'var(--on-surface)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {task.title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.725rem', marginTop: '0.15rem' }}>
            <div>{getDueDateLabel(task)}</div>

            <span style={{ color: 'var(--on-surface-variant)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <User size={11} /> {task.assignedTo?.fullName || 'Unassigned'}
            </span>

            {task.deal && (
              <span
                style={{
                  padding: '0.1rem 0.4rem',
                  borderRadius: '3px',
                  background: 'rgba(192,193,255,0.08)',
                  border: '1px solid rgba(192,193,255,0.18)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Briefcase size={10} /> {task.deal.title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions & Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {getPriorityBadge(task.priority)}

        <button
          onClick={onSelect}
          style={{
            padding: '0.3rem 0.6rem',
            borderRadius: '0.35rem',
            background: 'var(--surface-container-high)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'var(--on-surface)',
            fontSize: '0.725rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
          }}
        >
          Details <ChevronRight size={13} />
        </button>

        {/* Action Menu (Three-Dot) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuTaskId(isMenuOpen ? null : task.id);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: '0.2rem' }}
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '160px',
                background: '#1c1f2a',
                borderRadius: '0.4rem',
                padding: '0.3rem',
                border: '1px solid rgba(255,255,255,0.12)',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: 'var(--on-surface)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Edit3 size={13} /> Edit Task
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                  setActiveMenuTaskId(null);
                }}
                style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: 'var(--on-surface)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <CheckCircle2 size={13} /> {isCompleted ? 'Mark Pending' : 'Mark Completed'}
              </button>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPriorityChange('HIGH');
                }}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: '#ffb4ab', border: 'none', fontSize: '0.725rem', cursor: 'pointer' }}
              >
                Set High Priority
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPriorityChange('MEDIUM');
                }}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: '#ffb95f', border: 'none', fontSize: '0.725rem', cursor: 'pointer' }}
              >
                Set Medium Priority
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPriorityChange('LOW');
                }}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: '#c0c1ff', border: 'none', fontSize: '0.725rem', cursor: 'pointer' }}
              >
                Set Low Priority
              </button>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{ padding: '0.4rem 0.6rem', borderRadius: '0.3rem', textAlign: 'left', background: 'transparent', color: 'var(--error)', border: 'none', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Trash2 size={13} /> Delete Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
