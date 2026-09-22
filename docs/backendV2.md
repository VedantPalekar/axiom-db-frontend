# AxiomDB — Technical Source of Truth (v2)

> **Audience:** Backend engineers, frontend engineers, and technical reviewers.
> **Scope:** Backend system architecture, API specification, business logic, data models, and verified pipeline state.
> **Last verified state:** All 6 backend fixes applied and full pipeline end-to-end tested against Northwind database on April 21, 2026.
> **Frontend state:** Out of scope for this document.

---

## Motivation

AxiomDB is an **autonomous database health monitoring and self-healing system**. The core problem it solves is: production databases accumulate data quality failures — NULL violations, range violations, uniqueness violations, referential integrity failures, and format violations — that are detected by monitoring tools (OpenMetadata) but require manual intervention to fix.

AxiomDB closes this loop by:

1. **Receiving** test failure events from OpenMetadata via webhook
2. **Classifying** failures using a rule-based detector
3. **Diagnosing** root cause using a Groq LLM with RAG from a ChromaDB knowledge base
4. **Previewing** the fix safely in an ephemeral sandbox (testcontainers Postgres)
5. **Proposing** the fix to a human operator for approval
6. **Executing** the approved fix on production with post-apply verification
7. **Auditing** every outcome — applied, dry run, rolled back, or escalated

The system is designed to be **safe-first**: every fix is sandbox-tested before a human sees it, and every production apply runs inside an explicit transaction with post-apply assertions and automatic rollback on failure.

---

## 1. Architecture Overview

### 1.1 Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Backend framework | FastAPI | 0.115.0 |
| ASGI server | Uvicorn | 0.30.6 with `standard` extras |
| Language | Python | 3.12 |
| Target database driver | asyncpg | 0.30.0 (async) |
| Target database ORM | SQLAlchemy | 2.0.36 async |
| Sync DB driver (sandbox) | psycopg2-binary | 2.9.10 |
| Data validation | Pydantic | 2.7.0 |
| Settings management | pydantic-settings | 2.3.0 |
| HTTP client | httpx | 0.27.0 |
| Message broker | Redis Streams | via redis-py 5.0.7 |
| LLM provider | Groq | `groq==0.11.0`, model: `llama-3.3-70b-versatile` |
| Vector store | ChromaDB | 0.5.0 |
| Embedding model | sentence-transformers | 3.0.1, model: `all-MiniLM-L6-v2` |
| Sandbox executor | testcontainers-python | 4.14.2, postgres extra |
| Metadata catalog | OpenMetadata | 1.6.1 (Docker Compose) |
| In-process ingestion | openmetadata-ingestion | 1.6.1, postgres extra |
| Infrastructure | Docker Compose | All supporting services |

### 1.2 Supporting Infrastructure (Docker Compose)

All services run via a single Docker Compose file at `docker/openmetadata/docker-compose.yml`.

| Container | Image | Port Mapping | Purpose |
|---|---|---|---|
| `openmetadata_server` | `docker.getcollate.io/openmetadata/server:1.6.1` | 8585–8586 | OpenMetadata API + UI |
| `openmetadata_postgresql` | `docker.getcollate.io/openmetadata/postgresql:1.6.1` | 5432 | OpenMetadata internal DB |
| `openmetadata_elasticsearch` | `docker.elastic.co/elasticsearch/elasticsearch:8.11.4` | 9200, 9300 | OM search backend |
| `openmetadata_ingestion` | `docker.getcollate.io/openmetadata/ingestion:1.6.1` | 8080 | Airflow-based ingestion (not used for in-process flow) |
| `axiomdb_postgres` | `postgres:16-alpine` | **5433:5432** | Target database AxiomDB monitors and heals |
| `axiomdb_redis` | `redis:7.2-alpine` | 6379 | Redis Streams event bus |

> **Note:** The target database container is named `axiomdb_postgres`. All external connections use `localhost:5433`.

### 1.3 Project Structure

```
axiomdb/
├── src/
│   ├── agents/
│   │   ├── detector.py          # Rule-based failure classifier
│   │   ├── diagnosis.py         # LLM diagnosis via Groq
│   │   ├── profiler.py          # Direct Postgres profiling engine
│   │   ├── repair.py            # Sandbox orchestrator (post-approval)
│   │   └── apply.py             # Production fix executor
│   ├── api/
│   │   ├── webhook.py           # OpenMetadata webhook receiver
│   │   ├── dashboard.py         # Audit / stream / escalation / health endpoints
│   │   ├── profiler_routes.py   # Profiling API endpoints
│   │   ├── onboarding_routes.py # Database connect + re-profile endpoints
│   │   ├── proposal_routes.py   # Proposal approve / reject / detail endpoints
│   │   └── table_routes.py      # Live table data endpoint
│   ├── core/
│   │   ├── config.py            # All settings via pydantic-settings (.env)
│   │   └── models.py            # All Pydantic models
│   ├── db/
│   │   ├── target_db.py         # Async read connection to axiomdb_postgres
│   │   ├── audit_log.py         # _axiomdb_audit table CRUD
│   │   ├── event_store.py       # _axiomdb_events table CRUD
│   │   ├── vector_store.py      # ChromaDB wrapper
│   │   ├── profiling_store.py   # _axiomdb_profiling_reports table CRUD
│   │   ├── proposal_store.py    # _axiomdb_proposals table CRUD
│   │   └── connection_registry.py # _axiomdb_connections table CRUD
│   ├── sandbox/
│   │   ├── executor.py          # testcontainers ephemeral Postgres orchestration
│   │   └── validator.py         # SQL assertions against sandbox or production
│   ├── services/
│   │   ├── om_client.py         # OpenMetadata REST API client (with token refresh)
│   │   ├── event_bus.py         # Redis Streams publisher
│   │   ├── stream_consumer.py   # Redis Streams consumer (Diagnosis pipeline)
│   │   └── om_ingestion.py      # In-process MetadataWorkflow runner
│   └── main.py                  # FastAPI app + lifespan boot sequence
├── docker/
│   └── openmetadata/
│       ├── docker-compose.yml
│       └── openmetadata.env
├── scripts/
│   └── seed_dirty_data.sql      # Intentionally dirty test data (orders/customers schema)
├── data/
│   └── chromadb/                # ChromaDB persistent storage (local disk)
├── .env                         # Runtime config (never committed)
└── requirements.txt
```

