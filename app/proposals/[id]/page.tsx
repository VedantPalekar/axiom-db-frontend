"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Loader2,
  X,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import {
  useProposal,
  useApproveProposal,
  useRejectProposal,
} from "../../../hooks/use-proposals";
import { LoadingSkeleton } from "../../../components/shared/loading-skeleton";
import { EmptyState } from "../../../components/shared/empty-state";
import { DataDiff } from "../../../components/proposals/data-diff";
import { LayoutShell } from "../../layout-shell";
import { formatConfidence, formatDate, truncateFqn } from "../../../lib/utils";

interface ProposalDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusTone: Record<string, string> = {
  pending_approval: "bg-blue-50 text-blue-700 ring-blue-100",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  rejected: "bg-rose-50 text-rose-700 ring-rose-100",
  executing: "bg-amber-50 text-amber-700 ring-amber-100",
  completed: "bg-green-50 text-green-700 ring-green-100",
  failed: "bg-red-50 text-red-700 ring-red-100",
};

export default function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { id: proposalId } = use(params);
  const router = useRouter();

  const { data: proposal, isLoading, isError, error } = useProposal(proposalId);
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = () => {
    approveMutation.mutate(
      { id: proposalId, body: { decided_by: "human_user" } },
      { onSuccess: () => router.push("/proposals") }
    );
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    if (!rejectReason.trim()) return;
    rejectMutation.mutate(
      { id: proposalId, body: { reason: rejectReason, decided_by: "human_user" } },
      { onSuccess: () => router.push("/proposals") }
    );
  };

  const isPending = proposal?.status === "pending_approval";
  const isActing = approveMutation.isPending || rejectMutation.isPending;

  return (
    <LayoutShell
      title="Proposal Detail"
      description="Review the diagnosed issue, proposed fix, and sandbox validation results."
    >
      {/* Back nav */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Proposals
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton className="h-28 w-full" />
          <LoadingSkeleton className="h-48 w-full" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Error loading proposal"
          description={error instanceof Error ? error.message : "Could not load proposal details."}
        />
      ) : proposal ? (
        <div className="space-y-6">
          {/* ── Header card ── */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                      statusTone[proposal.status] ?? "bg-stone-100 text-stone-600 ring-stone-200"
                    }`}
                  >
                    {proposal.status.replace(/_/g, " ")}
                  </span>
                  {proposal.fix_type && (
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        proposal.fix_type === "DELETE"
                          ? "bg-rose-50 text-rose-700 ring-rose-200"
                          : proposal.fix_type === "UPDATE"
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : proposal.fix_type === "INSERT"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-stone-50 text-stone-700 ring-stone-200"
                      }`}
                    >
                      {proposal.fix_type}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-stone-900 truncate">
                  {truncateFqn(proposal.table_fqn)}
                </h2>
                <p className="mt-0.5 text-xs text-stone-400 font-mono">{proposal.table_fqn}</p>
              </div>

              <div className="flex flex-col items-end gap-1 text-right shrink-0">
                <p className="text-xs text-stone-500">Confidence</p>
                <p className="text-2xl font-semibold text-stone-900">
                  {formatConfidence(proposal.confidence)}
                </p>
                <p className="text-xs text-stone-400">Created {formatDate(proposal.created_at)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                <p className="text-xs text-stone-500 mb-1">Rows Affected</p>
                <p className="text-2xl font-semibold text-stone-900">{proposal.rows_affected}</p>
              </div>
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                <p className="text-xs text-stone-500 mb-1">Rows Before</p>
                <p className="text-2xl font-semibold text-stone-900">{proposal.rows_before}</p>
              </div>
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
                <p className="text-xs text-stone-500 mb-1">Rows After</p>
                <p className="text-2xl font-semibold text-stone-900">{proposal.rows_after}</p>
              </div>
              <div className="rounded-lg border border-stone-100 bg-stone-50 p-4 flex flex-col justify-between">
                <p className="text-xs text-stone-500 mb-1">Sandbox</p>
                <div className="flex items-center gap-2">
                  {proposal.sandbox_passed ? (
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ShieldX className="h-5 w-5 text-rose-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      proposal.sandbox_passed ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {proposal.sandbox_passed ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Root cause & failure categories ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Root Cause
              </h3>
              <p className="text-sm leading-6 text-stone-700">{proposal.root_cause}</p>

              {proposal.anomaly_type_label && (
                <div className="mt-4">
                  <p className="text-xs text-stone-500 mb-1">Anomaly Type</p>
                  <span className="inline-block font-medium text-stone-900 text-sm">
                    {proposal.anomaly_type_label}
                  </span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1">
                {proposal.failure_categories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </section>

            {/* ── Fix description ── */}
            <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Fix Description
              </h3>
              <p className="text-sm leading-6 text-stone-700">{proposal.fix_description}</p>
              {proposal.decided_at && (
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <p className="text-xs text-stone-500">
                    Decided on {formatDate(proposal.decided_at)} by{" "}
                    <span className="font-medium text-stone-700">{proposal.decision_by}</span>
                  </p>
                  {proposal.rejection_reason && (
                    <p className="mt-1 text-xs text-rose-600">
                      Rejection reason: {proposal.rejection_reason}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Proposed SQL ── */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Proposed SQL Fix
            </h3>
            <div className="rounded-lg border border-stone-200 bg-stone-950 p-4 overflow-x-auto">
              <pre className="text-sm text-emerald-300 leading-6">
                <code>{proposal.fix_sql_display || proposal.fix_sql}</code>
              </pre>
            </div>

            {proposal.rollback_sql && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Rollback SQL
                </h4>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 overflow-x-auto">
                  <pre className="text-sm text-stone-600 leading-6">
                    <code>{proposal.rollback_sql}</code>
                  </pre>
                </div>
              </div>
            )}
          </section>

          {/* ── Data diff ── */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-4">
              Data Diff — Sandbox Preview
            </h3>
            <DataDiff
              sampleBefore={proposal.sample_before}
              sampleAfter={proposal.sample_after}
              highlightedColumns={proposal.highlighted_columns}
            />
          </section>

          {/* ── Action bar (only for pending proposals) ── */}
          {isPending && (
            <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
              {showRejectInput ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Reason for rejection (required)..."
                    className="flex-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    disabled={rejectMutation.isPending}
                    autoFocus
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowRejectInput(false)}
                      disabled={isActing}
                      className="rounded-md px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                    >
                      {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirm Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-stone-600">
                    This proposal is awaiting your decision.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReject}
                      disabled={isActing}
                      className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isActing}
                      className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve Fix
                    </button>
                  </div>
                </div>
              )}

              {(approveMutation.isError || rejectMutation.isError) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {approveMutation.error?.message ||
                      rejectMutation.error?.message ||
                      "Action failed. Please try again."}
                  </span>
                </div>
              )}
            </section>
          )}
        </div>
      ) : null}
    </LayoutShell>
  );
}
