import { api } from "./client";
import type { ProposalDetail, ProposalSummary } from "../types";

export async function listProposals(status?: string) {
  const query = status ? `?status=${status}` : "";
  return api.get<{ count: number; proposals: ProposalSummary[] }>(
    `/proposals${query}`
  );
}

export async function listPendingProposals() {
  return api.get<{ count: number; proposals: ProposalSummary[] }>(
    "/proposals/pending"
  );
}

export async function getProposal(proposalId: string) {
  return api.get<ProposalDetail>(`/proposals/${proposalId}`);
}

export async function approveProposal(
  proposalId: string,
  decidedBy: string = "user"
) {
  return api.post<{
    proposal_id: string;
    status: string;
    message: string;
    repair_msg_id: string;
    dry_run: boolean;
  }>(`/proposals/${proposalId}/approve`, { decided_by: decidedBy });
}

export async function rejectProposal(
  proposalId: string,
  reason: string,
  decidedBy: string = "user"
) {
  return api.post<{
    proposal_id: string;
    status: string;
    reason: string;
    message: string;
  }>(`/proposals/${proposalId}/reject`, { reason, decided_by: decidedBy });
}