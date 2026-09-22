"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import { useConnections } from "../../hooks/use-connections";
import { ConnectionForm } from "../../components/connections/connection-form";
import { ConnectionsTable } from "../../components/connections/connections-table";
import { ConnectionDetailModal } from "../../components/connections/connection-detail-modal";
import { LayoutShell } from "../layout-shell";
import { EmptyState } from "../../components/shared/empty-state";
import { LoadingSkeleton } from "../../components/shared/loading-skeleton";

export default function ConnectionsPage() {
  const { data, isLoading, isError, error } = useConnections();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const connections = data?.connections || [];

  return (
    <LayoutShell
      title="Connections"
      description="Manage target databases and view their profiling status."
    >
      <div className="space-y-6">
        <ConnectionForm />

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Registered Connections</h2>
              <p className="mt-1 text-sm text-stone-500">
                Databases currently being monitored by AxiomDB. Auto-refreshes every 5 seconds.
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Network className="h-5 w-5" />
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
              title="Failed to load connections"
              description={
                error instanceof Error
                  ? error.message
                  : "Unable to load connections from the server."
              }
            />
          ) : connections.length === 0 ? (
            <EmptyState
              title="No connections found"
              description="Connect a database above to start monitoring and profiling."
            />
          ) : (
            <ConnectionsTable 
              connections={connections} 
              onView={(id) => setSelectedConnectionId(id)}
            />
          )}
        </section>
      </div>

      {selectedConnectionId && (
        <ConnectionDetailModal 
          connectionId={selectedConnectionId} 
          onClose={() => setSelectedConnectionId(null)}
        />
      )}
    </LayoutShell>
  );
}
