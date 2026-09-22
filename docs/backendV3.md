Here's the session changelog as a markdown document — paste this directly into your repo:

```markdown
# AxiomDB — Session Changelog (Apr 23, 2026)

> Covers all backend and frontend work done in this session.
> Does not repeat anything already documented in axiomdb-technical-source-of-truthV2.md.

---

## 1. Backend Changes

### 1.1 `src/core/config.py`
Added one new setting:
```python
sandbox_diff_rows: int = 20
```
Controls how many changed rows are surfaced in `sample_before`/`sample_after` on proposals. Override via `SANDBOX_DIFF_ROWS` in `.env`. Replaces all previous hardcoded `limit=5` and `[:3]` slices across the codebase.

---

### 1.2 `src/sandbox/executor.py`
**Problem:** `sample_before` and `sample_after` were both produced by `SELECT * FROM table LIMIT 5` with no `ORDER BY`. After an `UPDATE`, Postgres physically moves rows to heap end — so `sample_after` returned a completely different set of rows, making the data diff table in the proposal modal meaningless.

**Changes:**

**New function — `_get_all_rows_sync`**
Fetches all rows from the sandbox table ordered deterministically by `ctid`. Used exclusively for diffing — not for display. Replaces the unordered `LIMIT 5` call.

**Modified function — `_get_sample_sync`**
Now uses `ORDER BY ctid LIMIT n` instead of unordered `LIMIT n`. Used only as a fallback when diff produces zero changed rows.

**New function — `_compute_diff(all_before, all_after, display_limit)`**
Pure function. Diffs before/after row sets using full-row JSON hashing (`json.dumps(row, sort_keys=True)`). No primary key dependency — works for any table schema.

- Rows removed from before-set = modified/deleted before-state
- Rows added to after-set = modified/deleted after-state
- Pads shorter side with `{}` (empty dict) so arrays are equal length
- Frontend renders `{}` as "Deleted" or "Inserted" pill
- Returns `([], [])` if zero rows changed → fallback to deterministic sample
- Result capped at `settings.sandbox_diff_rows`

**Modified — snapshot block in `_run_sandbox_with_assertions_sync` (and `_execute_sandbox_sync`)**
Both occurrences replaced. Old pattern fetched two independent `LIMIT 5` snapshots. New pattern fetches all rows before and after, runs `_compute_diff`, falls back to deterministic sample only if diff is empty.

---

### 1.3 `src/api/proposal_routes.py`
Removed hardcoded `[:3]` slice on `sample_before`/`sample_after` in the re-sandbox endpoint response. Now uses `settings.sandbox_diff_rows` consistently.

Added `from src.core.config import settings` import where missing.

---

### 1.4 `src/db/audit_log.py`
**Problem:** `fetch_recent_audit` SELECT omitted `fix_sql`, `rollback_sql`, and `post_apply_json` — all three exist in `_axiomdb_audit` but were never returned. Frontend had no data to show in audit detail views.

**Changes:**

`fetch_recent_audit` — expanded SELECT to include:
- `fix_sql`
- `rollback_sql`
- `post_apply_json`

**New function — `fetch_audit_entry(event_id: str) -> dict | None`**
Fetches a single audit row by `event_id`. Returns `None` if not found. Same column set as the list query. Used by the new detail endpoint.

---

### 1.5 `src/api/dashboard.py`

**`GET /audit` — updated serializer**
Now parses `post_apply_json` from stored JSON string into a proper array before returning. Exposes three new fields per entry:
- `fix_sql: string | null`
- `rollback_sql: string | null`
- `post_apply_assertions: { test_name, column, passed, actual_value }[]`

**New route — `GET /audit/{event_id}`**
Returns full detail for a single audit entry. Same shape as a list entry. Returns `404` if not found. Used by the frontend Audit Detail page (`/audit/{event_id}`).

Added `HTTPException` to FastAPI imports.
Added `fetch_audit_entry` to audit_log imports.

---

## 2. Known Bugs (logged, not yet fixed)

### `{table}` substitution failure on `public.orders`
The apply agent sends `DELETE FROM {table} WHERE customer_id IS NULL` to production without substituting `{table}`. This causes a Postgres syntax error and escalation. Root cause: `table_name` is empty or None when extracted from the orders event FQN in `apply.py`. Employees and customers tables are unaffected. Fix deferred post-demo.

### Post-apply assertions not captured for `public.customers`
`_extract_failed_tests` returns an empty list for the customers fix due to the hardcoded `_col_map` in `apply.py` (documented as Fix 6 in v2). Fix ran and committed correctly — assertions were skipped silently. `post_apply_assertions` shows empty in the audit detail view for this entry.

---

## 3. Frontend — What Was Built This Session

### 3.1 Diagnostic Tool (`app/diagnostic/page.tsx`)
In-browser health checker at `localhost:3000/diagnostic`. Runs 13 checks across all 5 backend sections (connectivity, dashboard, connections, proposals, profiling). Tests API contract shapes, empty state safety, enum validity, and route reachability. No terminal required.

### 3.2 Proposal Modal — Status-Aware Footer
`components/proposals/proposal-detail-modal.tsx` updated. Previously showed Approve/Reject buttons for every proposal regardless of status. Now branches on `proposal.status`:

| Status | UI |
|---|---|
| `pending_approval` | Approve / Reject buttons |
| `executing` | Spinner + "Fix is being applied…" banner |
| `completed` | "Fix applied successfully" banner |
| `failed` | Error banner |
| `approved` / `rejected` | Read-only decision badge |

Live status badge with animated spinner added to modal header.

### 3.3 Proposal Modal — Refresh Preview Button
Button next to "DATA DIFF" header. Only visible when `status === "pending_approval"`. Calls `POST /proposals/{id}/re-sandbox`. On success, re-renders diff table with aligned rows returned in response. Button disables and shows spinner during in-flight request.

### 3.4 Data Diff Table — Aligned Row Rendering
`components/proposals/data-diff.tsx` updated. Now handles empty-dict rows produced by `_compute_diff`:
- `sample_after[i] === {}` → renders **"Deleted"** pill
- `sample_before[i] === {}` → renders **"Inserted"** pill
- No frontend row cap — renders all rows returned by backend

### 3.5 Audit Log Page (`app/audit/page.tsx`)
Full Audit Log page added to sidebar. Features:
- Filter tabs: All / Applied / Dry Run / Rolled Back / Failed / Skipped
- Limit selector: 20 / 50 / 100
- Auto-refreshes every 5 seconds
- Expandable rows — click any row to reveal inline detail panel showing failure categories, fix SQL, post-apply assertions checklist, rollback SQL
- Dry-run banner when `action === "dry_run"`

### 3.6 Audit Detail Page (`app/audit/[event_id]/page.tsx`)
Deep-link page at `localhost:3000/audit/{event_id}`. Shows:
- Action badge, table name, event ID, applied timestamp
- Stats: rows affected, confidence, sandbox status, verification summary
- Full production SQL in code block
- Post-apply assertions as ✓/✗ checklist
- Rollback SQL collapsed by default
- Back to Audit Log navigation

### 3.7 Dry-Run Toggle Button
Toggle button in the pipeline health card. Shows current mode clearly (`SAFE MODE` / `LIVE MODE`). Calls `POST /dry-run/toggle`. Optimistic UI update, confirmed by `/status` poll. Visual warning indicator when in live mode.

---

## 4. Demo State as of Session End

| Entity | State |
|---|---|
| Northwind connection | `ready` |
| Profiling report | 1 report, anomalies rendering correctly |
| Proposals | 4 pending, modal status-aware |
| Audit entries | 5 total — 2 applied (customers, employees), 3 dry run |
| Pipeline | 5/5 stages healthy |
| Dry-run mode | Togglable via UI, currently off |

**Safe tables for demo:** `public.customers` (applied, 60 rows, SQL visible in audit) and `public.employees` (applied, 4 rows).
**Avoid for demo:** `public.orders` until `{table}` substitution bug is fixed.
```