### 1.4 Design Patterns

- **Event-driven pipeline:** All inter-agent communication goes through Redis Streams. No direct agent-to-agent calls.
- **Background tasks:** FastAPI `BackgroundTasks` handles webhook enrichment and onboarding without blocking HTTP responses.
- **Consumer groups:** Redis XREADGROUP with consumer groups ensures at-least-once delivery and allows ACK-based retry on failure.
- **Proposal gate:** A human-approval step sits between diagnosis and repair. The repair agent only runs when a proposal is explicitly approved via API.
- **Dry-run toggle:** `DRY_RUN=true` allows the full pipeline to run without writing to production. Toggled at runtime via `POST /dry-run/toggle`. **Does not persist across server restarts** — reads from `.env` on each boot.
- **Sandbox-first:** Every fix is validated in an ephemeral testcontainers Postgres clone before proposal creation (preview run) and again after approval (full validation run).
- **asyncpg JSONB constraint:** All JSONB inserts use `CAST(:param AS jsonb)` syntax. The `::jsonb` cast operator is rejected by asyncpg's prepared statement engine.
- **Model vs dict contract:** All `get_*` functions in `db/` return Pydantic model objects (not dicts). API routes must use attribute access (`.field_name`) not bracket access (`["field_name"]`). This was the source of multiple 500 errors in dashboard, table_routes, and proposal_routes during development.

---

## 2. Target Database — Northwind

The system has been tested and verified against the **Northwind** database loaded into `axiomdb_postgres`.

| Property | Value |
|---|---|
| Database name | `northwind` |
| Tables | 14 |
| Total rows (orders) | 830 |
| Total rows (customers) | 91 |
| Total rows (employees) | 9 |
| Connection | `localhost:5433` |
| User | `axiomdb_user` |
| Password | `axiomdb_pass` |

### 2.1 Known Dirty Data in Northwind (natural, not seeded)

| Table | Column | Anomaly | Count |
|---|---|---|---|
| `orders` | `ship_region` | NULL values | 54 |
| `orders` | `shipped_date` | NULL values | 21 |
| `customers` | `region` | NULL values | 60 |
| `employees` | `region` | NULL values | 5 → **FIXED** (applied to production April 21, 2026) |

**Profiling summary (last run):** 15 total anomalies, 12 critical, 3 warnings across 14 tables.

---

## 3. Internal Postgres Tables

All internal tables are prefixed with `_axiomdb_` and are excluded from profiling scans. They live inside the target database (`northwind` / `axiomdb_postgres`).

### `_axiomdb_events`

Stores enriched webhook events immediately after OM enrichment.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `event_id` | VARCHAR(36) UNIQUE NOT NULL | UUID from webhook |
| `table_fqn` | TEXT NOT NULL | e.g. `northwind_svc.northwind.public.employees` |
| `table_name` | TEXT NOT NULL | Last segment of FQN |
| `enrichment_ok` | BOOLEAN | True if OM schema context was fetched |
| `severity` | VARCHAR(20) | low / medium / high / critical |
| `event_data` | JSONB NOT NULL | Full `EnrichedFailureEvent` serialized |
| `created_at` | TIMESTAMPTZ | Default NOW() |

Indexes: `event_id`, `created_at DESC`

---

### `_axiomdb_proposals`

Stores repair proposals awaiting human approval.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `proposal_id` | VARCHAR(36) UNIQUE NOT NULL | UUID |
| `event_id` | VARCHAR(36) NOT NULL | Soft FK to `_axiomdb_events` |
| `table_fqn` | TEXT NOT NULL | |
| `table_name` | TEXT NOT NULL | |
| `failure_categories` | TEXT[] | e.g. `['null_violation']` |
| `root_cause` | TEXT | LLM-generated plain English |
| `confidence` | FLOAT | 0.0–1.0. Threshold: 0.70 |
| `fix_sql` | TEXT | Contains `{table}` placeholder |
| `fix_description` | TEXT | Human-readable |
| `rollback_sql` | TEXT nullable | |
| `estimated_rows` | INTEGER nullable | |
| `sandbox_passed` | BOOLEAN | From preview sandbox run |
| `rows_before` | INTEGER | Sandbox before count |
| `rows_after` | INTEGER | Sandbox after count |
| `rows_affected` | INTEGER | rows_deleted + rows_updated |
| `sample_before` | JSONB | Up to 5 rows before fix |
| `sample_after` | JSONB | Up to 5 rows after fix |
| `status` | VARCHAR(30) | See ProposalStatus enum |
| `created_at` | TIMESTAMPTZ | |
| `decided_at` | TIMESTAMPTZ nullable | Set on approve/reject |
| `decision_by` | TEXT | Default: `system` |
| `rejection_reason` | TEXT nullable | |
| `diagnosis_json` | TEXT | Serialized `DiagnosisResult` |
| `event_json` | TEXT | Serialized `EnrichedFailureEvent` |

**ProposalStatus values:** `pending_approval`, `approved`, `rejected`, `executing`, `completed`, `failed`

> **Known issue:** Proposals that fail mid-execution are left in `executing` status permanently. There is no automatic status reset. A new webhook must be fired to generate a fresh proposal.

---

### `_axiomdb_audit`

