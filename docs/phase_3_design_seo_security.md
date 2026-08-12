# AgencyFlow CRM — Phase 3: Design System, Responsive Layout, SEO, Security, Performance & Integrations

---

## 14. Design System Specification

### 14.1 Visual Philosophy
AgencyFlow is built upon the **"Dark Glassmorphism"** design system, engineered for high-density desktop SaaS applications. It combines deep ambient background layers (`#0f131d`), semi-translucent glass panels with background blur effects (`backdrop-filter: blur(12px)`), vibrant HSL-tailored accent colors (`#c0c1ff` Primary Indigo, `#4edea3` Secondary Emerald, `#ffb95f` Amber), and subtle glowing radial ambient orbs.

### 14.2 Typography & Hierarchy
* **Primary Font Family:** Inter (Google Fonts)
* **Font Weights:** Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)
* **Scale & Line Height Tokens:**
  - `font-headline-lg`: 2rem (32px) / 2.5rem line-height, Bold (700), -0.01em letter-spacing
  - `font-headline-md`: 1.5rem (24px) / 2rem line-height, SemiBold (600)
  - `font-kpi-metric`: 1.75rem–2rem (28–32px) / 2rem line-height, ExtraBold (800), -0.02em letter-spacing
  - `font-body-lg`: 1.125rem (18px) / 1.75rem line-height, Regular (400)
  - `font-body-md`: 1rem (16px) / 1.5rem line-height, Regular (400)
  - `font-label-sm`: 0.875rem (14px) / 1.25rem line-height, Medium (500), 0.05em letter-spacing

### 14.3 Color Palette Tokens
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `background` / `surface-dim` | `#0f131d` | Deep ambient main page backdrop |
| `surface-container-lowest` | `#0a0e18` | Inset contrast panels & input fill |
| `surface-container-low` | `#171b26` | Card fill & subtle container background |
| `surface-container` | `#1c1f2a` | Glass panel default background (`rgba(28,31,42,0.6)`) |
| `surface-container-high` | `#262a35` | Interactive hover states & badge chips |
| `surface-container-highest` | `#313540` | Border highlights & high-contrast containers |
| `primary` | `#c0c1ff` | Primary glowing text, icons & accents |
| `primary-container` | `#8083ff` | Primary button backgrounds & glowing borders |
| `secondary` | `#4edea3` | Success badges, closed-won states & emerald glow |
| `tertiary` | `#ffb95f` | Amber warning badges, e-signature status & pending states |
| `error` | `#ffb4ab` | Red alerts, overdue states & destruction triggers |
| `on-surface` | `#dfe2f1` | Primary text color |
| `on-surface-variant` | `#c7c4d7` | Muted secondary label text |

### 14.4 Spacing & Grid System
* **Spacing Scale:**
  - `stack-sm`: 0.5rem (8px)
  - `stack-md`: 1rem (16px)
  - `stack-lg`: 2rem (32px)
  - `gutter`: 1.5rem (24px)
  - `margin-x`: 2rem (32px)
* **Border Radii Tokens:**
  - `rounded`: 0.25rem (4px)
  - `rounded-lg`: 0.5rem (8px)
  - `rounded-xl`: 0.75rem–1rem (12–16px)
  - `rounded-full`: 9999px (Pill badges, avatars & floating indicators)

