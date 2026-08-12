# Phase 1C: Technical Foundation & Database Architecture

**Project Name:** AgencyFlow  
**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Solution Architect & Principal Engineer  

---

## 1. Domain Model & Entities

```
+-------------------+        1:N        +-------------------+
|   Workspaces      | ----------------> |      Users        |
+-------------------+                   +-------------------+
          |                                       |
          | 1:N                                   | 1:N (Assigned)
          v                                       v
+-------------------+        1:N        +-------------------+
|     Companies     | ----------------> |     Contacts      |
+-------------------+                   +-------------------+
          |                                       |
          | 1:N                                   | 1:N
          v                                       v
+-------------------+        1:N        +-------------------+
|       Leads       | ----------------> |       Deals       |
+-------------------+                   +-------------------+
          |                                       |
          +----------------───┬───────────────────+
                              | 1:N
                              v
                   +-------------------+
                   |    Activities     | (Notes, Calls, System Events)
                   +-------------------+
                              | 1:N
                              v
                   +-------------------+
                   |       Tasks       |
                   +-------------------+
```

---

## 2. Multi-Tenant Architecture & Workspace Isolation

AgencyFlow implements **Logical Tenant Isolation** via a shared database and shared schema model.
* Every database entity (Leads, Contacts, Companies, Deals, Tasks, Activities) contains a mandatory `workspace_id` foreign key indexed for fast querying.
* API handlers extract and verify the `workspace_id` from the user's authenticated session token.
* Database ORM middleware automatically injects `WHERE workspace_id = session.workspace_id` on all CRUD operations, ensuring complete multi-tenant boundary security.

---

## 3. Database Schema Design (Prisma ERD Specification)

### Core Schema Definition (PostgreSQL Datatypes)

#### `Workspaces` Table
* `id`: UUID (PK, default `gen_random_uuid()`)
* `name`: VARCHAR(255) NOT NULL
* `slug`: VARCHAR(100) UNIQUE NOT NULL
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
* `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

#### `Users` Table
* `id`: UUID (PK)
* `workspace_id`: UUID (FK -> `Workspaces.id` ON DELETE CASCADE)
* `email`: VARCHAR(255) UNIQUE NOT NULL
* `password_hash`: VARCHAR(255) NOT NULL
* `full_name`: VARCHAR(255) NOT NULL
* `role`: ENUM (`OWNER`, `MANAGER`, `SALES_REP`) NOT NULL DEFAULT `SALES_REP`
* `avatar_url`: TEXT NULL
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

#### `Leads` Table
* `id`: UUID (PK)
* `workspace_id`: UUID (FK -> `Workspaces.id` ON DELETE CASCADE)
* `assigned_to_id`: UUID (FK -> `Users.id` NULLABLE)
* `first_name`: VARCHAR(100) NOT NULL
* `last_name`: VARCHAR(100) NOT NULL
* `email`: VARCHAR(255) NOT NULL
* `phone`: VARCHAR(50) NULL
* `company_name`: VARCHAR(255) NULL
* `status`: ENUM (`NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`) DEFAULT `NEW`
* `lead_score`: INT DEFAULT 0 (Computed by AI/rules)
* `ai_summary`: TEXT NULL
* `source`: VARCHAR(100) DEFAULT 'Direct'
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

#### `Deals` Table
* `id`: UUID (PK)
* `workspace_id`: UUID (FK -> `Workspaces.id` ON DELETE CASCADE)
* `contact_id`: UUID (FK -> `Contacts.id` NULLABLE)
* `company_id`: UUID (FK -> `Companies.id` NULLABLE)
* `assigned_to_id`: UUID (FK -> `Users.id` NULLABLE)
* `title`: VARCHAR(255) NOT NULL
* `value`: DECIMAL(12, 2) NOT NULL DEFAULT 0.00
* `stage`: ENUM (`DISCOVERY`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST`) DEFAULT `DISCOVERY`
* `loss_reason`: VARCHAR(255) NULL
* `expected_close_date`: DATE NULL
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

#### `Activities` Table
* `id`: UUID (PK)
* `workspace_id`: UUID (FK -> `Workspaces.id`)
* `user_id`: UUID (FK -> `Users.id`)
* `lead_id`: UUID (FK -> `Leads.id` NULLABLE)
* `deal_id`: UUID (FK -> `Deals.id` NULLABLE)
* `type`: ENUM (`NOTE`, `CALL`, `EMAIL`, `MEETING`, `STAGE_CHANGE`) NOT NULL
* `content`: TEXT NOT NULL
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

#### `Tasks` Table
* `id`: UUID (PK)
* `workspace_id`: UUID (FK -> `Workspaces.id`)
* `assigned_to_id`: UUID (FK -> `Users.id`)
* `lead_id`: UUID (FK -> `Leads.id` NULLABLE)
* `deal_id`: UUID (FK -> `Deals.id` NULLABLE)
* `title`: VARCHAR(255) NOT NULL
* `due_date`: TIMESTAMP WITH TIME ZONE NOT NULL
* `priority`: ENUM (`LOW`, `MEDIUM`, `HIGH`) DEFAULT `MEDIUM`
* `status`: ENUM (`PENDING`, `COMPLETED`) DEFAULT `PENDING`
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

---

## 4. Authentication & Role-Based Access Control (RBAC) Matrix

### Auth Strategy
* HTTP-Only, Secure, SameSite=Lax JWT session cookies.
* Passwords hashed using bcrypt (12 salt rounds).

### Role Permission Matrix

| Operation / Feature | Workspace Owner | Sales Manager | Sales Representative |
| :--- | :---: | :---: | :---: |
| **Manage Workspace & Billing** | ✅ | ❌ | ❌ |
| **Invite / Remove Users** | ✅ | ✅ | ❌ |
| **View All Workspace Deals & Leads** | ✅ | ✅ | ✅ |
| **Edit Any Deal / Reassign Owner** | ✅ | ✅ | ❌ (Own deals only) |
| **Delete Leads / Deals** | ✅ | ✅ | ❌ |
| **Execute AI Lead Scoring** | ✅ | ✅ | ✅ |
| **View Workspace Analytics** | ✅ | ✅ | ❌ (Personal stats only) |

---

## 5. End-to-End Data Lifecycle Flows

### Lead Conversion Flow
1. User clicks "Convert Lead" on a Qualified Lead record.
2. System wraps transaction in a SQL atomic unit (`prisma.$transaction`):
   * Create `Contact` record using lead's name, email, and phone.
   * Create `Company` record if `company_name` is present.
   * Create `Deal` in stage `DISCOVERY` linked to Contact & Company.
   * Update `Lead.status` to `CONVERTED`.
   * Log `Activity` of type `STAGE_CHANGE` ("Lead converted to Deal").
3. Transaction commits; UI navigates to newly created Deal detail drawer.
