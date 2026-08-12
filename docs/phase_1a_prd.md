# Phase 1A: Product Requirements Document (PRD)

**Project Name:** AgencyFlow  
**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Senior Product Manager  

---

## 1. Executive Summary

### Product Vision
To empower B2B service agencies and mid-sized sales teams with an effortless, high-velocity lead management platform that turns raw prospect interactions into predictable revenue.

### Mission
Eliminate software clutter, bloated seat pricing, and steep learning curves associated with legacy CRMs by delivering a streamlined, multi-tenant SaaS application that optimizes lead-to-deal conversion rates.

### Business Objectives & Success Metrics
* **Lead Conversion Speed:** Increase average lead qualification response time by 45%.
* **User Adoption:** Achieve 95%+ daily active rep logging compliance through friction-free fast-action UI workflows.
* **Upwork Portfolio Impact:** Demonstrate enterprise-grade software engineering capability (Multi-tenancy, RBAC, AI scoring, robust state handling).

### Target Audience
Primary: B2B Service & Digital Marketing Agencies (5–30 staff).  
Secondary: IT Consulting firms, professional services, and high-touch B2B sales teams.

---

## 2. Product Overview

* **Product Name:** AgencyFlow
* **Tagline:** High-Velocity Lead & Pipeline Management for Modern Agencies.
* **Core Value Proposition:** Intuitive drag-and-drop sales pipeline management coupled with AI-powered lead qualification scoring and zero-latency activity tracking.
* **Key Differentiators:**
  1. Multi-tenant workspace data isolation.
  2. Pragmatic AI features (Objective score + contextual follow-up drafting).
  3. Comprehensive UI state system (Loading, Empty, Error, Permission-Denied, Offline, Success).

---

## 3. Business Requirements

### Business Goals
* Provide clear revenue pipeline visibility for Agency Owners and Managers.
* Enforce strict workspace and role-based data boundaries across team members.
* Eliminate manual data entry friction for Sales Representatives.

### Constraints & Assumptions
* **Solo Developer Feasibility:** Architecture must be clean, modular, and maintainable by a single engineer without microservice overengineering.
* **Tech Stack Standard:** Next.js 15 App Router, TypeScript, Vanilla CSS Token System, PostgreSQL with Prisma ORM.

---

## 4. Detailed User Personas

1. **Agency Owner (Sarah):** Needs high-level executive analytics, workspace setup controls, user invitation management, and system audit logs.
2. **Sales Manager (Marcus):** Needs pipeline stage oversight, deal reassignment capabilities, team conversion metrics, and stage-aging alerts.
3. **Sales Representative (Alex):** Needs rapid lead creation, Kanban stage drag-and-drop, inline call/email note logging, and task reminders.
4. **Administrator (System Admin):** Oversees workspace provisioning, global roles, system monitoring, and compliance logs.

---

## 5. Functional Requirements Matrix

| Requirement ID | Module | Feature Description | Priority | Target Role | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-01** | Authentication | Workspace Sign-up / Sign-in | MVP (P0) | All | User can create an organization workspace and register as workspace Admin with JWT session cookies. |
| **FR-AUTH-02** | Authentication | Role-Based Authorization | MVP (P0) | All | System enforces RBAC (Admin, Manager, Rep) across all API routes and UI actions. |
| **FR-DASH-01** | Dashboard | Executive Metrics Overview | MVP (P0) | Owner/Manager | Displays live stats for total pipeline value, active deals, win rate %, and monthly revenue trend. |
| **FR-LEAD-01** | Leads | Lead Management & Table | MVP (P0) | All | Filterable table showing lead name, company, score, status, owner, and date added. |
| **FR-LEAD-02** | Leads | Lead Status Lifecycle | MVP (P0) | Rep/Manager | Status can transition between: *New, Contacted, Qualified, Unqualified, Converted*. |
| **FR-DEAL-01** | Pipeline | Drag-and-Drop Kanban Board | MVP (P0) | Rep/Manager | Deals can be dragged across pipeline stages (*Discovery, Proposal, Negotiation, Closed Won, Closed Lost*). |
| **FR-DEAL-02** | Pipeline | Stage Value & Count Headers | MVP (P0) | All | Each Kanban column dynamically calculates total deal count and aggregated monetary value. |
| **FR-ACT-01** | Activities | Note & Call Activity Logging | MVP (P0) | Rep/Manager | Timeline view of notes, calls, and email activities attached to leads and deals. |
| **FR-TASK-01** | Tasks | Task Management & Reminders | MVP (P0) | Rep/Manager | Reps can create tasks with due dates, priority tags, and mark completion directly from lead drawer. |
| **FR-AI-01** | AI Assistant | AI Lead Scoring & Summary | MVP (P0) | All | Calculates 1-100 qualification score with bulleted key insights based on lead properties and activity logs. |
| **FR-AI-02** | AI Assistant | AI Follow-up Draft Generator | MVP (P0) | Rep/Manager | Generates contextual follow-up email copy tailored to the lead's current deal stage and past notes. |

