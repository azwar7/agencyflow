# AgencyFlow Google Stitch Prompt Inventory

This document contains ready-to-paste Google Stitch prompts for all 9 core anchor screens of **AgencyFlow**.

---

## Anchor Screen 1: Executive Agency Dashboard (Primary Anchor)

```text
Design a web application screen for "AgencyFlow", an executive SaaS CRM built for digital service agencies.

CONTEXT:
This is the main internal dashboard for agency owners and sales managers to monitor revenue velocity, lead qualification, project deliverables, and team task deadlines at a single glance.

VISUAL REQUIREMENTS & DESIGN SYSTEM:
- Dark Glassmorphism aesthetic. Background: deep midnight slate (#0b0f19), Card surfaces: translucent midnight obsidian (#111827) with subtle borders (rgba(255, 255, 255, 0.08)).
- Primary Accent: Electric Indigo (#6366f1) with subtle glow effects. Success: Emerald Green (#10b981). Warning: Warm Amber (#f59e0b).
- Typography: Crisp Inter font hierarchy. Bold numeric KPI metrics (1.75rem, ExtraBold 800).
- Header: Top navigation bar featuring organization badge ("Apex Digital Agency"), global search bar (Cmd+K), active role selector pill (Owner / Manager / Sales Rep), and "+ New Lead" / "+ New Deal" primary action buttons.
- Left Sidebar: Vertical navigation (260px wide) with icons and text links: Dashboard (Active state with indigo highlight), Leads Directory, Sales Pipeline, Task Center, AI Copilot, Settings.

LAYOUT & DATA (Use exact data below, NO lorem ipsum):
1. Top KPI Grid (4 Cards):
   - Card 1: "Total Pipeline Value" -> $138,500 (+14% vs last month, 8 active deals).
   - Card 2: "Won Revenue (MTD)" -> $75,000 (Closed contracts this month).
   - Card 3: "Win Rate Ratio" -> 67% (Closed deal conversion rate).
   - Card 4: "Qualified Leads" -> 14 out of 18 prospects.
2. Main Content Area (Two Columns):
   - Left Column (Live Activity Feed): Timeline list of recent agency activities (e.g., "Alex Rivera moved TechFlow Cloud Portal to Contract Negotiation", "Marcus Vance logged discovery call note with Michael Chang", "Sarah Jenkins closed $75k Retainer deal").
   - Right Column (Urgent Task Reminders): List of upcoming tasks with due date badges and priority tags (e.g., "Send MSA proposal to Michael Chang - High Priority", "Follow up with Rachel Green on DTC brand deck - Medium Priority").

UI STATES & RESPONSIVENESS:
- Show subtle loading pulse state indicators where data refreshes.
- Responsive layout: On desktop desktop, display full 260px sidebar and multi-column grid. On mobile, collapse sidebar to bottom navigation bar.
```

---

## Anchor Screen 2: Lead / Sales Pipeline Kanban

```text
Design a web application screen for "AgencyFlow" — Sales Pipeline Kanban Board.

CONTEXT:
Follow the established AgencyFlow design language from the previously generated Dashboard and DESIGN.md. Do not introduce a new visual style.

VISUAL REQUIREMENTS:
- Dark Glassmorphism theme (#0b0f19 background, #111827 card containers).
- 5-Column horizontal Kanban layout for deal stages:
  1. Discovery ($62,000 aggregate, 2 deals)
  2. Proposal Sent ($28,000 aggregate, 1 deal)
  3. Negotiation ($48,500 aggregate, 1 deal)
  4. Closed Won ($75,000 aggregate, 1 deal)
  5. Closed Lost ($18,500 aggregate, 1 deal)
- Column Headers: Stage name, deal count pill, total column value sum in green text.
- Deal Cards inside columns: Deal title ("TechFlow Cloud Portal Redesign"), Company Name ("TechFlow Systems"), Deal Value ($48,500), assigned sales rep avatar, stage movement dropdown selector, and aging warning badge ("14 days in stage").
- Include a pop-up modal overlay for "Capture Loss Reason" over the Closed Lost column (asking why the deal was lost with text input and "Confirm Closed Lost" red button).

DATA:
- TechFlow Cloud Portal ($48,500 - Negotiation)
- Elevate DTC Brand Engine ($28,000 - Proposal Sent)
- Summit Operations Tracking ($62,000 - Discovery)
- TechFlow Q1 Retainer ($75,000 - Closed Won)
```

---

## Anchor Screen 3: Lead & Client Detail Drawer

```text
Design a web application screen for "AgencyFlow" — Lead Directory & Detail Drawer View.

CONTEXT:
Follow the established AgencyFlow design language from DESIGN.md. This view shows a searchable data table of inbound leads on the left, with a slide-over detail drawer on the right.

VISUAL REQUIREMENTS:
- Left Data Table: Columns for Lead Name, Email, Company, AI Qualification Score (e.g. 88/100 Green), Lead Status Badge (QUALIFIED, NEW, CONTACTED, CONVERTED), Acquisition Source, and Action button.
- Right Slide-Over Drawer (520px wide):
  - Header: Prospect name ("Michael Chang"), email, phone number, and status badge.
  - AI Qualification Inspector Card: Gradient box showing "Score: 88/100", bullet points ("Verified corporate email domain", "High-intent budget range $45k-$60k"), and a "Re-Score AI" button.
  - Action Button: Large primary button "Convert to Active Deal ->" (triggers creation of linked Contact, Company, and Deal).
  - Activity Timeline: Logged notes and call logs with timestamps.
  - Fast Activity Logger Input at bottom: Input field to quickly submit a call note with a send icon button.
```

