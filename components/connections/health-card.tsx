"use client";

import { useConnectionHealth } from "../../hooks/use-connections";
import { LoadingSkeleton } from "../shared/loading-skeleton";
import { EmptyState } from "../shared/empty-state";
import { formatRelativeTime } from "../../lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from "lucide-react";

interface HealthCardProps {
  connectionId: string;
  onReProfileClick?: () => void;
  isReProfiling?: boolean;
}

export function HealthCard({ connectionId, onReProfileClick, isReProfiling }: HealthCardProps) {
  const { data, isLoading, isError, error } = useConnectionHealth(connectionId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm mb-6 flex flex-col">
        <div className="p-5 border-b border-stone-200 bg-stone-50">
          <LoadingSkeleton className="h-6 w-1/4 mb-2" />
          <LoadingSkeleton className="h-4 w-1/3" />
        </div>
        <div className="p-5">
          <LoadingSkeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
        <EmptyState
          title="Health check failed"
          description={error instanceof Error ? error.message : "Failed to load connection health"}
        />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  let scoreColorClass = "text-rose-600";
  if (data.health_score >= 80) scoreColorClass = "text-emerald-600";
  else if (data.health_score >= 50) scoreColorClass = "text-amber-500";

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm mb-6 overflow-hidden">
      <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Database Health</h3>
          <p className="mt-1 text-xs text-stone-500 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Checked {formatRelativeTime(data.last_profiled_at)}
            </span>
            {onReProfileClick && (
              <button 
                onClick={onReProfileClick} 
                disabled={isReProfiling}
                className="ml-1 text-[10px] font-semibold uppercase tracking-wider bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReProfiling ? "Profiling..." : "Re-Profile"}
              </button>
            )}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tracking-tighter ${scoreColorClass}`}>
            {data.health_score}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mt-1">
            {data.status}
          </span>
        </div>
      </div>
      
      <div className="px-5 py-4 flex gap-6 text-sm border-b border-stone-200 bg-white">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">{data.critical_count} Critical</span>
        </div>
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">{data.warning_count} Warnings</span>
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
            <tr>
              <th className="px-5 py-2 font-medium">Table</th>
              <th className="px-5 py-2 font-medium w-32">Anomalies</th>
              <th className="px-5 py-2 font-medium w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {data.tables.map((t) => (
              <tr key={`${t.schema}.${t.table_name}`} className="hover:bg-stone-50 transition-colors">
                <td className="px-5 py-3 font-medium text-stone-900">
                  {t.schema}.{t.table_name}
                </td>
                <td className="px-5 py-3 text-stone-600">
                  {t.anomaly_count}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      t.status === "clean"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : t.status === "dirty"
                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    }`}
                  >
                    {t.status === "clean" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.tables.length === 0 && (
          <div className="p-6 text-center text-stone-500 text-sm">
            No tables found.
          </div>
        )}
      </div>
    </div>
  );
}
