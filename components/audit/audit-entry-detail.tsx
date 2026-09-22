"use client";

import { Check, ChevronDown, ShieldAlert, ShieldCheck, X } from "lucide-react";
import type { AuditAssertion, AuditEntry } from "../../lib/types";
import { cn } from "../../lib/utils";

const failureCategoryLabels: Record<string, string> = {
  null_violation: "Null values found",
  duplicate_rows: "Duplicate rows detected",
  duplicate_record: "Duplicate records detected",
  uniqueness_violation: "Uniqueness violation",
  out_of_range: "Out-of-range values",
  invalid_reference: "Invalid reference",
  foreign_key_violation: "Foreign key violation",
  malformed_value: "Malformed values",
  stale_data: "Stale data",
  format_mismatch: "Format mismatch",
  missing_required_value: "Missing required value",
};

function toSentenceCase(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getFailureLabel(category: string) {
  return failureCategoryLabels[category] ?? toSentenceCase(category);
}

export function getAssertionSummary(assertions: AuditAssertion[] | null | undefined) {
  const safeAssertions = assertions ?? [];
  const total = safeAssertions.length;
  const passed = safeAssertions.filter((assertion) => assertion.passed).length;

  return { passed, total };
}

function AssertionList({
  assertions,
}: {
  assertions: AuditAssertion[] | null | undefined;
}) {
  const safeAssertions = assertions ?? [];

  if (safeAssertions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
        No post-apply assertions were returned for this entry.
      </div>
    );
  }

  const summary = getAssertionSummary(safeAssertions);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-stone-900">Verification summary</p>
          <p className="text-xs text-stone-500">
            {summary.passed}/{summary.total} checks passed after execution
          </p>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1",
            summary.passed === summary.total
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-amber-50 text-amber-700 ring-amber-100",
          )}
        >
          {summary.passed}/{summary.total} passed
        </span>
      </div>

      <div className="space-y-2">
        {safeAssertions.map((assertion, index) => (
          <div
            key={`${assertion.test_name}-${assertion.column ?? "none"}-${index}`}
            className={cn(
              "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-start sm:justify-between",
              assertion.passed
                ? "border-emerald-100 bg-emerald-50/60"
                : "border-rose-100 bg-rose-50/60",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full",
                  assertion.passed
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700",
                )}
                aria-hidden="true"
              >
                {assertion.passed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </span>

              <div>
                <p className="text-sm font-medium text-stone-900">
                  {toSentenceCase(assertion.test_name)}
                </p>
                {assertion.column ? (
                  <p className="text-xs text-stone-500">Column: {assertion.column}</p>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-stone-700 sm:max-w-md sm:text-right">
              {assertion.actual_value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SqlPanel({
  title,
  sql,
  tone = "stone",
  emptyMessage = "No SQL was recorded for this entry.",
}: {
  title: string;
  sql: string | null;
  tone?: "stone" | "rose";
  emptyMessage?: string;
}) {
  if (!sql) {
    return (
      <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
        {emptyMessage}
      </div>
    );
  }

  const toneClass =
    tone === "rose"
      ? "border-rose-200 bg-rose-50/60"
      : "border-stone-200 bg-stone-50";

  return (
    <div className={cn("rounded-lg border p-4", toneClass)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-stone-800">
        <code>{sql}</code>
      </pre>
    </div>
  );
}

export function AuditEntryDetail({ entry }: { entry: AuditEntry }) {
  const assertions = entry.post_apply_assertions ?? [];

  return (
    <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      {entry.action === "dry_run" ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              This was a dry run - no changes were made to the database
            </p>
            <p className="mt-1 text-xs text-amber-700">
              The pipeline validated the proposed fix path without applying a production mutation.
            </p>
          </div>
        </div>
      ) : null}

      {entry.action === "failed" && entry.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            Execution error
          </p>
          <p className="mt-2 text-sm text-rose-800">{entry.error}</p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-5">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">What was wrong</h3>
                <p className="mt-1 text-xs text-stone-500">
                  Categories reported for this repair event
                </p>
              </div>
            </div>

            {entry.failure_categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entry.failure_categories.map((category, index) => (
                  <span
                    key={`${category}-${index}`}
                    className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200"
                  >
                    {getFailureLabel(category)}
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
                No failure categories were attached to this audit row.
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              {entry.action === "failed" ? (
                <ShieldAlert className="h-4 w-4 text-rose-600" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              )}
              <h3 className="text-sm font-semibold text-stone-900">Fix applied</h3>
            </div>
            <SqlPanel
              title="Production SQL"
              sql={entry.fix_sql}
              tone={entry.action === "failed" ? "rose" : "stone"}
              emptyMessage={
                entry.action === "dry_run"
                  ? "No production SQL ran for this dry run."
                  : "No SQL was recorded for this entry."
              }
            />
          </section>
        </div>

        <div className="space-y-5">
          <section>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-stone-900">
                Post-apply verification
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Checklist results captured immediately after execution
              </p>
            </div>
            <AssertionList assertions={assertions} />
          </section>

          {entry.rollback_sql ? (
            <details className="group rounded-lg border border-stone-200 bg-stone-50/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-stone-900">
                <span>Rollback SQL</span>
                <span className="text-xs text-stone-500 transition-transform group-open:rotate-180">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <div className="border-t border-stone-200 px-4 py-4">
                <SqlPanel title="Rollback statement" sql={entry.rollback_sql} />
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
