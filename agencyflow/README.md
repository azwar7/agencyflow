# AgencyFlow (LeadFlow CRM) 🚀
### Autonomous AI-Powered CRM, Lead Intelligence & Outreach Engine for Modern Agencies

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![n8n](https://img.shields.io/badge/n8n-Workflow_Automation-EA4B71?style=for-the-badge&logo=n8n)](https://n8n.io/)

---

## 🌟 Executive Overview

**AgencyFlow** is a modern, full-stack, multi-tenant B2B CRM and autonomous outreach engine designed specifically for digital marketing agencies, growth consultancies, and software development studios. 

Traditional CRMs are static databases where sales teams manually type notes and copy-paste lead lists. **AgencyFlow reimagines the CRM as an active growth engine**:
- It autonomously discovers qualified local businesses via **n8n workflow pipelines** and places APIs.
- It leverages **generative AI models** (Google Gemini, Hugging Face, Anthropic, OpenAI) to audit target leads and craft personalized 1-to-1 cold outreach copy.
- It orchestrates reliable email delivery via automated webhooks with real-time delivery tracking, callback reconciliation, and duplicate-send safeguards.
- It provides a visual **Kanban pipeline**, multi-tenant workspace isolation, team invitation RBAC, client deliverable review hubs, and comprehensive agency branding controls.

---

## 🏗️ System Architecture & Workflow Flow

```mermaid
graph TD
    A[Lead Discovery Trigger<br/>Query & Location in AgencyFlow] -->|Webhook POST| B[n8n Workflow Automation Engine]
    B -->|Geocoding & Radius Search| C[Places API / Geoapify]
    C -->|Extracted Businesses & Meta| B
    B -->|Ingest Leads via Secure Webhook| D[AgencyFlow Inbound API<br/>/api/integrations/n8n/leads]
    D -->|Strict Workspace Isolation| E[(Neon PostgreSQL Database)]
    
    E -->|Lead Pipeline| F[Interactive Kanban & Table View]
    F -->|AI Pitch Diagnostics| G[Multi-Provider LLM Engine<br/>Gemini / HuggingFace / OpenAI]
    G -->|Personalized 1-to-1 Pitch| H[Email Outreach Composer]
    
    H -->|Approve & Send| I[n8n Outreach Webhook]
    I -->|SMTP / Gmail Relay| J[Prospect's Inbox]
    I -->|Delivery Callback| K[AgencyFlow Status Sync<br/>/api/integrations/n8n/outreach/callback]
    K -->|Update Status & History| E
```

---

## ✨ Key Features & Modules

### 1. 🔍 Autonomous AI Lead Finder (n8n Integration)
- **One-Click Discovery**: Search by business category (e.g. *Gyms, Real Estate, Dental Clinics*) and geographic location directly from the dashboard.
- **Bi-Directional Webhooks**: Secure server-to-server webhook communication with custom authorization headers (`Agencyflow-Auth`).
- **Strict Multi-Tenant Ingestion**: Ingested leads are dynamically assigned to the requesting user's active workspace, preventing data leakage across agencies.
- **Smart Duplicate Prevention**: Automatic deduplication based on business phone numbers, website domains, and emails.

### 2. 🤖 AI Pitch Diagnostics & Cold Outreach Generator
- **Multi-LLM Provider Architecture**: Pluggable support for **Google Gemini**, **Hugging Face Inference API**, **OpenAI**, and **Anthropic Claude** with resilient fallback options.
- **Context-Aware Personalization**: Generates high-converting cold outreach tailored to the lead's niche, website presence, and competitive weaknesses.
- **Dynamic Tone Selection**: Switch between *Professional*, *Conversational*, or *Direct / Value-Focused* pitch styles with one click.
- **Live In-App Editor**: Refine subject lines and body copy with variable interpolation before sending.

### 3. 📬 Enterprise-Grade Outreach Delivery & Protection
- **Synchronous Delivery Verification**: Real-time response inspection ensures the system reports genuine delivery failures (e.g., inactive workflows or invalid webhooks) rather than false successes.
- **Idempotency & Duplicate Send Safeguards**: Built-in safeguards prevent re-sending the same outreach email draft multiple times.
- **Status Badges & History**: Visual indicators for `DELIVERED`, `FAILED`, and `DRAFT` states with sent timestamps.
- **1-Click Follow-Up Composer**: Compose fresh follow-up drafts after previous emails are delivered.

### 4. 📊 Kanban Pipeline & Comprehensive Lead Management
- **Smooth Drag-and-Drop Kanban**: Seamlessly progress leads across stages:
  - `NEW` ➔ `CONTACTED` ➔ `QUALIFIED` ➔ `PROPOSAL_SENT` ➔ `WON` ➔ `LOST`
- **Dual View Modes**: Switch effortlessly between the interactive Kanban Board and a high-density Table View.
- **Detailed Lead Drawer**: Complete view of lead contact information, AI pitch analysis, delivery logs, communication history, and custom tags.

### 5. 🏢 Multi-Tenant Workspaces & Role-Based Access (RBAC)
- **Data Isolation**: Multi-tenant database architecture where all leads, clients, deals, and settings are strictly partitioned per workspace.
- **Team Permissions**: Granular roles including `OWNER`, `ADMIN`, `MANAGER`, and `SALES_REP`.
- **Team Invitations**: Secure tokenized invite links (`/accept-invite?token=...`) with email onboarding.

### 6. 🎨 Premium Modern UI / UX Design System
- **Curated Aesthetics**: Built with high-contrast dark mode, glassmorphic card overlays, fluid micro-interactions, and tailored typography.
- **Adaptive Side Navigation**: Independent dual-pane scrolling ensures navigation sidebars stay locked while content scrolls smoothly.
- **Responsive Layout**: Designed for seamless operation across desktop workstations, tablets, and mobile devices.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Server Components & Client Hooks), [React 19](https://react.dev/), TypeScript |
| **Styling** | Vanilla CSS Design System, Custom Tokens, CSS Variables, Glassmorphism, Micro-animations |
| **Icons & Media** | [Lucide React](https://lucide.dev/) Icons |
| **Backend & API** | Next.js API Route Handlers, [Zod](https://zod.dev/) Schema Validation, JWT Authentication, Custom Rate Limiter |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) (Hosted on [Neon](https://neon.tech/) Serverless with PgBouncer Pooling), [Prisma ORM](https://www.prisma.io/) |
| **Caching & Rate Limiting** | [Upstash Redis](https://upstash.com/) REST API |
| **Automation Engine** | [n8n](https://n8n.io/) Cloud / Self-Hosted Workflow Engine |
| **AI / Machine Learning** | Google Gemini API, Hugging Face Inference API, Anthropic Claude, OpenAI |
| **Places Data APIs** | Geoapify Places API, Google Places API |

---

## 📂 Project Structure

```text
agencyflow/
├── prisma/
│   └── schema.prisma              # Database schema (Multi-tenant Workspace, User, Lead, Outreach, Activity)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── integrations/
│   │   │   │   └── n8n/           # Inbound lead ingestion & outreach delivery callback endpoints
│   │   │   └── v1/                # REST API: leads, outreach, AI generation, settings, team
│   │   ├── leads/                 # Kanban pipeline & detail drawer view
│   │   ├── settings/              # Multi-section workspace & integration management
│   │   ├── team/                  # Team management & role administration
│   │   └── layout.tsx             # Root layout & theme configuration
│   ├── components/                # Reusable UI cards, modals, app shell, navigation
│   └── lib/
│       ├── integrations/n8n/      # n8n auth, payload schemas, and multi-tenant resolution service
│       ├── ai/                    # Multi-provider LLM connector (Gemini, HuggingFace, OpenAI)
│       ├── auth-session.ts        # Secure JWT multi-tenant session extractor
│       ├── prisma.ts              # Singleton Prisma Client with connection pooling
│       └── rate-limiter.ts        # Upstash Redis rate limiting utility
└── .env.example                   # Environment configuration template
```

---

## 🚀 Quickstart & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/azwar7/agencyflow.git
cd agencyflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root by referencing `.env.example`:

```env
# Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-pooler.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://username:password@ep-direct.aws.neon.tech/neondb?sslmode=require"

# Authentication & Session
JWT_SECRET="your-secure-jwt-secret"
NEXTAUTH_URL="http://localhost:3000"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# AI Provider Configuration
AI_PROVIDER="gemini" # 'gemini' | 'huggingface' | 'openai' | 'anthropic' | 'mock'
GEMINI_API_KEY="your-gemini-api-key"
HUGGINGFACE_API_KEY="your-huggingface-api-key"

# Automation Engine (n8n Webhook Endpoints)
N8N_INTEGRATION_SECRET="your-secure-integration-token"
N8N_WEBHOOK_URL="https://your-n8n.app.n8n.cloud/webhook/find-leads"
N8N_WEBHOOK_OUTREACH_URL="https://your-n8n.app.n8n.cloud/webhook/send-outreach"
```

### 4. Run Prisma Database Migrations
```bash
npx prisma generate
npx prisma db push
```

### 5. Launch the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Data Privacy

- **Zero Hardcoded Secrets**: All API keys, credentials, and tokens are stored server-side via environment variables.
- **Tenant Isolation**: Every database read and write query enforces workspace boundaries (`workspaceId`).
- **Signature & Header Verification**: Webhook callbacks verify custom authorization tokens (`Agencyflow-Auth`) to prevent spoofing.
- **Input Sanitization**: All inbound data payloads are strictly parsed and sanitized using Zod schemas.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use it for personal and commercial projects.