One row per fix attempt.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `event_id` | VARCHAR(36) NOT NULL | |
| `table_fqn` | TEXT NOT NULL | |
| `table_name` | TEXT NOT NULL | |
| `action` | VARCHAR(20) NOT NULL | `applied` / `dry_run` / `failed` / `rolled_back` / `skipped` |
| `fix_sql` | TEXT | `{table}` already substituted |
| `rollback_sql` | TEXT nullable | |
| `rows_affected` | INTEGER | |
| `dry_run` | BOOLEAN | |
| `sandbox_passed` | BOOLEAN | |
| `confidence` | FLOAT | |
| `failure_categories` | TEXT[] | |
| `applied_at` | TIMESTAMPTZ | Default NOW() |
| `post_apply_json` | JSONB | Array of assertion results |
| `error` | TEXT nullable | Exception message if failed |
| `metadata_json` | JSONB | Reserved |

---

### `_axiomdb_profiling_reports`

Stores full profiling reports from the profiler agent.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `report_id` | VARCHAR(36) UNIQUE NOT NULL | UUID |
| `connection_hint` | TEXT | `host:port/db` — no credentials stored |
| `status` | VARCHAR(20) | completed / failed / partial |
| `tables_scanned` | INTEGER | |
| `total_anomalies` | INTEGER | |
| `critical_count` | INTEGER | |
| `warning_count` | INTEGER | |
| `duration_ms` | INTEGER | |
| `report_data` | JSONB NOT NULL | Full `ProfilingReport` serialized |
| `created_at` | TIMESTAMPTZ | Default NOW() |

> `get_report(report_id)` returns a `ProfilingReport` **Pydantic model**, not a dict. Access via `.tables`, `.total_anomalies`, etc.

---

### `_axiomdb_connections`

Registry of databases connected via `POST /api/v1/connect`.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `connection_id` | VARCHAR(36) UNIQUE NOT NULL | UUID |
| `service_name` | TEXT NOT NULL | OM service name |
| `connection_hint` | TEXT NOT NULL | `host:port/db` |
| `db_name` | TEXT NOT NULL | |
| `schema_names` | TEXT[] | Default: `['public']` |
| `status` | VARCHAR(20) | pending / connected / ingesting / profiling / ready / failed |
| `om_service_fqn` | TEXT | Assigned by OM after registration |
| `profiling_report_id` | TEXT nullable | UUID of associated profiling report |
| `tables_found` | INTEGER | |
| `total_anomalies` | INTEGER | |
| `critical_count` | INTEGER | |
| `error` | TEXT nullable | |
| `registered_at` | TIMESTAMPTZ | Default NOW() |
| `last_profiled_at` | TIMESTAMPTZ nullable | |

> `get_connection(connection_id)` returns a `DatabaseConnection` **Pydantic model**, not a dict. Access via `.db_name`, `.profiling_report_id`, `.last_profiled_at`, etc.

> **Known bug (Gap 7.12):** `list_connections()` has a scoping bug — `out.append(d)` is indented inside the datetime conversion loop instead of outside it. Only the last datetime field is processed correctly per row. Non-critical for single-connection scenarios.

---

## 4. Redis Streams

| Stream Key | Publisher | Consumer | Purpose |
|---|---|---|---|
| `axiomdb:events` | `event_bus.py` | `stream_consumer.py` | Enriched webhook events → diagnosis pipeline |
| `axiomdb:repair` | `proposal_routes.py` (on approve) | `repair.py` | Approved diagnoses ready for repair |
| `axiomdb:apply` | `repair.py` | `apply.py` | Sandbox-validated fixes ready for production apply |
| `axiomdb:escalation` | `stream_consumer.py`, `apply.py`, `proposal_routes.py` | Read-only via dashboard | Events that could not be auto-repaired |

All streams use consumer group `axiomdb-agents`. Max length capped at 500–1000 entries.

> **Important:** Messages published before a server restart may remain unconsumed if the apply agent's consumer group already has them in pending state. Fire a fresh webhook to generate a new event rather than attempting to re-consume stale messages.

---

## 5. ChromaDB Knowledge Base

Collection name: `axiomdb_fixes`
Embedding model: `all-MiniLM-L6-v2` (384-dim, cosine similarity)
Persistent path: `./data/chromadb`

Each document encodes: `table_fqn + failure_category + problem_description + fix_sql`

Metadata fields per document:
- `fix_id` (required)
- `table_fqn`
- `failure_category`
- `problem_description`
- `fix_sql`
- `was_successful` (string `"True"` / `"False"`)
- `event_id`
- `stored_at`

5 bootstrap entries are seeded on startup if the collection is empty. Successful sandbox passes (repair agent) add additional entries. As of April 21, 2026 the collection has **11 documents**.

---

## 6. API Specification

**Base URL:** `http://localhost:8001/api/v1`
**Authentication:** None — all endpoints are publicly accessible.
**Content-Type:** `application/json` for all requests.

---

### 6.1 Webhook

#### `POST /webhook/om-test-failure`

Receives OpenMetadata test failure events. Returns 200 immediately. Enrichment and pipeline entry run as background tasks.

**Request body:**
```json
{
  "eventType": "entityUpdated",
  "entityType": "testCase",
  "entityFQN": "northwind_svc.northwind.public.employees.region.employees_region_not_null",
  "entity": {
    "name": "employees_region_not_null",
    "fullyQualifiedName": "northwind_svc.northwind.public.employees.region.employees_region_not_null",
    "testCaseResult": {
      "testCaseStatus": "Failed",
      "result": "Found 5 null values in column region"
    }
  },
  "timestamp": 1712345678000
}
```

**Response:**
```json
{
  "status": "accepted",
  "event_id": "uuid",
  "table_fqn": "northwind_svc.northwind.public.employees",
  "failed_tests": 1
}
```

**FQN parsing rule:** Table FQN = first 4 dot-separated segments of `entityFQN`.

**Non-failure events:** Returns `{"status": "skipped", "reason": "not a test failure event"}`

---

### 6.2 Health & Status