---

## Anchor Screen 4: Agency Project Management

```text
Design a web application screen for "AgencyFlow" — Project Management Overview.

CONTEXT:
Follow the established AgencyFlow design language from DESIGN.md. This screen allows agency managers to oversee active client projects, milestone progress, and team deadlines.

VISUAL REQUIREMENTS:
- Top Metrics: 3 Stat Pills -> "Active Projects: 6", "Milestones On Track: 92%", "Overdue Tasks: 1".
- Main View: Project Card Grid or Table:
  - Project Title: "TechFlow Cloud Portal Re-architecture"
  - Client: TechFlow Systems
  - Progress Bar: 68% Completed (Emerald green fill)
  - Next Milestone: "Phase 3 API Security Audit" (Due Aug 18)
  - Health Status Badge: "ON TRACK" (Green pill) vs "AT RISK" (Amber pill)
  - Assigned Team Avatars: Sarah J., Alex R.
```

---

## Anchor Screen 5: Deliverables & Client Approval Engine

```text
Design a web application screen for "AgencyFlow" — Deliverables & Client Approval Engine.

CONTEXT:
Follow the established AgencyFlow design language from DESIGN.md. Internal agency view for submitting project deliverables for client review and tracking approval statuses.

VISUAL REQUIREMENTS:
- Deliverable List View:
  - File Card: "v2.4_Database_Schema_Architecture.pdf"
  - Associated Project: TechFlow Cloud Portal
  - Version: v2.4 (Latest)
  - Approval Status Pill: "PENDING CLIENT REVIEW" (Amber) vs "APPROVED" (Green) vs "REVISION REQUESTED" (Red)
  - Comments / Feedback Thread: Client notes ("Please update section 3.2 to include OAuth2 details").
  - Action Buttons: "Upload New Version", "Resend Approval Request".
```

---

## Anchor Screen 6: External Client Portal (Client Experience)

```text
Design a web application screen for "AgencyFlow" — External Client Portal.

CONTEXT:
Follow the established AgencyFlow design language, but tailor this layout specifically for external agency clients (e.g. David Miller from TechFlow Systems). It must feel clean, client-facing, transparent, and ultra-professional.

VISUAL REQUIREMENTS:
- Distinct Header: "TechFlow Systems Client Portal • Powered by AgencyFlow".
- Welcome Banner: "Welcome back, David. Here is the real-time status of your Cloud Portal Redesign."
- Milestone Progress Timeline: Interactive visual step tracker (Discovery [Done] -> Architecture [Done] -> Frontend Build [In Progress] -> QA & Launch [Upcoming]).
- Pending Approvals Card: Card highlighting "1 Deliverable Requires Your Sign-off: v2.4 Architecture Spec" with prominent "Approve Deliverable" (Green) and "Request Revision" (Outline) buttons.
- Shared Resources & Invoices: Download links for contracts, project files, and paid invoices.
```

---

## Anchor Screen 7: Proposal & Retainer Builder

```text
Design a web application screen for "AgencyFlow" — Proposal & Retainer Management.

CONTEXT:
Follow the established AgencyFlow design language from DESIGN.md. Internal view for drafting, sending, and tracking digital sales proposals.

VISUAL REQUIREMENTS:
- Proposal List & Detail View:
  - Proposal Title: "Q3 Enterprise WebApp Retainer & Cloud Infrastructure"
  - Client: Elevate Creative Co
  - Value: $28,000 / year
  - Sent Date: Aug 4, 2026 | Expiry Date: Aug 18, 2026
  - Status Badge: "SENT & VIEWED 3X" (Amber)
  - PDF Preview Pane on right with signature status line ("Awaiting e-signature from Rachel Green").
```

---

## Anchor Screen 8: Analytics & Agency Profitability

```text
Design a web application screen for "AgencyFlow" — Agency Performance Analytics.

CONTEXT:
Follow the established AgencyFlow design language from DESIGN.md. High-level financial reporting and sales velocity analytics for agency owners.

VISUAL REQUIREMENTS:
- Charts & Visualizations:
  - Monthly Revenue & Forecast Area Chart (Jan - Dec 2026).
  - Lead Conversion Funnel Bar Chart (Inbound 100% -> Qualified 65% -> Proposal 40% -> Closed Won 25%).
  - Average Deal Size metric card ($38,500 avg).
  - Average Sales Cycle Length (18 days from Lead to Closed Won).
```

---

## Anchor Screen 9: AI Sales Assistant Workspace

```text
Design a web application screen for "AgencyFlow" — AI Sales Copilot Workspace.

CONTEXT:
Follow the established AgencyFlow design language from DESIGN.md. Interactive workspace for AI lead scoring analysis and email draft generation.

VISUAL REQUIREMENTS:
- Left Column (Tone & Strategy Selector): Tone buttons (Standard Professional, Time-Sensitive Decision, Executive C-Suite Briefing), "Generate Follow-up Draft" primary button.
- Right Column (AI Draft Output Card): Subject line box ("Subject: Time-sensitive: Next steps for TechFlow Systems"), formatted email body box, "Copy Copy" button, and confidence score pill ("AI Confidence: 96%").
```
