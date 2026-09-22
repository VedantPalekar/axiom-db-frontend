# AxiomDB Frontend — Technical Reference

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data fetching | React Query / polling hooks |
| Runtime | Backend `localhost:8001`, Frontend `localhost:3000` |

---

## Project Structure

| Layer | Responsibility |
|---|---|
| `app/(marketing)/` | Landing page route group — no app shell, own layout with Navbar |
| `app/(marketing)/page.tsx` | Public landing page at `/` |
| `app/dashboard/` | Operational dashboard (moved from `/` → `/dashboard`) |
| `app/` | All other app route pages and shell files |
| `lib/api.ts` | All network request logic — single source of truth |
| `lib/types.ts` | Shared TypeScript interfaces mirroring backend response shapes |
| `lib/utils.ts` | Pure formatting helpers (`formatDate`, `formatRelativeTime`, etc.) |
| `hooks/` | Data fetching, polling, and mutation hooks (React Query wrappers) |
| `components/landing/` | Landing page components (Navbar, Hero, pipeline visual, sections, Footer) |
| `components/` | Cards, tables, badges, modals, and layout shell |

---

## Design Tokens

| Token | Value |
|---|---|
| App background | `#fdf6ec` (cream) |
| Surface | White |
| Borders | Soft gray (`border-stone-200`) |
| Corners | `rounded-xl` |
| Shadows | `shadow-sm` / `shadow-md` |

Rules: clean surfaces, no gradients, no motion. Cards for summary state, tables for dense data, modals/side panels for detail views. Left sidebar nav. All new components must match this language exactly — extend, never replace.

---

## Route Groups

### Landing Page (`/`)
Public marketing page. No app shell, no sidebar. Owns its own layout at `app/(marketing)/layout.tsx` which mounts the `Navbar`. Sections: Hero, Problem, How It Works, Three Surfaces, Intelligence, Tech Stack, Footer. Dark/light theme toggle lives in the Navbar — persisted via `next-themes`.

### Dashboard (`/dashboard`)
Previously at `/`. Moved to `/dashboard` to free `/` for the landing page. Sidebar link updated accordingly.
Polls `/audit`, `/streams` every 5s. Polls `/status`, `/escalations` every 10s. Shows pipeline health, audit entries, stream counts, escalations.

### Proposals
Polls `/proposals/pending` every 5s. Detail via `/proposals/{id}`. Actions: approve (`/proposals/{id}/approve`), reject (`/proposals/{id}/reject` — reason required). The modal is status-aware: action buttons are only visible when `status === "pending_approval"`; other states show contextual banners (executing, completed, etc.).

### Profiling
Form → POST `/profile`. List from `/profiles`. Detail from `/profile/{report_id}`. Anomalies shown with severity. Refresh list after submit.

### Connections
Form → POST `/connect`. List from `/connections`. Detail/status from `/connections/{connection_id}`. Poll for async status: `pending → ingesting → profiling → ready / failed`.

---

## API Layer

**Base URL:** `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1`

Rules:
- No invented endpoints or fields
- Typed responses, validated before render
- All request logic lives in `lib/api.ts` — no `fetch`/`axios` inside components
- Network errors must surface as UI errors, not crashes or console logs
- Null/undefined handled defensively — never render the string `"null"` or `"undefined"` to the user
- Accept either `{ count, connections[] }` or raw array from `/connections` for resilience

---

## Polling Policy

| Screen | Target | Interval |
|---|---|---|
| Dashboard | audit, streams | 5s |
| Dashboard | status, escalations | 10s |
| Proposals | pending proposals | 5s |
| Connections | connection list/status | 5s |
| Connection detail (health) | `/connections/{id}/health` | 30s |
| Connection detail (live table) | `/tables/live` | 30s |
| Connection detail (re-profile active) | `/connections/{id}` | 3s |
| Profiling | reports list | 10s |

Polling must clean up on unmount — no memory leaks, no stale intervals. React Query's `refetchInterval` is the approved mechanism. Never use raw `setInterval` in components.

---

## Shared Types (`lib/types.ts`)

Covers: pipeline status, audit entries, stream metrics, escalations, proposal summaries, proposal detail (including new fields), profiling reports, anomalies, connections, connection health, live table data, re-profile response.

**Key interfaces added in Phase 1–3:**

```ts
// Phase 1 — Health endpoint
ConnectionHealthTable { table_name, schema, anomaly_count, status }
ConnectionHealthResponse { connection_id, health_score, status, total_anomalies,
  critical_count, warning_count, tables_found, tables[], last_profiled_at,
  db_name, connection_hint }

// Phase 1 — Live table endpoint
LiveTableColumn { name, type, nullable }
LiveTableResponse { table_name, schema, columns[], rows[], total_rows,
  returned_rows, anomaly_columns[], last_profiled_at }

// Phase 2 — New proposal fields (optional to maintain backward compatibility)
ProposalSummary/ProposalDetail extends with:
  fix_type?          "DELETE" | "UPDATE" | "INSERT" | "OTHER"
  highlighted_columns?  string[]
  anomaly_type_label?   string
  fix_sql_display?      string   // {table} already substituted, safe to display

// Phase 3 — Re-profile
ReProfileResponse { connection_id, status, message }
```