#### `GET /health`
```json
{ "status": "ok", "service": "axiomdb-webhook" }
```

#### `GET /status`
```json
{
  "version": "0.4.0",
  "dry_run": true,
  "confidence_threshold": 0.7,
  "pipeline": {
    "1_webhook": "ok",
    "2_event_bus": "ok",
    "3_diagnosis_consumer": "ok",
    "4_repair_agent": "ok",
    "5_apply_agent": "ok"
  }
}
```

---

### 6.3 Dashboard

#### `GET /audit?limit={n}`

Returns most recent audit log entries. Default limit: 20. Max: 100.

`action` values: `applied`, `dry_run`, `failed`, `rolled_back`, `skipped`

**Sample response entry:**
```json
{
  "id": 3,
  "event_id": "uuid",
  "table_fqn": "northwind_svc.northwind.public.employees",
  "table_name": "employees",
  "action": "applied",
  "rows_affected": 4,
  "dry_run": false,
  "sandbox_passed": true,
  "confidence": 0.92,
  "failure_categories": ["null_violation"],
  "applied_at": "2026-04-21T10:23:56.260343+00:00",
  "error": null
}
```

---

#### `GET /streams`
```json
{
  "streams": {
    "axiomdb:events":     { "length": 10, "last_message_id": "..." },
    "axiomdb:repair":     { "length": 6,  "last_message_id": "..." },
    "axiomdb:apply":      { "length": 5,  "last_message_id": "..." },
    "axiomdb:escalation": { "length": 2,  "last_message_id": "..." }
  }
}
```

---

#### `GET /escalations?limit={n}`

`stage` values: `apply`, `approval`, `diagnosis`

```json
{
  "count": 2,
  "escalations": [
    {
      "message_id": "...",
      "event_id": "uuid",
      "table_fqn": "northwind_svc.northwind.public.orders",
      "reason": "Apply error: syntax error at or near ...",
      "stage": "apply",
      "escalated_at": "2026-04-20T12:55:07.597345"
    }
  ]
}
```

---

#### `POST /dry-run/toggle`

Toggles DRY_RUN at runtime without restart. **Does not persist — resets to `.env` value on next restart.**

```json
{ "dry_run": false, "message": "Apply agent now in LIVE mode" }
```

---

#### `GET /connections/{connection_id}/health`

Returns health score and per-table anomaly breakdown for a registered connection.

**Health score formula:**
- `total_anomalies == 0` → score = 100, status = "clean"
- `critical_count == 0` → score = max(50, 100 − warnings × 3), status = "partial"
- `critical_count > 0` → score = max(0, 100 − critical × 10 − warnings × 3), status = "dirty"

**Response:**
```json
{
  "connection_id": "uuid",
  "health_score": 0,
  "status": "dirty",
  "total_anomalies": 15,
  "critical_count": 12,
  "warning_count": 3,
  "tables_found": 14,
  "tables": [
    { "table_name": "employees", "schema": "public", "anomaly_count": 0, "status": "clean" },
    { "table_name": "orders",    "schema": "public", "anomaly_count": 3, "status": "dirty" }
  ],
  "last_profiled_at": "2026-04-21T08:03:34.571105+00:00",
  "db_name": "northwind",
  "connection_hint": "localhost:5433/northwind"
}
```

---

### 6.4 Profiling

#### `POST /profile`

Profiles a Postgres database directly. Synchronous. Returns in under 30 seconds for typical schemas.

**Request body:**
```json
{
  "connection_url": "postgresql://user:pass@host:port/database",
  "schemas": ["public"],
  "table_limit": 50
}
```

**Validation:** `connection_url` must start with `postgresql://` or `postgres://`

**Response:**
```json
{
  "report_id": "uuid",
  "connection_hint": "localhost:5433/northwind",
  "status": "completed",
  "tables_scanned": 14,
  "total_anomalies": 15,
  "critical_count": 12,
  "warning_count": 3,
  "duration_ms": 172,
  "message": "Found 15 anomalies across 14 tables (12 critical, 3 warnings)"
}
```

---

#### `GET /profile/{report_id}`

Returns full `ProfilingReport` object including `tables[]` array with `anomalies[]` per table.

Each anomaly:
```json
{
  "column_name": "region",
  "anomaly_type": "null_violation",
  "severity": "critical",
  "affected_rows": 5,
  "total_rows": 9,
  "rate": 0.5556,
  "description": "Column 'region' has 5 NULL values (55.6%) but should be NOT NULL",
  "sample_values": []
}
```

`anomaly_type` values: `null_violation`, `range_violation`, `uniqueness_violation`, `referential_integrity`, `format_violation`, `schema_drift`, `unknown`

`severity` values: `info`, `warning`, `critical`

---

#### `GET /profile/{report_id}/anomalies?severity={s}&table_name={t}`

Returns filtered flat list of anomalies from a report.

---

#### `GET /profiles?limit={n}`

Lists recent profiling report summaries. Max: 50.

---

### 6.5 Onboarding

#### `POST /connect`

Validates credentials, registers DB in OpenMetadata, runs in-process ingestion, profiles, and saves results. Returns immediately — all work runs as a background task.

**Request body:**
```json
{
  "host": "localhost",
  "port": 5433,
  "database": "northwind",
  "username": "axiomdb_user",
  "password": "axiomdb_pass",
  "schemas": ["public"],
  "service_name": "optional-custom-name"
}
```

**Validation:** Connection tested synchronously via asyncpg before background task starts. Returns 400 if connection fails.

**Status transitions (background):** `pending → ingesting → profiling → ready` (or `failed`)

---

#### `GET /connections/{connection_id}`

Poll onboarding status. Returns full `DatabaseConnection` model.

---

#### `GET /connections`

Lists all registered database connections.

> **Note:** Due to the known scoping bug in `list_connections()`, multi-connection scenarios may return partial results. Single-connection scenarios are unaffected.

---

