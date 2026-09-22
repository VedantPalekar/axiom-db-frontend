"use client";

import { useState } from "react";
import {
  useProposal,
  useApproveProposal,
  useRejectProposal,
  useReSandboxProposal,
} from "../../hooks/use-proposals";
import { Check, X, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { LoadingSkeleton } from "../shared/loading-skeleton";
import { EmptyState } from "../shared/empty-state";
import { DataDiff } from "./data-diff";

interface ProposalDetailModalProps {
  proposalId: string;
  onClose: () => void;
}

export function ProposalDetailModal({
  proposalId,
  onClose,
}: ProposalDetailModalProps) {
  const { data: proposal, isLoading, isError, error } = useProposal(proposalId);
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();
  const reSandboxMutation = useReSandboxProposal();

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = () => {
    approveMutation.mutate(
      { id: proposalId, body: { decided_by: "human_user" } },
      { onSuccess: () => onClose() }
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
      { onSuccess: () => onClose() }
    );
  };

  /** Returns the correct footer content based on the proposal's current status. */
  const renderFooter = () => {
    if (!proposal) return null;

    // ── executing ──────────────────────────────────────────────────────────
    if (proposal.status === "executing") {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Fix is being applied&hellip;
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              The repair SQL is currently executing on the database. This may
              take a few moments.
            </p>
          </div>
        </div>
      );
    }

    // ── completed 
    if (proposal.status === "completed") {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Fix applied successfully
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              The repair has been executed and the data has been corrected.
            </p>
          </div>
        </div>
      );
    }

    // ── failed 
    if (proposal.status === "failed") {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">
              Execution failed
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              The fix could not be applied. Check the audit log for details.
            </p>
          </div>
        </div>
      );
    }

    // ── approved ───────────────────────────────────────────────────────────
    if (proposal.status === "approved") {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-100 px-4 py-3">
          <Check className="h-5 w-5 text-stone-500 shrink-0" />
          <p className="text-sm text-stone-700 font-medium">
            Approved
            {proposal.decision_by ? ` by ${proposal.decision_by}` : ""}
            {proposal.decided_at
              ? ` \u00b7 ${new Date(proposal.decided_at).toLocaleString()}`
              : ""}
          </p>
        </div>
      );
    }

    // ── rejected ───────────────────────────────────────────────────────────
    if (proposal.status === "rejected") {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <X className="h-5 w-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">
              Rejected
              {proposal.decision_by ? ` by ${proposal.decision_by}` : ""}
              {proposal.decided_at
                ? ` \u00b7 ${new Date(proposal.decided_at).toLocaleString()}`
                : ""}
            </p>
            {proposal.rejection_reason && (
              <p className="text-xs text-rose-600 mt-0.5">
                Reason: {proposal.rejection_reason}
              </p>
            )}
          </div>
        </div>
      );
    }

    // ── pending_approval (default) — interactive actions ───────────────────
    return (
      <>
        {showRejectInput ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Reason for rejection..."
              className="flex-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={rejectMutation.isPending}
              autoFocus
            />
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => setShowRejectInput(false)}
                className="flex-1 sm:flex-none justify-center rounded-md px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-200 transition-colors"
                disabled={rejectMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 sm:flex-none justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2 w-max"
              >
                {rejectMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleReject}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve Fix
            </button>
          </div>
        )}

        {(approveMutation.isError || rejectMutation.isError) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4" />
            <span>
              {approveMutation.error?.message ||
                rejectMutation.error?.message ||
                "An action failed."}
            </span>
          </div>
        )}
      </>
    );
  };

  // ── status badge colour map ────────────────────────────────────────────────
  const statusBadgeClass =
    proposal?.status === "executing"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : proposal?.status === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : proposal?.status === "failed"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : proposal?.status === "approved"
      ? "bg-stone-100 text-stone-600 ring-stone-200"
      : proposal?.status === "rejected"
      ? "bg-rose-50 text-rose-600 ring-rose-200"
      : "bg-amber-50 text-amber-700 ring-amber-200"; // pending_approval

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-stone-900">
              Review Proposal
            </h2>
            {/* Live status badge */}
            {proposal && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass}`}
              >
                {proposal.status === "executing" && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {proposal.status.replace("_", " ")}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-6">
              <LoadingSkeleton className="h-24 w-full" />
              <LoadingSkeleton className="h-48 w-full" />
              <LoadingSkeleton className="h-32 w-full" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Error loading proposal"
              description={
                error instanceof Error ? error.message : "Failed to load details"
              }
            />
          ) : proposal ? (
            <div className="space-y-8">
              {/* Header Info */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Target
                  </h3>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {proposal.table_fqn}
                  </p>
                  <div className="mt-2 flex flex-col gap-1 items-start">
                    {proposal.anomaly_type_label && (
                      <span className="inline-block font-medium text-stone-900 text-sm">
                        {proposal.anomaly_type_label}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {proposal.failure_categories.map((cat, i) => (
                        <span
                          key={i}
                          className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Root Cause
                  </h3>
                  <p className="mt-1 text-sm text-stone-700">
                    {proposal.root_cause}
                  </p>
                </div>
              </div>

              {/* Fix Description & SQL */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Proposed Fix
                  </h3>
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
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-700 mb-4 pb-4 border-b border-stone-200">
                    {proposal.fix_description}
                  </p>
                  <pre className="overflow-x-auto text-sm text-stone-800">
                    <code>{proposal.fix_sql_display || proposal.fix_sql}</code>
                  </pre>
                </div>
              </div>

              {/* Sandbox Results */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Sandbox Validation
                  </h3>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                      proposal.sandbox_passed
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100/50"
                        : "bg-rose-50 text-rose-700 ring-rose-100/50"
                    }`}
                  >
                    {proposal.sandbox_passed ? "Passed" : "Failed"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-stone-200 p-4 text-center">
                    <p className="text-xs text-stone-500 mb-1">Rows Affected</p>
                    <p className="text-2xl font-semibold text-stone-900">
                      {proposal.rows_affected}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 p-4 text-center">
                    <p className="text-xs text-stone-500 mb-1">
                      Estimated Change
                    </p>
                    <p className="text-2xl font-semibold text-stone-900">
                      {proposal.estimated_rows ?? "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 p-4 text-center">
                    <p className="text-xs text-stone-500 mb-1">Final Count</p>
                    <p className="text-2xl font-semibold text-stone-900">
                      {proposal.rows_after}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Diff */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Data Diff
                  </h3>
                  {proposal.status === "pending_approval" && (
                    <button
                      onClick={() => reSandboxMutation.mutate(proposalId)}
                      disabled={reSandboxMutation.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 disabled:opacity-50 transition-colors"
                      title="Re-run sandbox to get fresh preview data"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${reSandboxMutation.isPending ? "animate-spin" : ""}`} />
                      {reSandboxMutation.isPending ? "Refreshing..." : "Refresh Preview"}
                    </button>
                  )}
                </div>
                <DataDiff
                  sampleBefore={proposal.sample_before}
                  sampleAfter={proposal.sample_after}
                  highlightedColumns={proposal.highlighted_columns}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Status-aware Footer ── */}
        <div className="border-t border-stone-200 bg-stone-50 px-6 py-4">
          {renderFooter()}
        </div>
      </div>
    </div>
  );
}