---

## UI States (required on every screen and component)

`loading` → `empty` → `error` → `success`

Every component must handle all four. Loading uses `<LoadingSkeleton>`. Error surfaces the backend message string. Empty shows a contextual `<EmptyState>`. Never silently swallow an error.

---

## Reusable Components

App shell, sidebar, header, card, table, badge, section header, empty state, loading state, modal / side panel, severity badge, confidence badge.

---

## Phase 1 — Health Card & Live Table Viewer (April 21, 2026)

### New endpoints integrated
- `GET /connections/{connection_id}/health` — database health score and per-table breakdown
- `GET /tables/live?connection_id=&table_name=&schema=&limit=` — live rows with column metadata and anomaly column flags

### New files created

#### `components/connections/health-card.tsx`
Renders the health score for a connection using a large colored number:
- Score ≥ 80 → green (`text-emerald-600`)
- Score 50–79 → amber (`text-amber-500`)
- Score < 50 → red (`text-rose-600`)

Displays: `health_score`, `status` label ("clean" / "partial" / "dirty"), `critical_count`, `warning_count`, a per-table breakdown table showing each table's anomaly count and a clean/dirty badge, and the `last_profiled_at` value formatted as relative time using `formatRelativeTime()`.

Polling: 30-second `refetchInterval` via `useConnectionHealth` hook. Lifecycle cleanup handled by React Query on unmount.

Props:
```ts
connectionId: string
onReProfileClick?: () => void   // added Phase 3
isReProfiling?: boolean          // added Phase 3
```

#### `components/connections/live-table-viewer.tsx`
Renders live rows from the target database in a clean data table.

Key behaviors:
- **Table selector:** Dropdown populated from the health response `tables[]` array. Default selection is the first dirty table; falls back to first table if all are clean.
- **Anomaly highlighting:** Cells belonging to `anomaly_columns` receive `bg-amber-50/60` background. Text is unchanged — only the cell background is highlighted.
- **Column headers:** Show the column `type` and a `NULL` badge if `nullable: true`.
- **NULL rendering:** A `null` value from the backend renders as a grey italic `NULL` pill — never the plain text string "null".
- **Binary rendering:** A column with `bytea`-related type that returns `null` renders as a grey `binary` badge.
- **Row count:** Shows "Showing N of M rows" at the top using `returned_rows` and `total_rows`.
- **States:** loading skeleton, empty ("No rows found"), error with backend message.

Polling: 30-second `refetchInterval` via `useLiveTable` hook.

### New hooks added (`hooks/use-connections.ts`)

```ts
useConnectionHealth(connectionId: string | null)
  // queryKey: ["connection-health", connectionId]
  // refetchInterval: 30000
  // enabled only when connectionId is truthy

useLiveTable(connectionId, tableName, schema)
  // queryKey: ["live-table", connectionId, tableName, schema]
  // refetchInterval: 30000
  // enabled only when both connectionId and tableName are truthy
```

### New API methods (`lib/api.ts`)

```ts
axiomApi.getConnectionHealth(connectionId: string) → ConnectionHealthResponse
axiomApi.getLiveTable(connectionId, tableName, schema?, limit?) → LiveTableResponse
```

### New utility (`lib/utils.ts`)

```ts
formatRelativeTime(dateStr: string | null | undefined): string
// Returns "just now", "5 minutes ago", "2 hours ago", "3 days ago" or "--"
```

### Placement
Both components are rendered inside `ConnectionDetailModal` below the existing progress tracker and related resources section. They appear only when `connection.profiling_report_id` is set (i.e., a profiling run has completed at least once). In Phase 3 this changed from `status === "ready"` to `profiling_report_id` so that health data remains visible even during a re-profile cycle.

---

## Phase 2 — Proposal Detail Enhancements (April 21, 2026)

### New fields from `GET /proposals/{proposal_id}`

Backend now injects four computed display fields into the proposal detail response:

| Field | Purpose |
|---|---|
| `fix_type` | `"DELETE"` / `"UPDATE"` / `"INSERT"` / `"OTHER"` — derived from `fix_sql` |
| `highlighted_columns` | Columns touched by the fix, extracted from `fix_sql` via regex |
| `anomaly_type_label` | Human-readable string e.g. `"NULL Values"` instead of `"null_violation"` |
| `fix_sql_display` | `fix_sql` with `{table}` placeholder already substituted — safe to show directly |

All four are optional on `ProposalSummary` / `ProposalDetail` to maintain backward compatibility with older proposals that pre-date the backend fix.

### Changes to `components/proposals/proposal-detail-modal.tsx`

1. **`fix_sql_display` over `fix_sql`:** The code block in "Proposed Fix" now renders `proposal.fix_sql_display || proposal.fix_sql`. The raw `{table}` placeholder is never shown to the user.

