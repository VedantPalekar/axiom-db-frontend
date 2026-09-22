"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { X, ExternalLink, Activity, Scan, Target, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { useConnection } from "../../hooks/use-connections";
import { LoadingSkeleton } from "../shared/loading-skeleton";
import { EmptyState } from "../shared/empty-state";
import { ConnectionStatus } from "../../lib/types";
import Link from "next/link";
import { HealthCard } from "./health-card";
import { LiveTableViewer } from "./live-table-viewer";
import { ReProfileModal } from "./re-profile-modal";

interface ConnectionDetailModalProps {
  connectionId: string;
  onClose: () => void;
}

const statusOrder: ConnectionStatus[] = ["pending", "connected", "ingesting", "profiling", "ready"];

export function ConnectionDetailModal({ connectionId, onClose }: ConnectionDetailModalProps) {
  const queryClient = useQueryClient();
  const [isReProfileOpen, setIsReProfileOpen] = useState(false);
  const prevStatusRef = useRef<ConnectionStatus | null>(null);
  const [pollInterval, setPollInterval] = useState(5000);

  const { data: connection, isLoading, isError, error } = useConnection(connectionId, pollInterval);

  useEffect(() => {
    if (connection) {
      const isPendingStatus = ["pending", "connected", "ingesting", "profiling"].includes(connection.status);
      setPollInterval(isPendingStatus ? 3000 : 5000);

      if (prevStatusRef.current === "profiling" && connection.status === "ready") {
        toast.success("Database re-profiled successfully", {
          description: "Health data and tables have been updated."
        });
        queryClient.invalidateQueries({ queryKey: ["connection-health", connectionId] });
        queryClient.invalidateQueries({ queryKey: ["live-table", connectionId] });
      } else if (prevStatusRef.current === "profiling" && connection.status === "failed") {
        toast.error("Re-profiling failed", {
          description: connection.error || "Unknown error occurred"
        });
      }
      prevStatusRef.current = connection.status;
    }
  }, [connection?.status, connection?.error, connectionId, queryClient]);

  const currentStatusIndex = connection ? statusOrder.indexOf(connection.status) : -1;
  const isFailed = connection?.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-stone-900">Connection Details</h2>
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
              <LoadingSkeleton className="h-32 w-full" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Error loading connection"
              description={error instanceof Error ? error.message : "Failed to load details"}
            />
          ) : connection ? (
            <div className="space-y-8">
              {/* Header Info */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">{connection.service_name}</h3>
                    <p className="text-sm font-mono text-stone-500 mt-1">{connection.connection_hint}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 capitalize ${
                    connection.status === "ready" 
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : isFailed
                      ? "bg-rose-50 text-rose-700 ring-rose-100"
                      : connection.status === "connected"
                      ? "bg-blue-50 text-blue-700 ring-blue-100"
                      : "bg-amber-50 text-amber-700 ring-amber-100"
                  }`}>
                    {connection.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-stone-200">
                  <div>
                    <span className="text-stone-500 block mb-1">Database</span>
                    <span className="font-medium text-stone-900">{connection.db_name}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block mb-1">Schemas</span>
                    <span className="font-medium text-stone-900">{connection?.schema_names?.join(", ") || "All"}</span>
                  </div>
                </div>
              </div>

              {/* Status Progression */}
              <div>
                <h3 className="text-sm font-medium text-stone-900 mb-4">Connection Progress</h3>
                
                {isFailed ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-rose-900">Connection Failed</h4>
                        <p className="mt-1 text-sm text-rose-700">{connection.error || "An unknown error occurred during connection."}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-stone-200 ml-3 space-y-6">
                    {[
                      { state: "pending", label: "Initialization", desc: "Setting up connection parameters...", icon: Activity },
                      { state: "connected", label: "Connection Established", desc: "Successfully connected to database.", icon: Database },
                      { state: "ingesting", label: "Metadata Ingestion", desc: "Syncing metadata to OpenMetadata...", icon: Scan },
                      { state: "profiling", label: "Anomaly Profiling", desc: "Running data quality scans...", icon: Target },
                      { state: "ready", label: "Ready", desc: "Agent is actively monitoring this connection.", icon: CheckCircle2 }
                    ].map((step, idx) => {
                      const isActive = connection.status === step.state;
                      const isCompleted = currentStatusIndex > idx || connection.status === "ready";
                      const isPending = !isActive && !isCompleted;
                      
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.state} className="relative pl-6">
                          <span className={`absolute -left-[17px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${
                            isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-amber-400 text-white animate-pulse" : "bg-stone-200 text-stone-400"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-h-[2rem]">
                            <h4 className={`text-sm font-medium ${isPending ? 'text-stone-400' : 'text-stone-900'}`}>{step.label}</h4>
                            <p className="text-xs text-stone-500 mt-1">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Related Entities */}
              {connection.profiling_report_id && (
                <div className="border-t border-stone-200 pt-6">
                  <h3 className="text-sm font-medium text-stone-900 mb-3">Related Resources</h3>
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1 rounded-lg border border-stone-200 p-4 flex justify-between items-center bg-stone-50 hover:bg-stone-100 transition-colors">
                      <div>
                        <p className="text-xs text-stone-500">Profiling Report</p>
                        <p className="text-sm font-medium text-stone-900 mt-1">{connection.tables_found ?? '--'} tables scanned ({connection.total_anomalies ?? '--'} anomalies)</p>
                      </div>
                      <Link 
                        href={`/profiling?report=${connection.profiling_report_id}`} 
                        className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-md transition-colors"
                        title="View Report"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {connection.profiling_report_id && (
                <div className="border-t border-stone-200 pt-6 space-y-6">
                  <HealthCard 
                    connectionId={connectionId} 
                    onReProfileClick={() => setIsReProfileOpen(true)}
                    isReProfiling={["pending", "connected", "ingesting", "profiling"].includes(connection.status)}
                  />
                  <LiveTableViewer connectionId={connectionId} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {isReProfileOpen && connection && (
        <ReProfileModal 
          connection={connection} 
          onClose={() => setIsReProfileOpen(false)} 
          onSuccess={() => setIsReProfileOpen(false)}
        />
      )}
    </div>
  );
}
