"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiomApi } from "../lib/api";
import type { ConnectRequest } from "../lib/types";

const CONNECTIONS_POLL_MS = 5000;

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: () => axiomApi.getConnections(),
    refetchInterval: CONNECTIONS_POLL_MS,
  });
}

export function useConnection(connectionId: string | null, customPollInterval?: number) {
  return useQuery({
    queryKey: ["connections", connectionId],
    queryFn: () => (connectionId ? axiomApi.getConnection(connectionId) : Promise.reject("No ID")),
    enabled: !!connectionId,
    refetchInterval: customPollInterval ?? CONNECTIONS_POLL_MS,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ConnectRequest) => axiomApi.createConnection(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

export function useConnectionHealth(connectionId: string | null) {
  return useQuery({
    queryKey: ["connection-health", connectionId],
    queryFn: () =>
      connectionId
        ? axiomApi.getConnectionHealth(connectionId)
        : Promise.reject("No ID"),
    enabled: !!connectionId,
    refetchInterval: 30000,
  });
}

export function useLiveTable(
  connectionId: string | null,
  tableName: string | null,
  schema = "public",
) {
  return useQuery({
    queryKey: ["live-table", connectionId, tableName, schema],
    queryFn: () =>
      connectionId && tableName
        ? axiomApi.getLiveTable(connectionId, tableName, schema)
        : Promise.reject("Missing required params"),
    enabled: !!connectionId && !!tableName,
    refetchInterval: 30000,
  });
}

export function useReProfileConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ConnectRequest }) =>
      axiomApi.reProfileConnection(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["connections", variables.id] });
    },
  });
}