2. **`fix_type` badge:** A colored badge is mounted inline next to the "Proposed Fix" heading. Color mapping:
   - `DELETE` → `bg-rose-50 text-rose-700 ring-rose-200`
   - `UPDATE` → `bg-amber-50 text-amber-700 ring-amber-200`
   - `INSERT` → `bg-emerald-50 text-emerald-700 ring-emerald-200`
   - `OTHER` → `bg-stone-50 text-stone-700 ring-stone-200`

3. **`anomaly_type_label`:** Rendered as a bold subtitle directly beneath `table_fqn` in the "Target" section, above the `failure_categories` pill list.

4. **Data Diff:** Replaced raw `JSON.stringify` dumps of `sample_before` / `sample_after` with the new `<DataDiff>` component (see below).

### Changes to `components/proposals/proposal-table.tsx`

- Added "Operation" column with `fix_type` badge (same color rules as above).
- Enhanced "Failure" column to show `anomaly_type_label` as a bold header above the raw `failure_categories` pills.

### New file: `components/proposals/data-diff.tsx`

Purpose: Renders `sample_before` and `sample_after` as side-by-side data tables rather than raw JSON blobs.

Key behaviors:
- **Column union:** Derives the full column list by merging keys from both `sample_before` and `sample_after` arrays, so both tables are always aligned.
- **`highlighted_columns` highlighting:** Cells belonging to highlighted columns receive `bg-amber-50/60` background — identical to how `anomaly_columns` are shown in the Live Table Viewer, for visual consistency.
- **Legacy `<memory at 0x...>` strings:** Any cell value matching `/^<memory at 0x/` is a serialization artifact from proposals created before the `_sanitize_rows()` backend fix. These are shown as a grey `binary` badge, identical to bytea handling in the Live Table Viewer. The raw memory address string is never shown to the user.
- **NULL values:** Rendered as a grey italic `NULL` pill, not the plain text string.
- **Empty state:** "No sample data available." shown if both arrays are empty.

```ts
interface DataDiffProps {
  sampleBefore: Record<string, unknown>[]
  sampleAfter: Record<string, unknown>[]
  highlightedColumns?: string[]
}
```

---

## Phase 3 — Re-Profile Flow (April 21, 2026)

### Endpoint integrated
`POST /connections/{connection_id}/re-profile`

Accepts credentials (host, port, database, username, password, schemas). Starts a background re-profile job. Returns `{ connection_id, status: "profiling", message }` immediately. Status then transitions: `profiling → ready` (or `failed`).

### New file: `components/connections/re-profile-modal.tsx`

A credentials modal that matches the existing modal style (same `z-50`, `max-w-md`, `shadow-2xl`, `rounded-xl`, `border-stone-200` patterns).

Pre-fill logic:
- `host` — parsed from the first segment of `connection_hint` (`host:port/db`)
- `port` — parsed from the second segment
- `database` — from `connection.db_name`
- `schemas` — from `connection.schema_names` joined by `", "`
- `username` — always empty (never stored by backend)
- `password` — always empty (never stored by backend)

A permanent amber notice block communicates: *"Credentials are required because AxiomDB never stores passwords. The re-profile job will run in the background."*

Form behavior:
- Submit button disabled while `mutation.isPending` or while `username`/`password` are empty.
- On `isPending`: button shows spinner + "Connecting..." label; entire form is disabled.
- On HTTP 400 (connection failed): backend error message shown inline inside the form in a rose alert block. Modal stays open.
- On 200 success: `onSuccess()` callback fires, which closes the modal in the parent. Polling takes over from there.

Credentials are never logged or stored anywhere in the frontend.

### Changes to `hooks/use-connections.ts`

```ts
// useConnection now accepts an optional custom poll interval
useConnection(connectionId: string | null, customPollInterval?: number)

// New mutation hook
useReProfileConnection()
  // mutationFn: ({ id, body }) => axiomApi.reProfileConnection(id, body)
  // onSuccess: invalidates ["connections"] and ["connections", id]
```

### Changes to `components/connections/connection-detail-modal.tsx`

This component now manages the full re-profile lifecycle:

**Dynamic poll interval:**
```ts
const [pollInterval, setPollInterval] = useState(5000);
// Drops to 3000ms when status is: pending | connected | ingesting | profiling
// Returns to 5000ms when status is: ready | failed
```

**Status transition watcher (`useEffect`):**
Uses a `useRef` (`prevStatusRef`) to track the previous connection status across renders. On status change:
- `profiling → ready`: fires a `toast.success`, then invalidates `["connection-health", connectionId]` and `["live-table", connectionId]` query keys — forcing HealthCard and LiveTableViewer to refetch with fresh data automatically.
- `profiling → failed`: fires a `toast.error` with the `error` field from the connection object.

The watcher only compares `connection.status` and `connection.error` in its dependency array — no unnecessary re-triggers.

**Re-Profile button:**
Mounted in `HealthCard` via `onReProfileClick` prop. When the modal submits successfully, the modal closes and the button immediately reflects the in-progress state:
```ts
isReProfiling={["pending", "connected", "ingesting", "profiling"].includes(connection.status)}
```
Button label switches to "Profiling..." and is disabled during any non-ready status.