### 14.5 Micro-Animations & Interaction Design
* **Glass Panel Blur:** `backdrop-filter: blur(12px)`
* **Hover Transitions:** `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
* **Glowing Radial Orbs:** `background: radial-gradient(circle, rgba(192,193,255,0.15) 0%, transparent 70%)` with `blur-2xl` / `blur-3xl`
* **Shimmer Animation:** Linear gradient shimmer movement for loading states & primary CTA buttons (`@keyframes shimmer`)

---

## 15. Responsive Design Architecture

AgencyFlow enforces a **Desktop-First** strategy optimized for 1440 × 900 viewports while providing responsive breakpoints (`1024px` tablet, `768px` mobile).

### Responsive Behavior for Top 5 Screens

1. **Executive Dashboard (`/dashboard`):**
   - **Desktop (1440px):** 4-card KPI grid + 2-column wide layout (Monthly Revenue Chart left, Activity Feed right).
   - **Tablet (1024px):** 2-card KPI grid, stacked charts and activity feed.
   - **Mobile (768px):** Single-column layout, collateral sidebar collapses into overlay drawer.

2. **Leads Pipeline Kanban (`/leads`):**
   - **Desktop (1440px):** Horizontal 5-column Kanban layout with fixed column widths and drag-and-drop capability.
   - **Tablet (1024px):** Horizontally scrollable Kanban container with swipe snap.
   - **Mobile (768px):** Stage selector tab bar with single active column visible at a time.

3. **Lead Directory & Slide-Over Drawer (`/leads/directory`):**
   - **Desktop (1440px):** High-density data table with 400px fixed right slide-over detail drawer.
   - **Tablet (1024px):** Table converts to touch-friendly card rows; drawer expands to 60% viewport width.
   - **Mobile (768px):** Fullscreen overlay modal drawer on lead selection.

4. **Proposals & Contract Generator (`/proposals`):**
   - **Desktop (1440px):** Master-detail split pane: Left proposal list (380px) + Right document preview (fill space).
   - **Tablet (1024px):** Collapsible left master list toggle.
   - **Mobile (768px):** Tabbed view switching between Proposal Selection and Document Preview.

5. **Performance Analytics (`/analytics`):**
   - **Desktop (1440px):** 2 KPI cards + SVG interactive area chart + staircase lead conversion funnel.
   - **Tablet (1024px):** Full width SVG chart with touch tooltip markers.
   - **Mobile (768px):** Vertically stacked funnel stage progress bars.

---

## 16. Search Engine Optimization (SEO) Strategy

### 16.1 Authenticated vs. Public Routing
* **Authenticated CRM Screens (`/dashboard`, `/leads`, `/projects`, `/proposals`, `/analytics`, `/invoices`):**
  - Configured with `robots: { index: false, follow: false }` to strictly prevent indexing of private customer CRM data.
* **Public Landing & Authentication Pages (`/`, `/login`, `/signup`):**
  - Full SEO optimization enabled.

### 16.2 Meta Tags & Open Graph Architecture
```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'AgencyFlow — Agency CRM & Client Operations Platform',
    template: '%s | AgencyFlow CRM',
  },
  description: 'Enterprise agency CRM for managing leads, proposals, client deliverables, retainers, and AI-powered sales workflows.',
  keywords: ['Agency CRM', 'Client Operations', 'Proposal Generator', 'Lead Management', 'Retainer Management'],
  openGraph: {
    title: 'AgencyFlow — Modern Agency CRM & Operations Platform',
    description: 'Streamline your agency pipeline, proposals, and client portals in dark glassmorphism clarity.',
    url: 'https://agencyflow.io',
    siteName: 'AgencyFlow',
    locale: 'en_US',
    type: 'website',
  },
};
```

### 16.3 Structured Data (JSON-LD)
Added to public root layout:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AgencyFlow",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

---

## 17. Security Architecture

### 17.1 Authentication & Authorization
* **Session Security:** HTTP-Only, SameSite=Lax, Secure JWT tokens stored in encrypted cookies.
* **Role-Based Access Control (RBAC):** Roles enforced across API routes:
  - `SUPER_ADMIN`: Full organization access, subscription management.
  - `AGENCY_MEMBER`: Lead management, proposals, deliverables, analytics.
  - `CLIENT_USER`: Restricted read/sign access to assigned Client Portal (`/clients/portal`).

### 17.2 Multi-Tenant Data Isolation
* **Database Query Isolation:** Every Prisma database query includes `where: { tenantId }` clause to enforce tenant boundaries.
* **API Middleware Validation:** Middleware inspects verified JWT session tokens and attaches `tenantId` to request context prior to route processing.

### 17.3 Threat Mitigation Protocols
* **Input Validation & Sanitization:** Zod schema validation on all incoming API POST/PUT request payloads.
* **XSS Prevention:** React JSX default escaping + DOMPurify for HTML template rendering.
* **CSRF Protection:** Anti-CSRF header validation (`X-Requested-With`) on state-changing API endpoints.
* **Rate Limiting:** Sliding-window rate limiter (100 requests / minute per IP/User) on API routes; 5 requests / minute on auth routes.
* **Audit Logging:** Implemented event logging for security events (login attempts, proposal revocations, client data exports).

---

## 18. Performance Optimization & Infrastructure

### 18.1 Database Query Optimization & Indexing
* **Prisma Indexes:** Indexes created on high-frequency query columns:
  - `Lead`: `[tenantId, status]`, `[tenantId, createdAt]`
  - `Deal`: `[tenantId, stage]`, `[tenantId, value]`
  - `Proposal`: `[tenantId, status]`
* **Query Select Filtering:** Prisma queries fetch only required fields (preventing `SELECT *` payload bloat).

### 18.2 Frontend Code Splitting & Dynamic Imports
* **Lazy Component Loading:** Heavy components (SVG charts, document previews, AI copilot text editors) are dynamically imported using Next.js `dynamic(() => import(...), { ssr: false })`.
* **Font Optimization:** Next.js `next/font/google` for Inter font loading with zero layout shift (CLS = 0).

### 18.3 Performance Benchmarks & Lighthouse Targets
* **First Contentful Paint (FCP):** < 0.8s
* **Largest Contentful Paint (LCP):** < 1.4s
* **Cumulative Layout Shift (CLS):** 0.00
* **Time to Interactive (TTI):** < 1.8s
* **Lighthouse Scores Target:** Performance 95+, Accessibility 100, Best Practices 100, SEO 100.

---

## 19. System Integrations Architecture

### 19.1 Key External Integrations
1. **Google Workspace & Microsoft 365 (Calendar & Email Sync):**
   - OAuth 2.0 integration for two-way synchronization of client meetings and follow-up emails.
2. **DocuSign / Native E-Signature Engine:**
   - Webhook integration listening for `document.signed` events to automatically convert Lead status from `PROPOSAL` to `CLOSED_WON`.
3. **Stripe Billing & Invoicing:**
   - Stripe Connect integration for recurring retainer payments, client portal billing, and webhook processing for invoice settlement.
4. **Google Gemini / OpenAI AI Infrastructure:**
   - Server-side API integration powering the Lead Scoring Engine (`/api/v1/ai/score-lead`) and Sales Copilot (`/api/v1/ai/generate-followup`).
