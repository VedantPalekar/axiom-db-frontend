"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useProfiles } from "../../hooks/use-profiling";
import { ProfilingForm } from "../../components/profiling/profiling-form";
import { ReportsTable } from "../../components/profiling/reports-table";
import { ReportDetailModal } from "../../components/profiling/report-detail-modal";
import { LayoutShell } from "../layout-shell";
import { EmptyState } from "../../components/shared/empty-state";
import { LoadingSkeleton } from "../../components/shared/loading-skeleton";

export default function ProfilingPage() {
  const { data, isLoading, isError, error } = useProfiles();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const reports = data?.reports || [];

  return (
    <LayoutShell
      title="Profiling"
      description="Run manual profiles or inspect historical profiling reports."
    >
      <div className="space-y-6">
        <ProfilingForm />

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Profiling Reports</h2>
              <p className="mt-1 text-sm text-stone-500">
                Recent analysis runs and their results. Auto-refreshes every 10 seconds.
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Search className="h-5 w-5" />
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
              title="Failed to load reports"
              description={
                error instanceof Error
                  ? error.message
                  : "Unable to load profiling reports from the server."
              }
            />
          ) : reports.length === 0 ? (
            <EmptyState
              title="No reports found"
              description="Run a new profile above to see results here."
            />
          ) : (
            <ReportsTable 
              reports={reports} 
              onView={(id) => setSelectedReportId(id)}
            />
          )}
        </section>
      </div>

      {selectedReportId && (
        <ReportDetailModal 
          reportId={selectedReportId} 
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </LayoutShell>
  );
}