**HealthCard + LiveTableViewer visibility:**
Both components render whenever `connection.profiling_report_id` is set — not gated on `status === "ready"`. This ensures they remain visible during re-profile cycles so the operator can see the last known health data while the new profile runs.

### New API method (`lib/api.ts`)

```ts
axiomApi.reProfileConnection(connectionId: string, body: ConnectRequest) → ReProfileResponse
// POST /connections/{connectionId}/re-profile
```

### Toast notifications

Uses `sonner` (already in `package.json`, `<Toaster>` already in `app/providers.tsx`). Two call sites:
- `toast.success("Database re-profiled successfully", { description: "..." })`
- `toast.error("Re-profiling failed", { description: connection.error || "..." })`

---

## Phase 4 — Status-Aware Proposal Detail (April 22, 2026)

### Status-aware `ProposalDetailModal`

The modal now dynamically updates its footer and header based on the proposal's `status` to prevent invalid state transitions (e.g., approving a fix that is already executing).

#### Header Enhancements
- **Live Status Badge:** A colored badge is mounted in the header next to the title.
- **Animated Spinner:** The badge includes a `Loader2` spinner when `status === "executing"`.

#### Footer Logic (`renderFooter`)
The footer replaces the interactive buttons with contextual informative banners for all non-pending states:

| Status | UI Component | Content |
|---|---|---|
| `executing` | Blue Banner + Spinner | "Fix is being applied..." — informs user execution is in progress. |
| `completed` | Emerald Banner + Check | "Fix applied successfully" — confirms successful execution. |
| `failed` | Rose Banner + Alert | "Execution failed" — directs user to the audit log for details. |
| `approved` | Stone Badge + Check | "Approved by {user} · {time}" — read-only decision record. |
| `rejected` | Rose Banner + X | "Rejected by {user} · {time}" + Rejection Reason. |
| `pending_approval` | Action Buttons | Show "Approve Fix" and "Reject" buttons (original behavior). |

#### Color Mapping
- `executing`: `bg-blue-50 text-blue-700 ring-blue-200`
- `completed`: `bg-emerald-50 text-emerald-700 ring-emerald-200`
- `failed`: `bg-rose-50 text-rose-700 ring-rose-200`
- `approved`: `bg-stone-100 text-stone-600 ring-stone-200`
- `rejected`: `bg-rose-50 text-rose-600 ring-rose-200`
- `pending_approval`: `bg-amber-50 text-amber-700 ring-amber-200`

---

## State Machine — Re-Profile Flow

```
[Idle]
  User clicks "Re-Profile" button in HealthCard header
        ↓
[Modal Open — Form]
  Pre-filled from connection data
  User enters username + password
  User clicks "Start Re-Profile"
        ↓
[Submitting]
  POST /connections/{id}/re-profile
  Form disabled, spinner shown
        ↓
  ┌── HTTP 400 → inline error, modal stays open → [Modal Open — Form]
  └── HTTP 200 → modal closes
        ↓
[In Progress — Polling at 3s]
  connection.status ∈ { profiling, ingesting, ... }
  HealthCard button shows "Profiling...", disabled
  LiveTableViewer still shows last known data
        ↓
  ┌── status → "failed" → toast.error → [Error]
  └── status → "ready"  → 
        ↓
[Success]
  toast.success fired
  queryClient.invalidateQueries(["connection-health", ...])
  queryClient.invalidateQueries(["live-table", ...])
  HealthCard + LiveTableViewer refetch automatically
  Poll interval returns to 5s
  Button returns to "Re-Profile" (idle)
```

---

## Known Constraints

- **No auth.** Backend endpoints are open. No session or guard logic.
- **Async workflows.** Connections and profiling jobs are not synchronous - UI must not assume immediate final state. Poll and use status transitions.
- **Schema drift.** Any backend contract change must be reflected in `lib/api.ts`, `lib/types.ts`, hooks, and components in that order.
- **CORS** must be enabled on backend for `localhost:3000`.
- **Credentials not stored.** Re-profiling always requires the user to re-enter username and password. Do not pre-fill or cache these.
- **Legacy binary data.** Proposals created before the `_sanitize_rows()` fix (April 21, 2026) may have `<memory at 0x...>` strings in `sample_before`/`sample_after`. The `DataDiff` component handles this defensively.
- **Non-ready health data.** Health and live table data is shown whenever `profiling_report_id` exists, not just when status is `ready`. This allows operators to see the last known state during re-profile cycles.

---

## Session Handoff - Audit Work (April 23, 2026)

### Audit Log UX changes completed

The Audit Log table was upgraded from a flat list to expandable rows with an inline detail panel.

Files touched:
- `components/audit/audit-table.tsx`
- `components/audit/audit-entry-detail.tsx`
- `lib/types.ts`

New detail panel behavior:
- Renders `failure_categories` as human-readable labels under "What was wrong"
- Renders `fix_sql` in a code block under "Fix applied"
- Renders `post_apply_assertions` as a checklist with pass/fail icons and `n/n passed` summary
- Shows `rollback_sql` only when present, collapsed by default
- Shows dry-run banner when `action === "dry_run"`
- Shows execution error block when `action === "failed"`

