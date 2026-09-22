"use client";

import { X } from "lucide-react";
import { useProfile } from "../../hooks/use-profiling";
import { LoadingSkeleton } from "../shared/loading-skeleton";
import { EmptyState } from "../shared/empty-state";
import { SeverityBadge } from "../shared/severity-badge";

interface ReportDetailModalProps {
  reportId: string;
  onClose: () => void;
}

export function ReportDetailModal({ reportId, onClose }: ReportDetailModalProps) {
  const { data: report, isLoading, isError, error } = useProfile(reportId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-stone-900">Profiling Report</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-6">
              <LoadingSkeleton className="h-24 w-full" />
              <LoadingSkeleton className="h-48 w-full" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Error loading report"
              description={error instanceof Error ? error.message : "Failed to load details"}
            />
          ) : report ? (
            <div className="space-y-8">
              {/* Header Details */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-stone-200 p-4 text-center">
                  <p className="text-xs text-stone-500 mb-1">Status</p>
                  <p className="text-lg font-semibold text-stone-900 capitalize">{report.status}</p>
                </div>
                <div className="rounded-lg border border-stone-200 p-4 text-center">
                  <p className="text-xs text-stone-500 mb-1">Tables Scanned</p>
                  <p className="text-lg font-semibold text-stone-900">{report.tables_scanned}</p>
                </div>
                <div className="rounded-lg border border-stone-200 p-4 text-center">
                  <p className="text-xs text-stone-500 mb-1">Total Anomalies</p>
                  <p className="text-lg font-semibold text-stone-900">{report.total_anomalies}</p>
                </div>
                <div className="rounded-lg border border-stone-200 p-4 text-center">
                  <p className="text-xs text-stone-500 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-stone-900">{report.duration_ms ? (report.duration_ms / 1000).toFixed(2) : '--'}s</p>
                </div>
              </div>

              {/* Error Message */}
              {report.error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm text-rose-700">{report.error}</p>
                </div>
              )}

              {/* Tables & Anomalies */}
              <div>
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Table Anomalies</h3>
                
                {(!report.tables || report.tables.length === 0) ? (
                  <EmptyState 
                    title="No tables found" 
                    description={report.status === "completed" ? "No anomalies detected in the scanned database." : "Could not scan tables or waiting for completion."} 
                  />
                ) : (
                  <div className="space-y-6">
                    {report.tables.map((table) => (
                      <div key={`${table.schema_name}.${table.table_name}`} className="overflow-hidden rounded-xl border border-stone-200">
                        <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex justify-between items-center">
                          <p className="font-medium text-stone-900">{table.schema_name}.{table.table_name}</p>
                          <span className="text-xs text-stone-500">
                            {table?.anomalies?.length || 0} anomal{table?.anomalies?.length === 1 ? 'y' : 'ies'}
                          </span>
                        </div>
                        {table?.anomalies?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-white text-xs uppercase text-stone-500 border-b border-stone-200">
                                <tr>
                                  <th className="px-4 py-3 font-medium">Column</th>
                                  <th className="px-4 py-3 font-medium">Type</th>
                                  <th className="px-4 py-3 font-medium">Severity</th>
                                  <th className="px-4 py-3 font-medium">Details</th>
                                  <th className="px-4 py-3 font-medium">Rate</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 bg-white">
                                {table?.anomalies?.map((anomaly, idx) => (
                                  <tr key={idx} className="hover:bg-stone-50/50">
                                    <td className="px-4 py-3 font-medium text-stone-900">{anomaly.column_name}</td>
                                    <td className="px-4 py-3 text-stone-600">{anomaly.anomaly_type}</td>
                                    <td className="px-4 py-3"><SeverityBadge severity={anomaly.severity || "info"} /></td>
                                    <td className="px-4 py-3 text-stone-600 max-w-xs truncate" title={anomaly.description}>{anomaly.description}</td>
                                    <td className="px-4 py-3 text-stone-600">{((anomaly.rate || 0) * 100).toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-stone-500">
                            No anomalies detected in this table.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