#### `POST /connections/{connection_id}/re-profile`

Re-profiles an existing connection. Requires credentials to be re-supplied (credentials are never stored).

**Request body:**
```json
{
  "host": "localhost",
  "port": 5433,
  "database": "northwind",
  "username": "axiomdb_user",
  "password": "axiomdb_pass",
  "schemas": ["public"]
}
```

**Validation:** Connection tested synchronously via asyncpg. Returns 400 if connection fails.

**Response (200 — returned immediately):**
```json
{
  "connection_id": "uuid",
  "status": "profiling",
  "message": "Re-profiling started. Poll GET /api/v1/connections/{id} for status."
}
```

Background task: runs profiler → calls `save_report()` → updates connection record via `save_connection()`. Status transitions: `profiling → ready` (or `failed`).

---

### 6.6 Live Table Data

#### `GET /tables/live?connection_id={id}&table_name={t}&schema={s}&limit={n}`

Fetches live rows directly from the target database for a given table. Also returns column metadata and anomaly-flagged columns from the latest profiling report.

**Query params:**
- `connection_id` — required, UUID of registered connection
- `table_name` — required
- `schema` — optional, default `public`
- `limit` — optional, default 100, max 500

**Response:**
```json
{
  "table_name": "employees",
  "schema": "public",
  "columns": [
    { "name": "employee_id", "type": "smallint",          "nullable": false },
    { "name": "region",      "type": "character varying", "nullable": true  }
  ],
  "rows": [
    { "employee_id": 5, "last_name": "Buchanan", "region": "unknown", "country": "UK" }
  ],
  "total_rows": 9,
  "returned_rows": 9,
  "anomaly_columns": [],
  "last_profiled_at": "2026-04-21T08:03:34.571105+00:00"
}
```

**Serialization:** `bytea` and `memoryview` columns are returned as `null`. Dates and datetimes are ISO 8601 strings. Decimals are floats.

---

### 6.7 Proposals

#### `GET /proposals/pending`

Returns all proposals with `status=pending_approval`. Recommended polling interval: 5 seconds.

**Key fields in summary response:**
- `fix_sql` — contains `{table}` placeholder (substituted only at execution time)
- `sandbox_passed` — always true for proposals surfaced here
- `rows_affected` — sandbox row delta

---

#### `GET /proposals?status={s}&limit={n}`

Lists proposals filtered by status. Max: 100.

---

#### `GET /proposals/{proposal_id}`

Full proposal detail. In addition to summary fields, returns:

| Field | Type | Notes |
|---|---|---|
| `rollback_sql` | string \| null | |
| `estimated_rows` | integer \| null | LLM estimate |
| `rows_before` | integer | Sandbox row count before fix |
| `rows_after` | integer | Sandbox row count after fix |
| `sample_before` | array | Up to 5 rows before |
| `sample_after` | array | Up to 5 rows after |
| `decision_by` | string | `system` or user identifier |
| `diagnosis_json` | string | Serialized `DiagnosisResult` |
| `event_json` | string | Serialized `EnrichedFailureEvent` |
| `fix_type` | string | `DELETE` / `UPDATE` / `INSERT` / `OTHER` — computed |
| `highlighted_columns` | string[] | Columns extracted from `fix_sql` via regex |
| `anomaly_type_label` | string | Human-readable label e.g. `"NULL Values"` |
| `fix_sql_display` | string | `fix_sql` with `{table}` substituted for display |

> `sample_before`/`sample_after` in proposals created before the `_sanitize_rows()` fix (April 21, 2026) may contain `<memory at 0x...>` strings for `bytea` columns. New proposals will have `null` for those columns.

---

#### `POST /proposals/{proposal_id}/approve`

Approves a proposal. Publishes `DiagnosisResult` to `axiomdb:repair` stream.

**Request body:** `{ "decided_by": "admin" }`

**Validation:** Proposal must have `status=pending_approval`. Returns 409 if already decided or executing.

**Response:**
```json
{
  "proposal_id": "uuid",
  "status": "executing",
  "message": "Approved. Fix is executing. DRY_RUN=OFF. Check GET /api/v1/audit for results.",
  "repair_msg_id": "...",
  "dry_run": false
}
```

---

#### `POST /proposals/{proposal_id}/reject`

Rejects a proposal. No fix is applied. Publishes to escalation stream.

**Request body:** `{ "reason": "False positive", "decided_by": "admin" }` — `reason` is required.

---

#### `POST /proposals/{proposal_id}/re-sandbox`

Re-runs sandbox on an existing proposal to get a fresh data diff. Only valid when `status=pending_approval` or `status=failed`.

---

## 7. Business Logic

### 7.1 Full Pipeline Flow