---

## 6. Non-Functional Requirements (NFRs)

* **Performance:** Sub-200ms API response time for data fetching; initial page load under 1.2 seconds.
* **Security:** CSRF protection, secure HTTP-only cookies, password hashing with bcrypt/argon2, strict SQL injection and XSS prevention via Prisma and Zod schema parsing.
* **Accessibility:** Full WCAG 2.1 AA compliance including keyboard navigation for Kanban boards and drawer modals.
* **Mobile Responsiveness:** Fluid layout supporting breakpoints from 320px up to 4K displays.
* **Data Privacy:** Strict `workspace_id` scoping on every database query to prevent cross-tenant data leaks.

---

## 7. Core User Stories

### US-01: Executive Pipeline Visibility
* **As an** Agency Owner,  
* **I want to** view an executive dashboard with active pipeline values and team conversion metrics,  
* **So that** I can forecast revenue and identify sales bottlenecks.  
* *Acceptance Criteria:* Metrics load in <300ms, reflect real-time database state, and filter by date range.

### US-02: Rapid Drag-and-Drop Deal Movement
* **As a** Sales Representative,  
* **I want to** drag a deal card from "Proposal Sent" to "Closed Won" on a visual Kanban board,  
* **So that** deal stages are updated instantly without opening tedious forms.  
* *Acceptance Criteria:* Optimistic UI update on drop; API syncs in background; displays error toast and reverts card position if API fails.

### US-03: AI Lead Qualification Summary
* **As a** Sales Manager,  
* **I want the AI** to evaluate a lead's profile and recent call logs to generate a qualification score and summary,  
* **So that** my sales team prioritizes high-intent prospects first.  
* *Acceptance Criteria:* Scoring algorithm returns score 1–100, rationale bullets, and suggested next steps within 1.5 seconds.

---

## 8. CRM Business & Operational Rules

1. **Tenant Data Boundary:** All queries MUST contain `WHERE workspace_id = current_user.workspace_id`.
2. **Lead Conversion Rule:** Converting a lead creates a linked **Contact**, an optional **Company**, and an initial **Deal** in stage 1 (*Discovery*).
3. **Closed Deal Integrity:** Moving a deal to *Closed Lost* mandates entering a Loss Reason from a standardized picklist + optional text.
4. **Ownership Rules:** Sales Reps can only edit deals/leads assigned to them, while Sales Managers and Owners can view, edit, and reassign any deal in the workspace.

---

## 9. Scope Boundaries

### MVP Scope (Current Release)
* Authentication, Workspace Onboarding, RBAC (Owner, Manager, Rep).
* Lead Directory, Contact & Company records.
* Visual Kanban Pipeline & Data Table views.
* Activity Logging (Notes, Calls) & Task Management.
* AI Lead Score & AI Follow-Up Generator.
* Standardized UI states (Loading, Empty, Error, Permission-Denied, Success).

### Post-MVP (V1.5 & Future)
* Custom stage builder per workspace.
* External webhooks (Zapier/Make integration).
* Native email sending via SMTP/SendGrid.

---

## 10. Deliverables Breakdown

1. Complete Next.js 15 web application repository.
2. PostgreSQL Prisma Schema & Database Migration files.
3. Vanilla CSS Design System with global tokens and dark/light modes.
4. Seed script providing rich fictional demo data (Agencies, Leads, Deals, Tasks, Activities).
5. Comprehensive documentation walkthrough and Upwork portfolio presentation guide.