Defensive handling added:
- `post_apply_assertions` is treated as optional at render time to avoid crashes on older or partial audit rows
- Dry-run rows now show the more accurate fallback copy:
  `No production SQL ran for this dry run.`

### Important audit contract finding

Based on this repo only, the frontend is not stripping any audit fields. It renders whatever `/audit` returns.

However, the local docs are inconsistent:
- `_axiomdb_audit` schema documents `fix_sql`, `rollback_sql`, and `post_apply_json`
- The documented `GET /audit?limit={n}` sample response still shows only the old audit shape and omits those fields
- The frontend currently expects `post_apply_assertions`, while the schema docs still refer to `post_apply_json`

Implication:
- If the Audit Log UI shows "No SQL was recorded for this entry." or no assertions for non-dry-run rows, this is likely a backend/data-contract issue or older audit data, not a frontend transform bug
- For dry-run rows specifically, missing production SQL is expected

### Audit detail route added

New endpoint integrated:
- `GET /audit/{event_id}`

Files touched:
- `lib/api.ts`
- `hooks/use-dashboard.ts`
- `app/audit/[event_id]/page.tsx`

What was added:
- `axiomApi.getAuditEntry(eventId)`
- `useAuditEntry(eventId)`
- Dedicated deep-link page at `/audit/[event_id]`
- Inline links from the Audit Log table to the dedicated detail route

The dedicated page reuses the same `AuditEntryDetail` component as the expandable table rows so both views stay aligned.

### Proposal Data Diff check

The requested proposal diff behavior already exists. No code changes were needed.

Verified in `components/proposals/data-diff.tsx`:
- No frontend slicing of `sample_before` / `sample_after`
- Empty object in `sample_after[i]` renders `Deleted`
- Empty object in `sample_before[i]` renders `Inserted`
- Existing layout already preserves backend row order, so aligned row pairs work as-is

---

## Session Handoff — Landing Page (April 25, 2026)

### Summary

Built a full public landing page for AxiomDB at `/`. The dashboard was moved from `/` to `/dashboard`. Dark/light theme toggle added site-wide.

### Route changes

| Before | After | Reason |
|--------|-------|--------|
| `/` | `/dashboard` | Freed `/` for the landing page |
| — | `/` | New landing page via `app/(marketing)/page.tsx` |

`components/layout/sidebar.tsx` updated: Dashboard `href` changed from `"/"` to `"/dashboard"`. Active-link guard simplified from exact-match `href === "/"` check to `pathname.startsWith(href)`.

### Dark mode infrastructure

**`app/globals.css`**
- Added `@variant dark (&:where(.dark, .dark *))` — Tailwind v4 class strategy, activated when `.dark` is on any ancestor
- Added `.dark {}` block with CSS variables for `--background` (`#0F0F14`), `--foreground`, `--card`, `--border`, `--muted`, etc.

**`app/providers.tsx`**
- Wrapped tree with `ThemeProvider` from `next-themes` — `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`
- Theme persists to `localStorage` automatically; survives page refresh
- `suppressHydrationWarning` was already present on `<html>` in `app/layout.tsx` — required for next-themes, no change needed

**`app/layout.tsx`**
- Added `scroll-smooth` to `<html>` className — the actual scroll root, not a child div

### New route group: `app/(marketing)/`

Route groups in Next.js do not affect URLs. `(marketing)` is purely organizational — it isolates the landing page layout from the app shell.

**`app/(marketing)/layout.tsx`**
- Wraps landing pages in a dark-mode-aware container (`bg-[#FAFAF8] dark:bg-[#0F0F14]`)
- Mounts `<Navbar />` above all marketing page content

**`app/(marketing)/page.tsx`**
- Composes all landing sections in order: Hero → Problem → How It Works → Three Surfaces → Intelligence → Tech Stack → Footer

### New components: `components/landing/`

#### `navbar.tsx`
Client component (`"use client"`). Uses `useTheme` from `next-themes`.

- Logo: `⛊ AxiomDB` text link → `/`
- Nav links: How it Works (`#how-it-works`), Features (`#features`), Stack (`#stack`) — anchor links with smooth scroll
- Theme toggle: sun/moon icon (mounted-guarded to avoid hydration mismatch)
- CTA: "View Demo" → `/dashboard`
- Mobile: hamburger collapses to dropdown drawer at `md` breakpoint

#### `pipeline-visual.tsx`
Server component. Renders the 6-stage pipeline.

- Mobile (`md:hidden`): 2×3 grid, no connectors
- Desktop (`hidden md:flex`): single flex row, nodes connected by `——›` CSS arrows (horizontal line + border-trick arrowhead, no SVG)
- Stage color scheme: Detect (rose), Diagnose (amber), Sandbox (sky), Propose (violet), Apply (emerald), Document (stone)
- Each node: colored number badge + stage name + tech sublabel

#### `hero.tsx`
Server component.

- Eyebrow pill with green dot
- H1: `"Your database / heals itself."` — `text-5xl md:text-7xl font-extrabold`, indigo accent on second line
- Subtitle: full pipeline loop in one sentence
- CTAs: "Watch Demo →" (filled indigo → `/dashboard`), "GitHub" (outlined, inline SVG mark)
- Mounts `<PipelineVisual />` below with an uppercase label