```
OpenMetadata test failure
    │
    ▼
POST /api/v1/webhook/om-test-failure
    │  (returns 200 immediately)
    │
    ▼ (background task)
om_client.get_table_context(table_fqn)
    │  → OM API: GET /api/v1/tables/name/{fqn}
    │  → OM API: GET /api/v1/lineage/table/{id}
    │  [enrichment may fail if table not registered in OM — pipeline continues]
    │
    ▼
event_store.write_event(enriched_event)
    │  → _axiomdb_events
    │
    ▼
event_bus.publish(enriched_event)
    │  → XADD axiomdb:events
    │
    ▼ (stream_consumer reads axiomdb:events)
detector.run_detector(event)
    │  → rule-based classification into FailureCategory enum
    │  → computes severity, is_actionable flag
    │
    ▼
diagnosis_agent.run(event, detector_result)
    │  → vector_store.find_similar_fixes() — RAG from ChromaDB (top-3, threshold 0.3)
    │  → Groq LLM call (llama-3.3-70b-versatile)
    │  → parses JSON response into DiagnosisResult
    │
    ├── confidence < 0.70 → publish to axiomdb:escalation
    │
    └── confidence >= 0.70 →
            run_sandbox(event, diagnosis)  [preview run]
                │  → fetch schema + up to 500 rows from target DB
                │  → spin up ephemeral postgres:16-alpine via testcontainers
                │  → seed schema + rows
                │  → execute fix_sql with {table} substituted
                │  → run SQL assertions (validator.py)
                │  → capture data diff (sample_before, sample_after)
                │  → _sanitize_rows() strips memoryview/bytes before storage
                │
                ▼
            proposal_store.create_proposal(proposal)
                │  → _axiomdb_proposals (status=pending_approval)
                │
                ▼
            WAIT FOR HUMAN DECISION (poll GET /proposals/pending)
                │
                ├── POST /proposals/{id}/reject
                │       → status=rejected, publish to escalation
                │
                └── POST /proposals/{id}/approve
                        → publish DiagnosisResult to axiomdb:repair
                        │
                        ▼ (repair_agent reads axiomdb:repair)
                    run_sandbox(event, diagnosis)  [full validation run, up to 3 retries]
                        │  → sandbox passed → store fix in ChromaDB KB
                        │
                        ▼
                    publish to axiomdb:apply
                        │
                        ▼ (apply_agent reads axiomdb:apply)
                    DRY_RUN=true  → log intent, write audit row (action=dry_run)
                    DRY_RUN=false →
                        SET LOCAL statement_timeout = 30000ms
                        execute fix_sql ({table} substituted with quoted table name)
                        run post-apply assertions (if POST_APPLY_VERIFY=true)
                        assertions pass  → COMMIT → audit row (action=applied)
                        assertions fail  → ROLLBACK → audit row (action=rolled_back)
                                         → publish to escalation
```

### 7.2 `{table}` Placeholder Substitution

`fix_sql` is stored with `{table}` as a literal placeholder throughout the entire pipeline — in proposals, repair stream messages, and audit rows. Substitution happens **only at execution time** in `apply.py`:

```python
fix_sql = decision.fix_sql.replace("{table}", f'"{table_name}"')
```

This pattern is applied in both `_apply_live()` and `_dry_run()`.

### 7.3 Detector Classification Rules

Keyword-to-category mapping (first match wins):

| Keywords | FailureCategory |
|---|---|
| `not_null`, `null`, `not be null`, `null values` | `NULL_VIOLATION` |
| `between`, `range`, `min`, `max`, `negative`, `greater`, `less` | `RANGE_VIOLATION` |
| `unique`, `duplicate`, `distinct` | `UNIQUENESS_VIOLATION` |
| `foreign key`, `referential`, `fk`, `not exist` | `REFERENTIAL_INTEGRITY` |
| `regex`, `format`, `pattern`, `like`, `email`, `phone` | `FORMAT_VIOLATION` |
| `column not found`, `schema`, `missing column`, `type mismatch` | `SCHEMA_DRIFT` |

Severity escalation:
- `REFERENTIAL_INTEGRITY` or `SCHEMA_DRIFT` → CRITICAL (`SCHEMA_DRIFT` also sets `is_actionable=False`)
- Critical column name match (`customer_id`, `order_id`, `user_id`, `id`, `amount`, `email`, `status`) → HIGH
- Multiple categories → MEDIUM
- `SCHEMA_DRIFT` and all-`UNKNOWN` → skip LLM, escalate directly

### 7.4 Profiler Detection Logic

Runs directly against target Postgres via asyncpg. Per-column checks:

| Check | Trigger | Method |
|---|---|---|
| Null rate | All columns | `COUNT WHERE col IS NULL` |
| High null rate warning | nullable + rate > 80% | Same |
| Uniqueness | Column name contains `id`, `uuid`, `email`, `username`, `phone`, `ssn` | `GROUP BY HAVING COUNT > 1` |
| Range/outlier | Numeric types | IQR method (Q1 − 1.5×IQR, Q3 + 1.5×IQR) |
| Negative values | Numeric + name contains `amount`, `price`, `cost`, `fee`, `total`, `balance`, `quantity` | `WHERE col < 0` |
| Email format | Text + column name in `email`, `email_address`, `mail` | Regex `^[^@\s]+@[^@\s]+\.[^@\s]+$` |
| Referential integrity | FK columns from `information_schema` | LEFT JOIN check |

Row cap: Tables > 100,000 rows are sampled. `_axiomdb_*` tables excluded.

### 7.5 Sandbox Execution

- Image: `postgres:16-alpine`
- Managed by: `testcontainers-python 4.14.2`
- Run in: `asyncio.to_thread` to avoid blocking event loop
- Timeout: 120 seconds (configurable)
- Retries: Up to 3 attempts
- Connection: psycopg2 with `_to_psycopg2_url()` helper to strip `postgresql+psycopg2://` prefix
- Postgres readiness: Retried up to 10 times with 2-second sleep
- Seed data: Schema from `information_schema`, up to 500 rows from production
- Row sanitization: `_sanitize_rows()` strips `memoryview` → `None`, `bytes` → `None`, dates → ISO string, decimals → float

### 7.6 `_extract_failed_tests` — Apply Agent

Defined as an **instance method** on the apply agent class. Takes the full `decision` object (not just the JSON string). Extracts column names dynamically from `fix_sql` via regex — no hardcoded column map. Works with arbitrary schemas including Northwind.

```python
failed_tests = self._extract_failed_tests(decision)
```

Column extraction patterns applied to lowercased `fix_sql`:
- `WHERE col IS [NOT] NULL`
- `WHERE col [<>=!]`
- `SET col =`
- `AND col IS [NOT] NULL`
- `AND col [<>=!]`

SQL keywords are excluded from results.

### 7.7 OpenMetadata Integration

