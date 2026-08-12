# Phase 1.5: System Design & API Specifications

**Project Name:** AgencyFlow  
**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Principal Solution Architect  

---

## 1. High-Level System Architecture

```
                                  [Client Layer]
                 ┌──────────────────────────────────────────────┐
                 │ Browser / Mobile Web (Next.js 15 App Router) │
                 └──────────────────────┬───────────────────────┘
                                        │ HTTPS / REST / JSON
                                        ▼
                                 [Network / Edge]
                 ┌──────────────────────────────────────────────┐
                 │ Vercel Edge / Reverse Proxy / SSL Termination │
                 └──────────────────────┬───────────────────────┘
                                        │
                                        ▼
                                 [API Router Layer]
                 ┌──────────────────────────────────────────────┐
                 │  Next.js 15 Route Handlers & Middleware      │
                 │  (Auth Check -> RBAC Middleware -> Zod Val)  │
                 └──────────────────────┬───────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
         [Core Application Logic]                [AI Assistant Service]
┌─────────────────────────────────────────┐  ┌─────────────────────────────┐
│ Services (Leads, Deals, Activities)     │  │ Open Router / Gemini API    │
│ Data Isolation: Tenant Middleware       │  │ (Lead Scoring & Draft Copy) │
└───────────────────┬─────────────────────┘  └─────────────────────────────┘
                    │
                    ▼
         [Database Layer]
┌─────────────────────────────────────────┐
│ PostgreSQL Instance                     │
│ Prisma ORM (Connection Pooler / PgBouncer)│
└─────────────────────────────────────────┘
```

---

## 2. Comprehensive REST API Contracts Matrix (Phase 2A Foundation)

### Auth & Workspace Endpoints

| Method | Endpoint Route | Auth Required | Description | Request Body / Parameters | Success Response (200/201) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | No | Register new user + workspace | `{ name, email, password, workspaceName }` | `{ user, workspace, token }` |
| `POST` | `/api/v1/auth/login` | No | Authenticate user session | `{ email, password }` | `{ user, workspace, token }` |
| `GET` | `/api/v1/auth/me` | Yes | Get current user & workspace profile | None | `{ user, workspace }` |

### Lead Management Endpoints

| Method | Endpoint Route | Auth Required | Description | Request Body / Parameters | Success Response (200/201) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/leads` | Yes | List leads (paginated, filterable) | Query: `status, search, page, limit` | `{ data: Lead[], meta: Pagination }` |
| `POST` | `/api/v1/leads` | Yes | Create new lead | `{ firstName, lastName, email, company }` | `{ data: Lead }` |
| `GET` | `/api/v1/leads/:id` | Yes | Get lead details & activity history | Params: `id` | `{ data: LeadDetail }` |
| `PATCH` | `/api/v1/leads/:id` | Yes | Update lead properties | `{ status, leadScore, assignedToId }` | `{ data: Lead }` |
| `POST` | `/api/v1/leads/:id/convert` | Yes | Convert lead to Contact + Deal | `{ dealTitle, dealValue, stage }` | `{ contactId, dealId }` |

### Sales Pipeline & Deals Endpoints

| Method | Endpoint Route | Auth Required | Description | Request Body / Parameters | Success Response (200/201) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/deals` | Yes | Fetch Kanban board deal groups | Query: `stage, search` | `{ stages: DealColumn[] }` |
| `POST` | `/api/v1/deals` | Yes | Create new deal | `{ title, value, stage, contactId }` | `{ data: Deal }` |
| `PATCH` | `/api/v1/deals/:id/stage` | Yes | Drag-and-drop stage update | `{ stage, lossReason? }` | `{ data: Deal }` |

### Activities & Tasks Endpoints

| Method | Endpoint Route | Auth Required | Description | Request Body / Parameters | Success Response (200/201) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/activities` | Yes | Log call/note/email activity | `{ leadId?, dealId?, type, content }` | `{ data: Activity }` |
| `GET` | `/api/v1/tasks` | Yes | List pending tasks for current user | Query: `status, priority` | `{ data: Task[] }` |
| `PATCH` | `/api/v1/tasks/:id/complete` | Yes | Toggle task completion status | None | `{ data: Task }` |

### AI Assistant Endpoints

| Method | Endpoint Route | Auth Required | Description | Request Body / Parameters | Success Response (200/201) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/score-lead` | Yes | Trigger AI lead scoring analysis | `{ leadId }` | `{ score, breakdown, summary }` |
| `POST` | `/api/v1/ai/generate-followup` | Yes | Generate contextual follow-up email copy | `{ leadId, dealId, tone }` | `{ emailSubject, emailBody }` |

---

## 3. Standardized JSON Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Sales Representatives cannot reassign deal ownership.",
    "details": [
      {
        "field": "assigned_to_id",
        "issue": "Requires Sales Manager or Owner role."
      }
    ]
  },
  "timestamp": "2026-08-11T14:25:00Z"
}
```

---

## 4. Architectural Risk Mitigation Strategy

1. **Multi-Tenant Leak Risk:** Mitigated by enforcing Prisma client extensions that automatically attach `workspace_id` parameters to every SQL execution context.
2. **AI Latency:** Mitigated by executing AI tasks asynchronously via background promises and caching AI scoring results directly on `Leads.lead_score` and `Leads.ai_summary`.
3. **Database Bottlenecks:** Indexing composite fields `(workspace_id, status)` and `(workspace_id, stage)` for sub-50ms query speeds under high deal volume.
