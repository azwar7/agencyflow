export interface SettingRegistryEntry {
  id: string;
  title: string;
  category: 'General' | 'Team & Access' | 'CRM Configuration' | 'Automation & AI' | 'System & Data' | 'Account';
  tabId: string;
  sectionId?: string;
  description: string;
  keywords: string[];
  roleRequired?: 'OWNER' | 'ADMIN';
  isImplemented: boolean;
}

export interface SettingsCategoryGroup {
  id: string;
  label: string;
  tabs: {
    id: string;
    label: string;
    icon: string;
    description: string;
    isImplemented: boolean;
    roleRequired?: 'OWNER' | 'ADMIN';
  }[];
}

export const SETTINGS_NAVIGATION_GROUPS: SettingsCategoryGroup[] = [
  {
    id: 'general',
    label: 'GENERAL',
    tabs: [
      { id: 'workspace', label: 'Workspace', icon: 'building', description: 'Organization identity, regional preferences, and calendar', isImplemented: true, roleRequired: 'ADMIN' },
      { id: 'profile', label: 'My Profile', icon: 'user', description: 'Personal information, contact info, and avatar', isImplemented: true },
      { id: 'preferences', label: 'Preferences', icon: 'sliders', description: 'Regional overrides and interface behavior', isImplemented: true },
      { id: 'appearance', label: 'Appearance & A11y', icon: 'palette', description: 'Theme, UI density, reduced motion, and accessibility', isImplemented: true },
      { id: 'notifications', label: 'Notifications', icon: 'bell', description: 'Email and in-app alerts matrix by CRM category', isImplemented: true },
    ],
  },
  {
    id: 'team-access',
    label: 'TEAM & ACCESS',
    tabs: [
      { id: 'team-members', label: 'Members & Roles', icon: 'users', description: 'Workspace members, roles, workload, and invites', isImplemented: true, roleRequired: 'ADMIN' },
      { id: 'security-auth', label: 'Security & Auth', icon: 'shield', description: 'Password, active sessions, security policies, and 2FA', isImplemented: true },
    ],
  },
  {
    id: 'crm-config',
    label: 'CRM CONFIGURATION',
    tabs: [
      { id: 'pipeline-stages', label: 'Pipeline & Stages', icon: 'kanban', description: 'Custom deal stages, win probabilities, and pipeline flow', isImplemented: false, roleRequired: 'ADMIN' },
      { id: 'custom-fields', label: 'Custom Fields', icon: 'file-text', description: 'Define custom properties for leads, companies, and deals', isImplemented: false, roleRequired: 'ADMIN' },
      { id: 'lead-routing', label: 'Lead Scoring & Routing', icon: 'target', description: 'Automated ICP scoring weights and round-robin assignment', isImplemented: false, roleRequired: 'ADMIN' },
    ],
  },
  {
    id: 'automation-ai',
    label: 'AUTOMATION & AI',
    tabs: [
      { id: 'webhooks-api', label: 'Webhooks & API Keys', icon: 'webhook', description: 'Inbound webhooks, REST API keys, and endpoint triggers', isImplemented: false, roleRequired: 'ADMIN' },
      { id: 'ai-config', label: 'AI Configuration', icon: 'sparkles', description: 'Gemini model parameters, prompt templates, and scoring criteria', isImplemented: false, roleRequired: 'ADMIN' },
      { id: 'email-templates', label: 'Email Templates', icon: 'mail', description: 'Reusable B2B cold email sequences and signature blocks', isImplemented: false },
    ],
  },
  {
    id: 'system-data',
    label: 'SYSTEM & DATA',
    tabs: [
      { id: 'audit-logs', label: 'Audit Logs', icon: 'history', description: 'Tamper-proof tenant event timeline and compliance history', isImplemented: true, roleRequired: 'ADMIN' },
      { id: 'data-export', label: 'Data Export & Backup', icon: 'download', description: 'Full CSV/JSON exports of leads, clients, deals, and finances', isImplemented: false, roleRequired: 'ADMIN' },
      { id: 'sandbox-seed', label: 'Sandbox & Sample Data', icon: 'database', description: 'Load realistic sample data or reset to clean zero-state', isImplemented: true, roleRequired: 'ADMIN' },
    ],
  },
  {
    id: 'account',
    label: 'ACCOUNT',
    tabs: [
      { id: 'subscription-billing', label: 'Subscription & Billing', icon: 'credit-card', description: 'Manage plan tiers, seat licenses, payment methods, and invoices', isImplemented: false, roleRequired: 'OWNER' },
    ],
  },
];

