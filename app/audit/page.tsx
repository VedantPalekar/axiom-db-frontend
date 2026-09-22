"use client";

import { useState } from "react";
import { ClipboardList, RefreshCcw } from "lucide-react";
import { useAudit } from "../../hooks/use-dashboard";
import { AuditTable } from "../../components/audit/audit-table";
import { LoadingSkeleton } from "../../components/shared/loading-skeleton";
import { EmptyState } from "../../components/shared/empty-state";
import { LayoutShell } from "../layout-shell";
import type { AuditEntry } from "../../lib/types";

const ACTION_FILTERS = [
  { label: "All", value: "" },
  { label: "Applied", value: "applied" },
  { label: "Dry Run", value: "dry_run" },
  { label: "Rolled Back", value: "rolled_back" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
] as const;

type ActionFilter = (typeof ACTION_FILTERS)[number]["value"];

const LIMIT_OPTIONS = [20, 50, 100] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("");
  const [limit, setLimit] = useState<LimitOption>(50);

  const { data, isLoading, isError, error, dataUpdatedAt } = useAudit(limit);

  const entries: AuditEntry[] = (data?.entries ?? []).filter(
    (e) => !actionFilter || e.action === actionFilter
  );

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <LayoutShell
      title="Audit Log"
      description="Full history of applied fixes, dry runs, rollbacks, and failures across all pipeline executions."
    >
      <div className="space-y-6">
        {/* ── Controls ── */}
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mr-1">
                Filter
              </span>
              {ACTION_FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setActionFilter(value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    actionFilter === value
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Limit
              </span>
              <div className="flex items-center gap-1">
                {LIMIT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setLimit(n)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      limit === n
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Entries table ── */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Audit Entries</h2>
              <p className="mt-1 text-sm text-stone-500">
                {actionFilter ? (
                  <>
                    Showing <span className="font-medium text-stone-700">{entries.length}</span>{" "}
                    <span className="font-medium text-stone-700">{actionFilter.replace("_", " ")}</span>{" "}
                    entries (of {data?.count ?? 0} total). Auto-refreshes every 5 seconds.
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-medium text-stone-700">{data?.count ?? 0}</span>{" "}
                    entries. Auto-refreshes every 5 seconds.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {lastUpdated && (
                <span className="hidden sm:inline text-xs text-stone-400">
                  Last updated {lastUpdated}
                </span>
              )}
              <div className="rounded-xl bg-stone-50 p-3 text-stone-500">
                <RefreshCcw className="h-5 w-5" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              title="Audit log unavailable"
              description={
                error instanceof Error
                  ? error.message
                  : "The backend did not return audit entries."
              }
            />
          ) : entries.length === 0 ? (
            <EmptyState
              title="No matching entries"
              description={
                actionFilter
                  ? `No ${actionFilter.replace("_", " ")} entries found. Try a different filter.`
                  : "No audit entries yet. Applied fixes and dry runs will appear here once the pipeline runs."
              }
            />
          ) : (
            <AuditTable entries={entries} />
          )}
        </section>

        {/* ── Summary cards ── */}
        {!isLoading && data && data.entries.length > 0 && (
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-stone-50 p-3 text-stone-500">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-stone-900">Action Breakdown</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(["applied", "dry_run", "rolled_back", "failed", "skipped"] as const).map((action) => {
                const count = data.entries.filter((e) => e.action === action).length;
                const toneMap: Record<string, string> = {
                  applied: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  dry_run: "bg-amber-50 text-amber-700 border-amber-100",
                  failed: "bg-rose-50 text-rose-700 border-rose-100",
                  rolled_back: "bg-orange-50 text-orange-700 border-orange-100",
                  skipped: "bg-stone-50 text-stone-600 border-stone-200",
                };
                return (
                  <button
                    key={action}
                    onClick={() =>
                      setActionFilter((prev) => (prev === action ? "" : action))
                    }
                    className={`rounded-xl border p-4 text-center transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 ${toneMap[action]} ${
                      actionFilter === action ? "ring-2 ring-stone-900" : ""
                    }`}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="mt-1 text-xs font-medium">{action.replace("_", " ")}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </LayoutShell>
  );
}