#### `problem-section.tsx`
Server component. Section `id="problem"`.

Three pain points in a left-border typographic stack:
1. Detection gap (rose border) — NULLs creeping silently
2. Institutional amnesia (amber border) — same bug, no history
3. Audit void (violet border) — manual patch, no trail

Each item: colored tag pill + bold headline + body copy. No card grid — purely typographic.

#### `how-it-works.tsx`
Server component. Section `id="how-it-works"`.

6 stage cards in `lg:grid-cols-3 / sm:grid-cols-2` grid. Each card:
- Colored number badge (matching pipeline visual color scheme)
- Stage name
- 2–3 sentence technical description (real mechanism, no vague copy)
- Tech tag pills at bottom in matching colors

Color-coded hover border per card on `transition-colors`.

#### `three-surfaces.tsx`
Server component. Section `id="surfaces"`.

Three cards: Operator Console, Slack Bot, OpenMetadata. Each wrapped in a `BrowserFrame` component (traffic-light dots + URL bar). Mockup content inside each frame:

- **Operator Console**: pipeline health 2×2 grid, 3 audit rows, proposals queue hint
- **Slack Bot**: dark sidebar + amber anomaly card with "Approve"/"Reject" buttons + thread reply
- **OpenMetadata**: breadcrumb, column name, `AxiomDB.healed` chip (rendered as real text, not a skeleton), fix annotation block, metadata stats

All mockup elements use skeleton divs with dark: variants — nothing is lorem ipsum.

#### `intelligence-section.tsx`
Server component. Section `id="features"`.

2×2 grid. Four cards, each with two tiers of copy:
1. RAG Knowledge Base (BookOpen, indigo) — `all-MiniLM-L6-v2` + ChromaDB cosine retrieval
2. Sandbox Safety (FlaskConical, sky) — testcontainers, 500 rows, 3 retries, auto-destroy
3. Recurrence Detection (Repeat2, amber) — `(column_fqn × anomaly_type)` counter
4. Learning from Rejections (RefreshCw, rose) — rejection reason → ChromaDB

Tier 1 (bold, `text-stone-700 dark:text-stone-300`): punchy one-liner. Tier 2 (muted, `text-stone-400 dark:text-stone-500`): exact technical mechanism.

#### `tech-stack.tsx`
Server component. Section `id="stack"`.

Label-column + pill-row layout. Four groups, each color-coded:
- Backend (stone pills): FastAPI, asyncpg, SQLAlchemy async, Pydantic, Docker Compose
- AI / ML (violet pills): Groq LLaMA 3.3 70B, ChromaDB, sentence-transformers, all-MiniLM-L6-v2
- Infrastructure (sky pills): Redis Streams, testcontainers, OpenMetadata, Slack SDK
- Frontend (indigo pills): Next.js 16, TypeScript, Tailwind CSS, React Query, Zustand

#### `footer.tsx`
Server component.

- Top: logo + one-sentence description left, quick-links column right
- Divider
- Bottom: italic quote `"Every fix documented. Every decision auditable."` left, hackathon + year right
- Year computed at render via `new Date().getFullYear()`

### Section ID → Navbar anchor mapping

| Navbar link | Section `id` | Component |
|-------------|--------------|-----------|
| How it Works | `how-it-works` | `HowItWorks` |
| Features | `features` | `IntelligenceSection` |
| Stack | `stack` | `TechStack` |

`problem` and `surfaces` have IDs but are not in the navbar — they scroll naturally with the page.

### Files changed

| File | Change |
|------|--------|
| `app/globals.css` | `@variant dark` + `.dark {}` CSS variables |
| `app/layout.tsx` | Added `scroll-smooth` to `<html>` |
| `app/providers.tsx` | Added `ThemeProvider` wrapping QueryClientProvider |
| `app/(marketing)/layout.tsx` | Dark-mode container + Navbar mount |
| `app/(marketing)/page.tsx` | Full landing page composition |
| `app/dashboard/page.tsx` | Dashboard moved here from `app/page.tsx` (imports updated) |
| `components/layout/sidebar.tsx` | Dashboard href `/` → `/dashboard`, simplified active-link logic |

### Files created

`components/landing/navbar.tsx`, `hero.tsx`, `pipeline-visual.tsx`, `problem-section.tsx`, `how-it-works.tsx`, `three-surfaces.tsx`, `intelligence-section.tsx`, `tech-stack.tsx`, `footer.tsx`

### Files deleted

| File | Reason |
|------|--------|
| `app/page.tsx` | Content moved to `app/dashboard/page.tsx`; `(marketing)/page.tsx` now owns `/` |
| `components/landing/feature-card.tsx` | Unused stub created during route scaffolding, never implemented |
| `components/landing/landing-sidebar.tsx` | Replaced by `navbar.tsx` during design refinement |

---

## Session Handoff — Landing Page Polish (April 25, 2026)

### Summary

Complete visual and interaction overhaul of the landing page. Every section was rewritten from scratch or significantly upgraded. All components now use real animation, real avatar images, and real product copy rather than static mockups or skeleton placeholders.

