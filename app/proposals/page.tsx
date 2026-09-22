"use client";

import { usePendingProposals, useApproveProposal, useRejectProposal, useProposal } from "../../hooks/use-proposals";
import { ProposalTable } from "../../components/proposals/proposal-table";
import { ProposalDetailModal } from "../../components/proposals/proposal-detail-modal";
import { LayoutShell } from "../layout-shell";
import { EmptyState } from "../../components/shared/empty-state";
import { LoadingSkeleton } from "../../components/shared/loading-skeleton";
import { useState } from "react";
import { Inbox } from "lucide-react";

export default function ProposalsPage() {
  const { data, isLoading, isError, error } = usePendingProposals();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const pendingProposals = data?.proposals || [];

  return (
    <LayoutShell
      title="Proposals"
      description="Review and act on pending database repair proposals."
    >
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Pending Actions</h2>
            <p className="mt-1 text-sm text-stone-500">
              Proposals awaiting human review. Auto-refreshes every 5 seconds.
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Inbox className="h-5 w-5" />
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
            title="Failed to load proposals"
            description={
              error instanceof Error
                ? error.message
                : "Unable to load pending proposals from the server."
            }
          />
        ) : pendingProposals.length === 0 ? (
          <EmptyState
            title="All caught up"
            description="There are no pending proposals requiring your review."
          />
        ) : (
          <ProposalTable 
            proposals={pendingProposals} 
            onView={(id) => setSelectedProposalId(id)}
          />
        )}
      </section>

      {selectedProposalId && (
        <ProposalDetailModal 
          proposalId={selectedProposalId} 
          onClose={() => setSelectedProposalId(null)}
        />
      )}
    </LayoutShell>
  );
}