- Login: `POST /api/v1/users/login` with base64-encoded password
- Token field: `accessToken` (not `jwtToken`)
- Token validation: `GET /api/v1/system/version` ping before each request
- Table FQN format: `{service_name}.{database}.{schema}.{table}`
- URL encoding: Dots encoded as `%2E` in GET path params
- In-process ingestion: `MetadataWorkflow.create(config).execute()` via `asyncio.to_thread`
- Known issue: OM table lookup returns 404 for `northwind_svc.*` tables if they were not successfully registered via `POST /connect`. Pipeline continues with `enrichment_success=false`.

---

## 8. Environment Variables

| Variable | Default | Notes |
|---|---|---|
| `OM_HOST` | `http://localhost:8585` | OpenMetadata server URL |
| `OM_ADMIN_EMAIL` | `admin@open-metadata.org` | |
| `OM_ADMIN_PASSWORD` | — | Plain text, base64-encoded at runtime |
| `REDIS_HOST` | `localhost` | |
| `REDIS_PORT` | `6379` | |
| `REDIS_STREAM_NAME` | `axiomdb:events` | |
| `REDIS_REPAIR_STREAM` | `axiomdb:repair` | |
| `REDIS_ESCALATION_STREAM` | `axiomdb:escalation` | |
| `REDIS_APPLY_STREAM` | `axiomdb:apply` | |
| `REDIS_CONSUMER_GROUP` | `axiomdb-agents` | Shared across all agents |
| `REDIS_CONSUMER_NAME` | `diagnosis-agent-1` | |
| `APP_HOST` | `0.0.0.0` | |
| `APP_PORT` | `8000` | Note: frontend proxies to 8001 |
| `GROQ_API_KEY` | — | Required |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | |
| `LLM_MAX_TOKENS` | `4096` | |
| `CHROMA_PERSIST_DIR` | `./data/chromadb` | |
| `CHROMA_COLLECTION` | `axiomdb_fixes` | |
| `CONFIDENCE_THRESHOLD` | `0.70` | |
| `TARGET_DB_HOST` | `localhost` | |
| `TARGET_DB_PORT` | `5433` | External port |
| `TARGET_DB_NAME` | `northwind` | Updated from `axiomdb` |
| `TARGET_DB_USER` | `axiomdb_user` | |
| `TARGET_DB_PASSWORD` | `axiomdb_pass` | |
| `SANDBOX_MAX_RETRIES` | `3` | |
| `SANDBOX_SAMPLE_ROWS` | `500` | |
| `SANDBOX_TIMEOUT_SECONDS` | `120` | |
| `DRY_RUN` | `true` | Does not persist across restarts |
| `APPLY_STATEMENT_TIMEOUT_MS` | `30000` | |
| `POST_APPLY_VERIFY` | `true` | |

---

## 9. Boot Sequence

```
1. vector_store.connect()          → ChromaDB (sync, must be first)
   vector_store.seed_bootstrap_fixes()

2. init_audit_table()              → _axiomdb_audit
   init_event_store()              → _axiomdb_events
   init_profiling_store()          → _axiomdb_profiling_reports
   init_connection_registry()      → _axiomdb_connections
   init_proposal_store()           → _axiomdb_proposals

3. event_bus.connect()             → Redis ping

4. stream_consumer.connect()       → Create consumer group (idempotent)
   asyncio.create_task(stream_consumer.start())

5. repair_agent.connect()
   asyncio.create_task(repair_agent.start())

6. apply_agent.connect()
   asyncio.create_task(apply_agent.start())
```

Expected boot log:
```
[Boot] ChromaDB ready
[Boot] Audit table ready
[Boot] Event store ready
[Boot] Profiling store ready
[Boot] Connection registry ready
[Boot] Proposal store ready
[Boot] Event bus ready
[Boot] Diagnosis consumer running
[Boot] Repair agent running
[Boot] Apply agent running
AxiomDB ready ✓
```

---

## 10. Bugs Fixed During Development (April 21, 2026)

The following bugs were identified and resolved during the Northwind integration session.

### Fix 1 — `src/agents/repair.py`

**Bug A:** `_fallback_event_from_diagnosis` defined with `self` as first parameter but was a module-level function.
**Fix:** Removed `self` from function signature.

**Bug B:** Call site passed `fields` (dict) instead of `table_fqn` (str).
**Fix:** Extract `table_fqn = fields.get("table_fqn", ...)` before calling.

**Bug C:** `FailedTest` not imported.
**Fix:** Added `FailedTest` to imports from `src.core.models`.

**Bug D:** `sample_before` / `sample_after` contained `memoryview` objects from psycopg2 BYTEA columns, causing JSON serialization failures.
**Fix:** Added `_sanitize_rows()` helper at module level. Called before `decision.model_dump_json()` in `_route_decision()`.

---

### Fix 2 — `src/api/onboarding_routes.py`

**Bug:** `POST /connections/{id}/re-profile` returned 400 immediately with no implementation. No `update_connection()` function exists in the registry.
**Fix:** Complete endpoint implementation using `get_connection()` + field mutation + `save_connection()`. Background task runs profiler, saves report, updates connection status.

---

### Fix 3 — `src/api/dashboard.py`

**Bug:** `get_live_table_data` function existed in `dashboard.py` as a duplicate of the one in `table_routes.py`. Used `conn_record["db_name"]` (dict access) instead of `conn_record.db_name` (model attribute access). FastAPI was routing to the dashboard version.
**Fix:** Deleted the duplicate function from `dashboard.py`. The canonical version lives exclusively in `table_routes.py`.

**Bug (health endpoint):** Used `get_profiling_report()` (non-existent function) and treated model objects as dicts.
**Fix:** Corrected import to `get_report`. Fixed all attribute access throughout health endpoint.

---

### Fix 4 — `src/api/table_routes.py`

**Bug:** Used `conn_record["field"]` bracket access on a `DatabaseConnection` model object.
**Fix:** Rewrote with defensive handling extracting `db_name`, `profiling_report_id`, `last_profiled` into local variables. Added `isinstance(conn_record, dict)` check to handle both return types. Added `memoryview` to `_serialize()`.

