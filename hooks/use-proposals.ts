"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiomApi } from "../lib/api";
import type { ApproveProposalRequest, RejectProposalRequest } from "../lib/types";

const PROPOSALS_POLL_MS = 5000;

export function usePendingProposals() {
  return useQuery({
    queryKey: ["proposals", "pending"],
    queryFn: () => axiomApi.getPendingProposals(),
    refetchInterval: PROPOSALS_POLL_MS,
  });
}

export function useProposals(status?: import("../lib/types").ProposalStatus, limit = 50) {
  return useQuery({
    queryKey: ["proposals", "all", status, limit],
    queryFn: () => axiomApi.getProposals(status, limit),
    refetchInterval: PROPOSALS_POLL_MS,
  });
}

export function useProposal(id: string | null) {
  return useQuery({
    queryKey: ["proposals", id],
    queryFn: () => (id ? axiomApi.getProposal(id) : Promise.reject("No ID")),
    enabled: !!id,
  });
}

export function useApproveProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ApproveProposalRequest }) =>
      axiomApi.approveProposal(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      queryClient.invalidateQueries({ queryKey: ["escalations"] });
    },
  });
}

export function useRejectProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectProposalRequest }) =>
      axiomApi.rejectProposal(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["escalations"] });
    },
  });
}

export function useReSandboxProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => axiomApi.reSandboxProposal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proposals", id] });
    },
  });
}
