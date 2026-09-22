import { api } from "./client";
import type {
  AuditEntry,
  StreamStats,
  SystemStatus,
  Escalation,
} from "../types";

export async function getAuditLog(limit: number = 50) {
  return api.get<{ count: number; entries: AuditEntry[] }>(
    `/audit?limit=${limit}`
  );
}

export async function getStreams() {
  return api.get<StreamStats>("/streams");
}

export async function getStatus() {
  return api.get<SystemStatus>("/status");
}

export async function getEscalations(limit: number = 20) {
  return api.get<{ count: number; escalations: Escalation[] }>(
    `/escalations?limit=${limit}`
  );
}

export async function toggleDryRun() {
  return api.post<{ dry_run: boolean; message: string }>("/dry-run/toggle");
}