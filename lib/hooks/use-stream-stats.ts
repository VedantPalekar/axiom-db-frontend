"use client";

import { useQuery } from "@tanstack/react-query";
import { getStreams, getStatus, getAuditLog } from "../api/audit";

export function useStreamStats() {
  return useQuery({
    queryKey: ["streams"],
    queryFn: getStreams,
    refetchInterval: 5000,
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: getStatus,
    refetchInterval: 10000,
  });
}

export function useAuditLog(limit: number = 50) {
  return useQuery({
    queryKey: ["audit", limit],
    queryFn: () => getAuditLog(limit),
  });
}