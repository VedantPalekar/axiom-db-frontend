"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { axiomApi } from "../../lib/api";
import type { FixReport, ReportStats } from "../../lib/types";
import { LayoutShell } from "../layout-shell";
import { cn, formatDate, formatConfidence } from "../../lib/utils";

const anomalyTypeLabels: Record<string, string> = {
  null_violation: "Null Violation",
  range_violation: "Range Violation",
  uniqueness_violation: "Uniqueness Violation",
  referential_integrity: "Referential Integrity",
  format_violation: "Format Violation",
  schema_drift: "Schema Drift",
  unknown: "Unknown",
};

const fixTypeColors: Record<string, string> = {
  update: "bg-blue-50 text-blue-700 ring-blue-100",
  delete: "bg-rose-50 text-rose-700 ring-rose-100",
  insert: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  other: "bg-stone-100 text-stone-600 ring-stone-200",
};

const severityColors: Record<string, string> = {
  critical: "bg-red-50 text-red-700 ring-red-100",
  high: "bg-orange-50 text-orange-700 ring-orange-100",
  medium: "bg-amber-50 text-amber-700 ring-amber-100",
  low: "bg-stone-100 text-stone-600 ring-stone-200",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 shadow-sm",
        highlight ? "border-amber-200 bg-amber-50/40" : "border-stone-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            highlight ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-stone-100", className)} />
  );
}

// ── Stats Row ─────────────────────────────────────────────────────────────────

function StatsRow() {
  const { data, isLoading } = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => axiomApi.getReportStats(),
    refetchInterval: 10_000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const stats: ReportStats = data;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        label="Incidents Resolved"
        value={stats.total_incidents}
        icon={ShieldCheck}
        highlight
      />
      <StatCard
        label="Rows Healed"
        value={stats.total_rows_healed.toLocaleString()}
        sub="across all fixes"
        icon={Zap}
      />
      <StatCard
        label="Avg Confidence"
        value={formatConfidence(stats.avg_confidence)}
        sub="LLM diagnosis score"
        icon={CheckCircle2}
      />
      <StatCard
        label="Tables Touched"
        value={stats.tables_touched}
        sub="unique tables healed"
        icon={Database}
      />
      <StatCard
        label="Recurrence Rate"
        value={`${Math.round(stats.recurrence_rate * 100)}%`}
        sub="of fixes were repeat issues"
        icon={RotateCcw}
      />
    </div>
  );
}

// ── SQL Panel ─────────────────────────────────────────────────────────────────

function SqlPanel({ sql }: { sql: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
        Fix SQL
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-stone-800">
        <code>{sql}</code>
      </pre>
    </div>
  );
}

// ── Incident Card ─────────────────────────────────────────────────────────────

