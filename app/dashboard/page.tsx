"use client";

import { AlertTriangle, DatabaseZap, RefreshCcw, Shield } from "lucide-react";
import { AuditTable } from "../../components/audit/audit-table";
import { EmptyState } from "../../components/shared/empty-state";
import { LoadingSkeleton } from "../../components/shared/loading-skeleton";
import { StreamStats } from "../../components/shared/stream-stats";
import { useAudit, useEscalations, useStreams, useToggleDryRun, useSystemStatus } from "../../hooks/use-dashboard";
import { formatDate } from "../../lib/utils";
import { LayoutShell } from "../layout-shell";

function PipelineHealthCard() {
  const { data, isLoading, isError, error } = useSystemStatus();
  const toggleMutation = useToggleDryRun();

  if (isLoading) {
    return <LoadingSkeleton className="h-40 w-full" />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Unable to load pipeline status"
        description={
          error instanceof Error
            ? error.message
            : "The backend did not return status data."
        }
      />
    );
  }

  const pipelineEntries = Object.entries(data?.pipeline ?? {});
  const healthyCount = pipelineEntries.filter(([, status]) => status === "ok").length;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">Pipeline health</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">
            {healthyCount}/{pipelineEntries.length} stages healthy
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Status auto-refreshes every 10 seconds.
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <Shield className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {pipelineEntries.map(([stage, status]) => (
          <div
            key={stage}
            className="rounded-xl border border-stone-200 bg-stone-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-700">{stage}</p>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                  status === "ok"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : "bg-amber-50 text-amber-700 ring-amber-100"
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-5">
        <div className="flex flex-wrap gap-4 text-sm text-stone-500">
          <span>Version {data?.version ?? "unknown"}</span>
          <span>Threshold {Math.round((data?.confidence_threshold ?? 0) * 100)}%</span>
          <span className={data?.dry_run ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"}>
            {data?.dry_run ? "Dry-run mode enabled" : "Live apply mode enabled"}
          </span>
        </div>

        <button
          onClick={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
            data?.dry_run
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-200"
          }`}
        >
          {toggleMutation.isPending ? (
            <RefreshCcw className="h-3 w-3 animate-spin" />
          ) : data?.dry_run ? (
            <>
              <Shield className="h-3 w-3" />
              <span>Switch to Live</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              <span>Switch to Dry-Run</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function AuditSection() {
  const { data, isLoading, isError, error } = useAudit();

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Latest audit log</h2>
          <p className="mt-1 text-sm text-stone-500">
            Polling every 5 seconds from <code>/api/v1/audit</code>.
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-stone-500">
          <RefreshCcw className="h-5 w-5" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-12 w-full" />
          <LoadingSkeleton className="h-12 w-full" />
          <LoadingSkeleton className="h-12 w-full" />
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
      ) : (
        <AuditTable entries={data?.entries ?? []} />
      )}
    </section>
  );
}

function StreamsSection() {
  const { data, isLoading, isError, error } = useStreams();

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Streams overview</h2>
          <p className="mt-1 text-sm text-stone-500">
            Redis stream lengths refresh every 5 seconds.
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-stone-500">
          <DatabaseZap className="h-5 w-5" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <LoadingSkeleton className="h-28 w-full" />
          <LoadingSkeleton className="h-28 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Stream metrics unavailable"
          description={
            error instanceof Error
              ? error.message
              : "The backend did not return stream metrics."
          }
        />
      ) : (
        <StreamStats streams={data?.streams ?? {}} />
      )}
    </section>
  );
}

function EscalationsSection() {
  const { data, isLoading, isError, error } = useEscalations();

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Escalations</h2>
          <p className="mt-1 text-sm text-stone-500">
            Review the most recent issues routed out of automation. Auto-refreshes every 10 seconds.
          </p>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-20 w-full" />
          <LoadingSkeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Escalations unavailable"
          description={
            error instanceof Error
              ? error.message
              : "The backend did not return escalations."
          }
        />
      ) : !data?.escalations?.length ? (
        <EmptyState
          title="No escalations"
          description="Rejected proposals and non-repairable diagnoses will surface here when present."
        />
      ) : (
        <div className="space-y-3">
          {data?.escalations?.map((escalation) => (
            <article
              key={escalation.message_id}
              className="rounded-xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                      {escalation.stage}
                    </span>
                    <p className="truncate text-sm font-medium text-stone-900">
                      {escalation.table_fqn}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {escalation.reason}
                  </p>
                </div>
                <div className="shrink-0 text-xs text-stone-500">
                  {formatDate(escalation.escalated_at)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  return (
    <LayoutShell
      title="Dashboard"
      description="Operational view of pipeline health, audit activity, stream backlogs, and escalations."
    >
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <PipelineHealthCard />
          <AuditSection />
        </div>
        <div className="space-y-6">
          <StreamsSection />
          <EscalationsSection />
        </div>
      </div>
    </LayoutShell>
  );
}