export const SETTINGS_REGISTRY: SettingRegistryEntry[] = [
  // Workspace Organization
  {
    id: 'ws-name',
    title: 'Workspace Organization Name',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'org-identity',
    description: 'Set your primary business or digital agency trading name.',
    keywords: ['company', 'agency', 'name', 'org', 'organization', 'business'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-logo',
    title: 'Organization Logo & Branding',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'org-identity',
    description: 'Upload or link an image URL for your workspace brand logo.',
    keywords: ['logo', 'brand', 'image', 'avatar', 'icon', 'picture'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-slug',
    title: 'Workspace Tenant Slug',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'org-identity',
    description: 'Unique workspace identifier used for internal routing and portals.',
    keywords: ['slug', 'url', 'tenant', 'subdomain', 'identifier'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-website',
    title: 'Organization Website & Domain',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'org-identity',
    description: 'Public web URL for your company or portfolio.',
    keywords: ['website', 'domain', 'url', 'web', 'link'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-industry',
    title: 'Primary Industry & Company Size',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'org-identity',
    description: 'Specify your agency niche, vertical, and team size bracket.',
    keywords: ['industry', 'niche', 'size', 'vertical', 'employees', 'headcount'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-contact-info',
    title: 'Business Email, Phone & Address',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'org-identity',
    description: 'Official corporate communication details displayed on proposals and invoices.',
    keywords: ['email', 'phone', 'address', 'contact', 'location', 'hq'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },

  // Workspace Regional
  {
    id: 'ws-timezone',
    title: 'Workspace Default Timezone',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'regional-defaults',
    description: 'Default timezone for timestamps, scheduled activities, and project roadmaps.',
    keywords: ['timezone', 'time', 'clock', 'gmt', 'utc', 'est', 'pst'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-currency',
    title: 'Base Currency & Additional Currencies',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'regional-defaults',
    description: 'Select your accounting currency (USD, EUR, GBP, CAD, AUD) and multi-currency options.',
    keywords: ['currency', 'money', 'dollar', 'euro', 'pound', 'aud', 'finance', 'billing'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-date-time-format',
    title: 'Date & Time Formatting (12h/24h)',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'regional-defaults',
    description: 'Standard format for dates (YYYY-MM-DD, DD/MM/YYYY) and clock display.',
    keywords: ['date', 'time', 'format', 'calendar', 'clock', '24h', '12h'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-business-calendar',
    title: 'Business Calendar & Working Hours',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'business-calendar',
    description: 'Configure standard business working days (Mon-Fri) and operating hours.',
    keywords: ['working days', 'hours', 'calendar', 'schedule', 'business hours', 'holidays'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
  {
    id: 'ws-fiscal',
    title: 'Fiscal Year Settings',
    category: 'General',
    tabId: 'workspace',
    sectionId: 'fiscal-settings',
    description: 'Define fiscal year start month and reporting cycle for financial analytics.',
    keywords: ['fiscal', 'financial year', 'tax', 'accounting', 'q1', 'annual'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },

  // Personal Profile
  {
    id: 'user-profile-name',
    title: 'Full Name & Display Identity',
    category: 'General',
    tabId: 'profile',
    sectionId: 'profile-info',
    description: 'Your real full name displayed across task assignments and activity logs.',
    keywords: ['name', 'full name', 'profile', 'identity', 'display name'],
    isImplemented: true,
  },
  {
    id: 'user-profile-contact',
    title: 'Personal Job Title & Phone',
    category: 'General',
    tabId: 'profile',
    sectionId: 'profile-info',
    description: 'Optional direct contact phone number and job title.',
    keywords: ['job title', 'role', 'phone', 'mobile', 'cell'],
    isImplemented: true,
  },

  // Personal Preferences
  {
    id: 'pref-regional-override',
    title: 'Personal Regional Overrides',
    category: 'General',
    tabId: 'preferences',
    sectionId: 'regional-overrides',
    description: 'Choose whether to inherit workspace defaults or use custom timezone/date formatting.',
    keywords: ['timezone override', 'custom timezone', 'date override', 'personal preferences'],
    isImplemented: true,
  },
  {
    id: 'pref-landing-page',
    title: 'Default Landing Page',
    category: 'General',
    tabId: 'preferences',
    sectionId: 'interface-pref',
    description: 'Choose which screen opens immediately after logging in (Dashboard, Leads, Pipeline).',
    keywords: ['landing page', 'home', 'start screen', 'default page', 'dashboard', 'pipeline'],
    isImplemented: true,
  },
  {
    id: 'pref-crm-view',
    title: 'Default CRM View & Filters',
    category: 'General',
    tabId: 'preferences',
    sectionId: 'interface-pref',
    description: 'Set default pipeline layout (Kanban vs Table) and remember filter selections.',
    keywords: ['crm view', 'kanban', 'table', 'remember filters', 'layout'],
    isImplemented: true,
  },

  // Appearance & Accessibility
  {
    id: 'a11y-theme',
    title: 'Color Theme (System, Dark, Light)',
    category: 'General',
    tabId: 'appearance',
    sectionId: 'visual-theme',
    description: 'Select your preferred visual mode or synchronize with your operating system theme.',
    keywords: ['theme', 'dark mode', 'light mode', 'system theme', 'color'],
    isImplemented: true,
  },
  {
    id: 'a11y-density',
    title: 'Interface Spacing Density',
    category: 'General',
    tabId: 'appearance',
    sectionId: 'display-density',
    description: 'Switch between Comfortable (spacious) and Compact (dense table rows).',
    keywords: ['density', 'compact', 'comfortable', 'spacing', 'table padding'],
    isImplemented: true,
  },
  {
    id: 'a11y-motion',
    title: 'Reduced Motion',
    category: 'General',
    tabId: 'appearance',
    sectionId: 'accessibility-controls',
    description: 'Disable non-essential micro-animations, slide transitions, and pulsing card glows.',
    keywords: ['reduced motion', 'animation', 'a11y', 'accessibility', 'motion sensitivity'],
    isImplemented: true,
  },
  {
    id: 'a11y-text-size',
    title: 'Text Scale & High Contrast',
    category: 'General',
    tabId: 'appearance',
    sectionId: 'accessibility-controls',
    description: 'Adjust base typography size (Normal vs Large) and enable high-contrast border outlines.',
    keywords: ['text size', 'font size', 'contrast', 'high contrast', 'legibility'],
    isImplemented: true,
  },

  // Notifications
  {
    id: 'notif-deals',
    title: 'Deal & Pipeline Notifications',
    category: 'General',
    tabId: 'notifications',
    sectionId: 'crm-notif-matrix',
    description: 'Configure email and in-app alerts when deals are won, lost, or moved between stages.',
    keywords: ['deal notification', 'pipeline alert', 'won deal', 'lost deal'],
    isImplemented: true,
  },
  {
    id: 'notif-tasks',
    title: 'Task Assignment & Due Date Alerts',
    category: 'General',
    tabId: 'notifications',
    sectionId: 'crm-notif-matrix',
    description: 'Get notified when urgent tasks are assigned to you or approach their due deadline.',
    keywords: ['task notification', 'task due', 'assignment alert'],
    isImplemented: true,
  },
  {
    id: 'notif-proposals',
    title: 'Proposal Viewed & Signed Alerts',
    category: 'General',
    tabId: 'notifications',
    sectionId: 'crm-notif-matrix',
    description: 'Receive real-time alerts when a client opens or signs a proposal document.',
    keywords: ['proposal signed', 'proposal viewed', 'contract alert'],
    isImplemented: true,
  },
  {
    id: 'notif-invoices',
    title: 'Invoice Payment & Overdue Alerts',
    category: 'General',
    tabId: 'notifications',
    sectionId: 'crm-notif-matrix',
    description: 'Alerts when payments are marked received or when invoices pass their payment due date.',
    keywords: ['invoice notification', 'payment received', 'overdue invoice'],
    isImplemented: true,
  },

  // System & Sandbox
  {
    id: 'system-sample-data',
    title: 'Sandbox Sample Data Management',
    category: 'System & Data',
    tabId: 'sandbox-seed',
    sectionId: 'sample-data',
    description: 'Load realistic digital agency mock datasets or wipe sample data back to clean zero state.',
    keywords: ['sandbox', 'sample data', 'demo data', 'seed', 'reset', 'zero state'],
    roleRequired: 'ADMIN',
    isImplemented: true,
  },
];