### New assets

| File | Purpose |
|------|---------|
| `public/assets/axiomLogo.png` | AxiomDB product logo — used in Navbar, Footer, and Slack mockup avatar |
| `public/assets/hinataDP.png` | Operator avatar ("VedantPalekar") — used in the Slack mockup thread |

### New utility: `lib/constants.ts`

Single file for non-env constants shared across components. Currently exports:

```ts
export const GITHUB_URL = "https://github.com/VedantPalekar/axiomdb";
```

Both `Navbar` and `Footer` import from here instead of hardcoding the URL.

---

### New file: `components/HeroPerspectiveGrid.tsx`

Client component. Decorative perspective-grid SVG background for the Hero section. Renders a vanishing-point grid of 50 left-radiating and 50 right-radiating lines masked with a vertical gradient that fades to opaque at the bottom.

Light mode: sky-to-mint gradient base (`#bae6fd → #f0f9ff → #d1fae5`), blue grid lines at `20%` opacity, horizon bloom, bottom fade to `#FAFAF8`.

Dark mode: deep navy base (`#050B10`), blue radial glow top-center, faint teal accent bottom-right, SVG fractal grain texture at `3.5%` opacity, grid lines at `7%` opacity, bottom fade to `#050B10`.

No interactive behavior. `aria-hidden="true"`, `pointer-events: none`, `z-index: 0`.

---

### Rewritten: `components/landing/hero.tsx`

Changed from a server component to a client component (`"use client"`). Now a two-column layout — copy left, visuals right — with a decorative background behind the whole section.

**Left column (copy):**
- Eyebrow badge: `v0.1 · Early Access · Open Source` with blue dot
- H1: `"Autonomous database self-healing."` with a second-line subheadline at lighter weight
- Subtitle paragraph (2 sentences, concrete)
- Two CTAs: "See it in motion" (`/dashboard`, gradient blue) and "How it works" (`#how-it-works`, outlined)
- Trust strip: three guarantee pills (`CheckCircle2` + `Lock` icons) above four design principle labels in small-caps

**Right column (visuals, stacked):**
1. `<HealingCard />` — animated pipeline stepper
2. `<TerminalWindow />` — cycling typewriter terminal

**TerminalWindow** (defined in `hero.tsx`):
- Cycles through 5 `axiomdb` CLI commands with typed responses
- State machine: `typing-cmd → pause → typing-resp → hold` — 42 ms/char for command, 28 ms/char for response, 1600 ms hold
- `prefers-reduced-motion`: skips to the final frame immediately, no animation
- Traffic-light dots, monospace font, `stone-950` dark terminal background

---

### New file: `components/landing/healing-card.tsx`

Client component. Animated 6-stage pipeline tracker displayed in the Hero section's right column.

**Stages:** Detect (Eye), Diagnose (Cpu), Sandbox (FlaskConical), Propose (Lightbulb), Apply (Zap), Document (BookOpen).

**Animation:** `setInterval` every `CYCLE = 1900ms`. On each tick, a blue glowing dot travels down the vertical connector line from the active step to the next (`TRAVEL = 500ms` CSS animation, `healing-dot-travel` keyframe inline in `globals.css`). After travel, the next step becomes active (blue icon bubble, glow ring). Wraps back to step 0.

**Active step styling:** `border-blue-300 bg-blue-200` bubble + `0 0 18px rgba(59,130,246,0.3)` glow. Inactive steps use `border-blue-100 bg-blue-50`.

**Card shell:** `rounded-2xl`, glassmorphism backdrop (`backdrop-blur-xl`, `bg-white/80`), blue border glow (`healing-border-pulse` CSS animation).

`prefers-reduced-motion`: effect hook returns early — no animation, no interval.

---

### Rewritten: `components/landing/how-it-works.tsx`

Changed from a server component to a client component (`"use client"`).

**Animated flow diagram** (new):
- 7 node chips: `OpenMetadata → FastAPI → Redis → LLM · Groq → Sandbox → Human Gate → Production`
- Each chip has a unique color scheme (rose, orange, amber, sky, indigo, blue, emerald)
- A `Connector` component renders between each pair: static line + arrowhead (CSS border trick) + a traveling colored dot when that connector is the active step
- `step` state cycles 0–7 via `setInterval(680ms)`. Steps 0–5 advance the dot; steps 6–7 hold all nodes lit ("pipeline complete")
- Active stage label below the diagram shows `Stage N · StageName` or `✓ Pipeline complete`

**Stage cards** (6 cards, `lg:grid-cols-3`):
- Each card lifts (`-translate-y-0.5`, `shadow-md`) and its border color changes when the diagram reaches its stage
- Colored number badge, bold label, 3–5 sentence technical description (specific mechanisms, not marketing copy), tech tag pills at the bottom
- Color scheme mirrors the flow diagram (rose → amber → sky → blue → emerald → stone)

---

### Rewritten: `components/landing/three-surfaces.tsx`

Changed from a server component to a client component (`"use client"`). Complete rewrite of all three mockups. All are now fully animated.

