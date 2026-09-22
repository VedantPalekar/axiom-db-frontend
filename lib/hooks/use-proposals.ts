"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPendingProposals,
  listProposals,
  getProposal,
  approveProposal,
  rejectProposal,
} from "../api/proposals";

export function usePendingProposals() {
  return useQuery({
    queryKey: ["proposals", "pending"],
    queryFn: listPendingProposals,
    refetchInterval: 5000,
  });
}

export function useProposals(status?: string) {
  return useQuery({
    queryKey: ["proposals", status],
    queryFn: () => listProposals(status),
  });
}

export function useProposal(proposalId: string) {
  return useQuery({
    queryKey: ["proposals", proposalId],
    queryFn: () => getProposal(proposalId),
  });
}

export function useApproveProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, decidedBy }: { proposalId: string; decidedBy?: string }) =>
      approveProposal(proposalId, decidedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useRejectProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      reason,
      decidedBy,
    }: {
      proposalId: string;
      reason: string;
      decidedBy?: string;
    }) => rejectProposal(proposalId, reason, decidedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}