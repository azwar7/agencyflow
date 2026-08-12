# AgencyFlow Visual Design System (`DESIGN.md`)

**Version:** 1.0.0  
**Status:** Visual Source of Truth  
**Target Platform:** High-Velocity SaaS CRM for B2B Digital Agencies (5–30 Users)  

---

## 1. Brand & Aesthetic Identity

* **Product Name:** AgencyFlow
* **Brand Personality:** Executive, Ultra-Fast, Sleek, Precision-Engineered, trustworthy.
* **Visual Direction:** Modern Dark Glassmorphism with deep navy/slate backgrounds (`#0b0f19`, `#111827`), translucent elevated surfaces (`rgba(31, 41, 55, 0.7)`), crisp indigo glowing accents (`#6366f1`), vibrant emerald status indicators (`#10b981`), and high-contrast typography.
* **Target Audience:** Agency Founders, Account Directors, Sales Managers, and Client Success Leads looking to eliminate deal friction and impress clients with a enterprise-tier portal.
* **Design Principles:**
  1. **Zero Clutter, Maximum Velocity:** High data density without visual overcrowding.
  2. **Explicit UI State Transparency:** Never leave the user guessing; every component explicitly communicates loading, error, empty, offline, or success.
  3. **Role-Tailored Perspectives:** Clear visual differentiation between internal agency management views and external client-facing portals.

---

## 2. Color Palette (Tokens)

| Token Name | Color Description | HEX / HSL Value | Usage Context |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | Deep Midnight Slate | `#0b0f19` | Root page background |
| `--bg-secondary` | Obsidian Card Surface | `#111827` | Navigation sidebar, card backgrounds, modal shells |
| `--bg-surface` | Elevated Translucent Layer | `#1f2937` | Data table rows, hover targets, input fields |
| `--bg-glass` | Blur Glass Header Layer | `rgba(31, 41, 55, 0.75)` | Sticky navigation header with `backdrop-filter: blur(12px)` |
| `--border-color` | Subtle Grid Line | `rgba(255, 255, 255, 0.08)` | Card borders, table dividers, panel splitters |
| `--border-strong` | High Contrast Border | `rgba(255, 255, 255, 0.16)` | Active input focus state, hovered cards |
| `--accent-primary` | Electric Indigo | `#6366f1` | Primary action buttons, active tab indicators, brand icons |
| `--accent-primary-hover`| Deep Violet-Indigo | `#4f46e5` | Primary button hover state |
| `--accent-glow` | Translucent Primary Glow | `rgba(99, 102, 241, 0.25)` | Card focus drop-shadows |
| `--accent-success` | Emerald Green | `#10b981` | Closed Won deals, qualified leads, positive KPIs |
| `--accent-warning` | Warm Amber | `#f59e0b` | Proposal stage, medium priority tasks, aging warnings |
| `--accent-danger` | Crimson Rose | `#ef4444` | Closed Lost deals, unqualified leads, error alerts |
| `--accent-info` | Ocean Blue | `#3b82f6` | Contacted leads, general notification badges |
| `--text-main` | High-Contrast Platinum | `#f9fafb` | Primary headings, table values, modal titles |
| `--text-muted` | Muted Silver Text | `#9ca3af` | Secondary labels, timestamps, metadata text |
| `--text-subtle` | Dark Slate Subtext | `#6b7280` | Disabled inputs, placeholder text |

---

## 3. Typography Hierarchy

* **Font Family:** `Inter`, system-ui, -apple-system, sans-serif
* **Display & Heading Scale:**
  * **H1 Page Titles:** `1.75rem` (28px) / Bold 800 / Line height 1.2 / Letter spacing `-0.02em`
  * **H2 Section Titles:** `1.25rem` (20px) / SemiBold 700 / Line height 1.3
  * **H3 Card Titles:** `1.05rem` (17px) / SemiBold 600 / Line height 1.3
  * **H4 Subsection Labels:** `0.9rem` (14.4px) / Medium 600
* **Body Text:**
  * **Base Body:** `0.875rem` (14px) / Regular 400 / Line height 1.5
  * **Subtext / Meta:** `0.75rem` (12px) / Regular 400 / Line height 1.4
* **KPI Metrics & Numbers:** `1.75rem` – `2.25rem` / ExtraBold 800 / Tabular numbers (`font-variant-numeric: tabular-nums`)
* **Badges & Micro Labels:** `0.7rem` (11.2px) / Bold 700 / Uppercase / Letter spacing `0.05em`

---

## 4. Spacing Scale

* `xs`: `0.25rem` (4px)
* `sm`: `0.5rem` (8px)
* `md`: `1.0rem` (16px)
* `lg`: `1.5rem` (24px)
* `xl`: `2.0rem` (32px)
* `2xl`: `3.0rem` (48px)

---

## 5. Border Radius & Shadows

* **Border Radius:**
  * Small (Buttons, Pills, Badges): `6px`
  * Medium (Inputs, Cards, Dropdowns): `10px`
  * Large (Drawers, Modals, Containers): `16px`
  * Full (Avatars, Status Dots): `9999px`
* **Shadow Elevation:**
  * `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  * `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.1)`
  * `shadow-lg`: `0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)`
  * `shadow-glow`: `0 0 20px rgba(99, 102, 241, 0.35)`

---

## 6. Component Specs & Behavior

1. **Buttons:** Primary (`#6366f1` with glow hover), Secondary (surface border with hover highlight), Danger (`#ef4444`).
2. **KPI Cards:** Glass background, top-right icon badge in translucent tint, large numeric metric, trend delta indicator (+12% green).
3. **Data Tables:** Hoverable rows (`#374151`), sticky column headers, integrated pagination, status badges.
4. **Kanban Cards:** Drag-and-drop shadow lift, stage aging indicator, deal value pill, contact avatar.
5. **Slide-Over Drawers:** Right-aligned slide transition (`translateX(100%) -> 0`), blurred background backdrop, fixed action footer.
6. **Activity Timeline:** Left-bordered vertical timeline with colored event dots (`NOTE`, `CALL`, `STAGE_CHANGE`).

---

## 7. Responsive Breakpoint Rules

* **Desktop (>1024px):** Fixed left navigation sidebar (260px), multi-column grid layouts, 5 visible Kanban columns.
* **Tablet (768px – 1023px):** Icons-only sidebar (80px), horizontally scrollable Kanban board, single-column detail drawers.
* **Mobile (<767px):** Bottom application navigation bar (65px), touch-optimized card stacks, full-screen slide-up modals, collapsible search bar.
