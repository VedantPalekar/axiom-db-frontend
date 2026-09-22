"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useAuditEntry } from "../../../hooks/use-dashboard";
import { AuditEntryDetail, getAssertionSummary } from "../../../components/audit/audit-entry-detail";
import { EmptyState } from "../../../components/shared/empty-state";
import { LoadingSkeleton } from "../../../components/shared/loading-skeleton";
import { LayoutShell } from "../../layout-shell";
import { formatConfidence, formatDate, truncateFqn } from "../../../lib/utils";

interface AuditDetailPageProps {
  params: Promise<{ event_id: string }>;
}

const actionTone: Record<string, string> = {
  applied: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  dry_run: "bg-amber-50 text-amber-700 ring-amber-100",
  failed: "bg-rose-50 text-rose-700 ring-rose-100",
  rolled_back: "bg-orange-50 text-orange-700 ring-orange-100",
  skipped: "bg-stone-100 text-stone-700 ring-stone-200",
};

export default function AuditDetailPage({ params }: AuditDetailPageProps) {
  const { event_id: eventId } = use(params);
  const { data: entry, isLoading, isError, error } = useAuditEntry(eventId);

  return (
    <LayoutShell
      title="Audit Detail"
      description="Deep-link view for a single audit event, including SQL, verification results, and execution outcome."
    >
      <div className="space-y-6">
        <div>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Audit Log
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <LoadingSkeleton className="h-32 w-full" />
            <LoadingSkeleton className="h-80 w-full" />
          </div>
        ) : isError ? (
          <EmptyState
            title="Audit entry unavailable"
            description={
              error instanceof Error
                ? error.message
                : "The backend did not return audit detail for this event."
            }
          />
        ) : !entry ? (
          <EmptyState
            title="Audit entry not found"
            description="This event ID does not exist or is no longer available."
          />
        ) : (
          <>
            <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                        actionTone[entry.action] ?? "bg-stone-100 text-stone-700 ring-stone-200"
                      }`}
                    >
                      {entry.action.replace("_", " ")}
                    </span>
                    <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200">
                      Event ID
                    </span>
                  </div>

                  <h2 className="truncate text-xl font-semibold text-stone-900">
                    {truncateFqn(entry.table_fqn)}
                  </h2>
                  <p className="mt-1 break-all font-mono text-xs text-stone-500">
                    {entry.event_id}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-stone-500">Applied</p>
                  <p className="text-sm font-medium text-stone-900">
                    {formatDate(entry.applied_at)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Rows affected</p>
                  <p className="mt-1 text-2xl font-semibold text-stone-900">
                    {entry.rows_affected}
                  </p>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Confidence</p>
                  <p className="mt-1 text-2xl font-semibold text-stone-900">
                    {formatConfidence(entry.confidence)}
                  </p>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Sandbox</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {entry.sandbox_passed ? "Passed" : "Failed"}
                  </p>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Verification</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {(() => {
                      const summary = getAssertionSummary(entry.post_apply_assertions);
                      return summary.total > 0
                        ? `${summary.passed}/${summary.total} passed`
                        : "No checks returned";
                    })()}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5 text-sm text-stone-500">
                <span>Table: {entry.table_name}</span>
                <span className="hidden sm:inline text-stone-300">|</span>
                <span className="break-all">{entry.table_fqn}</span>
                <Link
                  href={`/audit/${encodeURIComponent(entry.event_id)}`}
                  className="inline-flex items-center gap-1 text-stone-500 transition-colors hover:text-stone-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  Event URL
                </Link>
              </div>
            </section>

            <AuditEntryDetail entry={entry} />
          </>
        )}
      </div>
    </LayoutShell>
  );
}