---

### Fix 5 — `src/api/proposal_routes.py`

**Bug:** Enhancement code used `proposal.get("fix_sql")` on a `RepairProposalRecord` Pydantic model object.
**Fix:** Added conversion at top of function: `if not isinstance(proposal, dict): proposal = proposal.model_dump()`. All subsequent `.get()` calls are safe.

---

### Fix 6 — `src/agents/apply.py`

**Bug:** `_extract_failed_tests` defined as instance method `(self, decision)` but called as module-level function `_extract_failed_tests(decision.diagnosis_result_json)` — two mismatches: missing `self`, and passing JSON string instead of full decision object.
**Fix:** Changed call site to `self._extract_failed_tests(decision)`.

---

## 11. Known Gaps and Constraints

### No Authentication Layer
All endpoints are publicly accessible. No JWT, API key, or session validation.

### No Credential Storage
Credentials submitted via `POST /connect` are not persisted. Only `connection_hint` (`host:port/db`) is stored. Re-profiling requires re-submitting credentials.

### `WEBHOOK_SECRET` Unused
Defined in `.env` but webhook payloads are not signature-validated.

### OM FQN Mismatch
The FQN prefix in webhook payloads for the Northwind integration is `northwind_svc` (auto-generated by `POST /connect`). The OM server returns 404 for table lookups under this prefix because the tables were not successfully indexed. Pipeline continues with `enrichment_success=false` — this does not block the diagnosis or repair flow.

### Proposal Status Stuck at `executing`
Proposals that fail mid-pipeline are left in `executing` status. There is no automatic reset. A new webhook must be fired to generate a fresh proposal.

### `DRY_RUN` Not Persisted
`POST /dry-run/toggle` changes in-memory state only. Server restart resets to `.env` value (`true` by default).

### Repair Agent Event Reconstruction Fallback
When the repair agent cannot find the enriched event in `_axiomdb_events` by `event_id`, it falls back to `_fallback_event_from_diagnosis()` which reconstructs column names from `fix_sql` regex. This is generic and works for most schemas.

### Validator Assertion Coverage
`validator.py` supports null checks, range checks, uniqueness, and email regex. `format_violation` and `schema_drift` categories return `passed=True` with a `skipped` note. Range bounds are hardcoded to `[0, 9_999_999]`.

### Sandbox Windows Compatibility
testcontainers on Windows occasionally produces Docker API 500 errors on container removal. Retry logic (3 attempts, 2-second gap) mitigates this. `TESTCONTAINERS_HOST_OVERRIDE=localhost` may be required on some Windows Docker Desktop configurations.

### `list_connections()` Bug
`out.append(d)` is indented inside the datetime conversion `for` loop. Only the last item is appended per row correctly. Non-critical for single-connection scenarios.

### ChromaDB File Lock on Windows
ChromaDB holds file locks while the server is running. Cleanup procedure: stop server → delete `./data/chromadb/` → restart.

---

## 12. Complete API Route Summary

| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/webhook/om-test-failure` | Receive OM test failure |
| GET | `/api/v1/health` | Basic health check |
| GET | `/api/v1/status` | Full pipeline status |
| GET | `/api/v1/audit` | Audit log |
| GET | `/api/v1/streams` | Redis stream lengths |
| GET | `/api/v1/escalations` | Escalation queue |
| POST | `/api/v1/dry-run/toggle` | Toggle live/safe mode |
| GET | `/api/v1/connections/{id}/health` | Connection health score + table breakdown |
| POST | `/api/v1/profile` | Profile a database |
| GET | `/api/v1/profile/{report_id}` | Full profiling report |
| GET | `/api/v1/profile/{report_id}/anomalies` | Filtered anomaly list |
| GET | `/api/v1/profiles` | List profiling reports |
| POST | `/api/v1/connect` | Connect and onboard a database |
| GET | `/api/v1/connections/{connection_id}` | Poll onboarding status |
| GET | `/api/v1/connections` | List all connections |
| POST | `/api/v1/connections/{id}/re-profile` | Re-profile existing connection |
| GET | `/api/v1/tables/live` | Live table rows + column metadata + anomaly columns |
| GET | `/api/v1/proposals/pending` | Pending approval queue |
| GET | `/api/v1/proposals` | All proposals (filterable by status) |
| GET | `/api/v1/proposals/{proposal_id}` | Full proposal with diff + computed display fields |
| POST | `/api/v1/proposals/{proposal_id}/approve` | Approve and execute fix |
| POST | `/api/v1/proposals/{proposal_id}/reject` | Reject fix |
| POST | `/api/v1/proposals/{proposal_id}/re-sandbox` | Refresh sandbox preview |

---

## 13. Verified Pipeline Run (April 21, 2026)

End-to-end pipeline successfully executed against Northwind `employees.region` NULL violation:

| Stage | Result |
|---|---|
| Webhook received | ✅ `event_id=a949d871` accepted |
| OM enrichment | ⚠️ 404 — table not in OM, pipeline continued |
| Event stored | ✅ `_axiomdb_events` written |
| Redis published | ✅ `axiomdb:events` XADD |
| Detector | ✅ `null_violation`, severity=low, actionable=True |
| Diagnosis (Groq) | ✅ confidence=0.92, repairable=True |
| Sandbox preview | ✅ 9 rows seeded, 4 rows fixed, assertion PASSED |
| Proposal created | ✅ `pending_approval` |
| Human approval | ✅ `POST /proposals/{id}/approve` |
| Repair sandbox | ✅ PASSED attempt 1/3 |
| ChromaDB store | ✅ Fix stored in knowledge base |
| Apply agent | ✅ LIVE mode, `rowcount=4`, COMMITTED |
| Audit written | ✅ `action=applied`, `dry_run=false`, `rows_affected=4` |
| Production data | ✅ employees 5, 6, 7, 9 → `region='unknown'` |