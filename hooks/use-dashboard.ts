"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiomApi } from "../lib/api";

const AUDIT_STREAMS_POLL_MS = 5000;
const STATUS_ESCALATIONS_POLL_MS = 10000;

export function useSystemStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: axiomApi.getStatus,
    refetchInterval: STATUS_ESCALATIONS_POLL_MS,
  });
}

export function useToggleDryRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: axiomApi.toggleDryRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

export function useAudit(limit = 8) {
  return useQuery({
    queryKey: ["audit", limit],
    queryFn: () => axiomApi.getAudit(limit),
    refetchInterval: AUDIT_STREAMS_POLL_MS,
  });
}

export function useAuditEntry(eventId: string | null) {
  return useQuery({
    queryKey: ["audit", "entry", eventId],
    queryFn: () => (eventId ? axiomApi.getAuditEntry(eventId) : Promise.reject("No event ID")),
    enabled: !!eventId,
    refetchInterval: AUDIT_STREAMS_POLL_MS,
  });
}

export function useStreams() {
  return useQuery({
    queryKey: ["streams"],
    queryFn: axiomApi.getStreams,
    refetchInterval: AUDIT_STREAMS_POLL_MS,
  });
}

export function useEscalations(limit = 6) {
  return useQuery({
    queryKey: ["escalations", limit],
    queryFn: () => axiomApi.getEscalations(limit),
    refetchInterval: STATUS_ESCALATIONS_POLL_MS,
  });
}