**Layout change:** Top row is `lg:grid-cols-[1fr_0.65fr]` — Dashboard left (larger), Slack right (narrower). Timeline below as a full-width flat card (no `BrowserFrame`).

#### `DashboardMockup`

8-phase animated incident lifecycle: `idle → incoming → diagnosing → sandboxing → pending → approved → applying → resolved`. Loops back after a 3.8s pause.

- **Sidebar:** 5 nav items; "Approvals" gets an amber badge that fades in during `pending` phase
- **Incident row (INC-4822):** Fades in during `incoming`, status text + dot color transitions through each phase. During active phases, a pipeline trace shows `✓ detect — › diagnose — · sandbox …` inline
- **Metrics bar:** MTTR, AUTO-FIXED, RECURRING — MTTR border + text flashes emerald on `resolved`
- **Status bar:** Remounts each phase (`key={phase}`) to restart `surfaceFadeIn`. Shows colored icon + monospace log line relevant to the current phase. Bouncing dot spinner during `diagnosing`, `sandboxing`, `applying`

#### `SlackMockup`

9-phase animated Slack conversation: `idle → detecting → proposal → question → typing → answer → approving → executing → resolved`. Loops.

Uses real images for avatars (no SVG fallbacks):
- `AxiomAvatar`: `<img src="/assets/axiomLogo.png" />` — rounded-md, `h-6 w-6`
- `UserAvatar`: `<img src="/assets/hinataDP.png" />` — same, displayed as "VedantPalekar"

Cards (defined as sub-components):
- `DetectingCard` — rose left border, key/value grid, spinning blue diagnosis indicator
- `ProposalCard` — amber left border, SQL code block, sandbox + confidence badges, Approve/Reject/Re-sandbox buttons. `approveHighlighted` prop scales + glows the Approve button during `approving` phase. `buttonsHidden` prop removes buttons during `executing`/`resolved`
- `ExecutingCard` — blue left border, spinning indicator, `proposal_id` metadata
- `ResolvedCard` — emerald left border, row count + assertions + audit deep-link, `AxiomDB.healed` tag in small-caps

Thread shows a "is it safe to approve?" question from "VedantPalekar", then the AxiomDB typing indicator (`...` bounce), then AxiomDB's RAG-informed response.

#### `TimelineMockup`

Static. 4 past incidents as a vertical timeline (blue dot + timestamp + description + recurrence badge). Badges: "1st seen" (stone border) or "recurrence ×N" (amber border).

#### Inlined CSS keyframes

Both `DashboardMockup` and `SlackMockup` use `surfaceFadeIn` and `spin` keyframes defined via a `<style>` tag in `ThreeSurfaces`:

```css
@keyframes surfaceFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; } }
@keyframes spin           { to { transform: rotate(360deg); } }
```

---

### Updated: `components/landing/navbar.tsx`

**Auto-hide on scroll:** Tracks `lastScrollY` via `useRef`. Hides (`-translate-y-full`) when scrolling down past 100px; shows on scroll up. Uses `{ passive: true }` listener.

**Frosted glass on scroll:** `scrolled` state (triggers at >20px). Adds `border-b`, `bg-[#FAFAF8]/80`, `backdrop-blur-lg`, and tightens padding (`py-3` vs `py-5`).

**Nav links:** Updated. Now includes 5 links:
- Problem (`#problem`)
- How it Works (`#how-it-works`)
- Surfaces (`#surfaces`)
- Intelligence (`#features`)
- Stack (`#stack`)

**Logo:** Changed from text `⛊ AxiomDB` to `<img src="/assets/axiomLogo.png" />` + text span.

**CTA:** Changed from "View Demo" to "Launch App".

**GitHub URL:** Now imported from `lib/constants.ts`.

---

### Updated: `components/landing/footer.tsx`

**Logo:** Changed from text to `<img src="/assets/axiomLogo.png" />` + text span (same pattern as Navbar).

**GitHub URL:** Now imported from `lib/constants.ts`.

Quick-links column unchanged. Bottom row unchanged.

---

### Files changed (April 25, 2026 polish session)

| File | Change |
|------|--------|
| `components/landing/navbar.tsx` | Auto-hide scroll behavior, frosted glass, updated nav links, logo image, "Launch App" CTA, GitHub URL from constants |
| `components/landing/hero.tsx` | Full rewrite — client component, two-column layout, `HealingCard`, `TerminalWindow`, trust strip |
| `components/landing/healing-card.tsx` | New — animated pipeline step tracker with traveling dot |
| `components/HeroPerspectiveGrid.tsx` | New — decorative SVG perspective grid background |
| `components/landing/how-it-works.tsx` | Full rewrite — animated flow diagram + active stage cards |
| `components/landing/three-surfaces.tsx` | Full rewrite — animated Dashboard, Slack, and Timeline mockups |
| `components/landing/footer.tsx` | Logo image, GitHub URL from constants |
| `lib/constants.ts` | New — `GITHUB_URL` constant |
| `public/assets/axiomLogo.png` | New — AxiomDB logo asset |
| `public/assets/hinataDP.png` | New — operator avatar asset |