function IncidentCard({ report }: { report: FixReport }) {
  const [expanded, setExpanded] = useState(false);

  const anomalyLabel =
    anomalyTypeLabels[report.anomaly_type] ?? report.anomaly_type;
  const isRecurring = report.recurrence_count > 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* ── Card Header ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left"
      >
        {/* left: icon */}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>

        {/* centre: main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-stone-900">
              {report.table_name}
            </span>
            {report.column_name && (
              <>
                <span className="text-stone-400">·</span>
                <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700">
                  {report.column_name}
                </span>
              </>
            )}

            {/* fix type badge */}
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                fixTypeColors[report.fix_type] ?? fixTypeColors.other,
              )}
            >
              {report.fix_type.toUpperCase()}
            </span>

            {/* severity badge */}
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                severityColors[report.anomaly_severity] ?? severityColors.low,
              )}
            >
              {report.anomaly_severity}
            </span>

            {/* recurrence pill — the wow factor */}
            {isRecurring && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-100">
                <RotateCcw className="h-3 w-3" />
                {report.recurrence_count + 1}
                {report.recurrence_count + 1 === 2
                  ? "nd"
                  : report.recurrence_count + 1 === 3
                  ? "rd"
                  : "th"}{" "}
                occurrence
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
            <span>{anomalyLabel}</span>
            <span>{report.rows_affected.toLocaleString()} rows healed</span>
            <span>Confidence {formatConfidence(report.confidence)}</span>
            {report.assertions_total > 0 && (
              <span
                className={cn(
                  report.assertions_passed === report.assertions_total
                    ? "text-emerald-600"
                    : "text-amber-600",
                )}
              >
                {report.assertions_passed}/{report.assertions_total} assertions
                passed
              </span>
            )}
            <span>{formatDate(report.created_at)}</span>
          </div>
        </div>

        {/* right: chevron */}
        <div className="mt-1 shrink-0 text-stone-400">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* ── Expanded Detail ── */}
      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-5 pt-4 space-y-4">
          <SqlPanel sql={report.fix_sql} />

          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <p className="text-stone-500">Sandbox</p>
              <p className="mt-1 font-semibold text-stone-900">
                {report.sandbox_passed ? "✓ Passed" : "✗ Failed"}
              </p>
            </div>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <p className="text-stone-500">Post-apply</p>
              <p className="mt-1 font-semibold text-stone-900">
                {report.post_apply_passed ? "✓ Verified" : "✗ Failed"}
              </p>
            </div>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <p className="text-stone-500">Approver</p>
              <p className="mt-1 font-semibold text-stone-900 capitalize">
                {report.approver}
              </p>
            </div>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
              <p className="text-stone-500">Event ID</p>
              <p className="mt-1 font-mono font-semibold text-stone-900 truncate">
                {report.event_id.slice(0, 8)}…
              </p>
            </div>
          </div>

          {report.downstream_tables.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500">
                Downstream tables affected
              </p>
              <div className="flex flex-wrap gap-2">
                {report.downstream_tables.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {report.recurrence_count > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-violet-100 bg-violet-50/60 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
              <p className="text-xs text-violet-800">
                <span className="font-semibold">Recurring issue.</span> This
                column has been fixed {report.recurrence_count + 1} times for
                the same anomaly type. Consider adding a data quality test or a
                constraint to prevent it at source.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

const ANOMALY_TYPES = [
  { value: "", label: "All types" },
  { value: "null_violation", label: "Null Violation" },
  { value: "range_violation", label: "Range Violation" },
  { value: "uniqueness_violation", label: "Uniqueness Violation" },
  { value: "referential_integrity", label: "Referential Integrity" },
  { value: "format_violation", label: "Format Violation" },
];

function FilterBar({
  tableFilter,
  anomalyFilter,
  onTableChange,
  onAnomalyChange,
}: {
  tableFilter: string;
  anomalyFilter: string;
  onTableChange: (v: string) => void;
  onAnomalyChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="Filter by table name…"
        value={tableFilter}
        onChange={(e) => onTableChange(e.target.value)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
      />
      <select
        value={anomalyFilter}
        onChange={(e) => onAnomalyChange(e.target.value)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-200"
      >
        {ANOMALY_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const [tableFilter, setTableFilter] = useState("");
  const [anomalyFilter, setAnomalyFilter] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["reports", tableFilter],
    queryFn: () =>
      axiomApi.getReports(100, tableFilter.trim() || undefined),
    refetchInterval: 10_000,
  });

  // client-side anomaly filter — no extra API call needed
  const filtered = (data?.reports ?? []).filter((r) => {
    if (anomalyFilter && r.anomaly_type !== anomalyFilter) return false;
    return true;
  });

  return (
    <LayoutShell
      title="Incident Timeline"
      description="Every fix AxiomDB has applied — the institutional memory of your database health"
    >
      <div className="space-y-6">
        {/* ── Page Header Actions ── */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCcw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <StatsRow />

        {/* ── Filter Bar ── */}
        <div className="flex items-center justify-between gap-4">
          <FilterBar
            tableFilter={tableFilter}
            anomalyFilter={anomalyFilter}
            onTableChange={setTableFilter}
            onAnomalyChange={setAnomalyFilter}
          />
          {data && (
            <p className="text-sm text-stone-500">
              {filtered.length} of {data.count} incidents
            </p>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
            <p className="text-sm font-semibold text-rose-900">
              Failed to load incidents
            </p>
            <p className="mt-1 text-xs text-rose-700">
              {error instanceof Error
                ? error.message
                : "Backend returned an error."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-4 text-sm font-medium text-stone-600">
              {data?.count === 0
                ? "No incidents yet — apply a fix in Live mode to generate the first report."
                : "No incidents match your current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <IncidentCard key={report.report_id} report={report} />
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}