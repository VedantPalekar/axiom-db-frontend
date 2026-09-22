import { api } from "./client";
import type {
  ConnectRequest,
  ConnectResponse,
  ConnectionSummary,
} from "../types";

export async function connectDatabase(data: ConnectRequest) {
  return api.post<ConnectResponse>("/connect", data);
}

export async function getConnection(connectionId: string) {
  return api.get<ConnectionSummary>(`/connections/${connectionId}`);
}

export async function listConnections() {
  return api.get<{ count: number; connections: ConnectionSummary[] }>(
    "/connections"
  );
}