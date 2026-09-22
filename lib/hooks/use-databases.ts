"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listConnections, connectDatabase, getConnection } from "../api/databases";
import type { ConnectRequest } from "../types";

export function useDatabases() {
  return useQuery({
    queryKey: ["databases"],
    queryFn: listConnections,
    refetchInterval: 10000,
  });
}

export function useDatabase(connectionId: string) {
  return useQuery({
    queryKey: ["databases", connectionId],
    queryFn: () => getConnection(connectionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "ready" || status === "failed") return false;
      return 3000; // poll every 3s while onboarding
    },
  });
}

export function useConnectDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConnectRequest) => connectDatabase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
  });
}