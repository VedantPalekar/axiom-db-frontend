import type {
  ApproveProposalRequest,
  ApproveProposalResponse,
  AuditEntry,
  AuditResponse,
  ConnectRequest,
  ConnectResponse,
  ConnectionSummary,
  ConnectionsResponse,
  EscalationsResponse,
  FixReport,
  ProfileRequest,
  ProfileResponse,
  ProfilesResponse,
  ProfilingReportDetail,
  ProposalDetail,
  ProposalListResponse,
  ProposalStatus,
  RejectProposalRequest,
  RejectProposalResponse,
  ReportStats,
  ReportsResponse,
  StreamStats,
  SystemStatus,
  ConnectionHealthResponse,
  LiveTableResponse,
  ReProfileResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function request<T>(
  path: string,
  init?: RequestInit,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const fallback = response.statusText || "Request failed";
    const payload = await response
      .json()
      .catch(() => ({ detail: fallback, message: fallback }));

    throw new ApiError(
      response.status,
      payload.detail ?? payload.message ?? fallback,
    );
  }

  return (await response.json()) as T;
}

export const axiomApi = {
  getStatus: () => request<SystemStatus>("/status"),

  getAudit: (limit = 20) =>
    request<AuditResponse>("/audit", undefined, { limit }),

  getAuditEntry: (eventId: string) =>
    request<AuditEntry>(`/audit/${encodeURIComponent(eventId)}`),

  getStreams: () => request<StreamStats>("/streams"),

  getEscalations: (limit = 10) =>
    request<EscalationsResponse>("/escalations", undefined, { limit }),

  getPendingProposals: () => request<ProposalListResponse>("/proposals/pending"),

  getProposals: (status?: ProposalStatus, limit = 20) =>
    request<ProposalListResponse>("/proposals", undefined, { status, limit }),

  getProposal: (proposalId: string) =>
    request<ProposalDetail>(`/proposals/${proposalId}`),

  approveProposal: (proposalId: string, body: ApproveProposalRequest) =>
    request<ApproveProposalResponse>(`/proposals/${proposalId}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  rejectProposal: (proposalId: string, body: RejectProposalRequest) =>
    request<RejectProposalResponse>(`/proposals/${proposalId}/reject`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // ── Reports (auto-documentation) 
  getReports: (limit = 50, tableName?: string) =>
    request<ReportsResponse>("/reports", undefined, {
      limit,
      table_name: tableName,
    }),

  getReportStats: () => request<ReportStats>("/reports/stats"),

  getReport: (reportId: string) =>
    request<FixReport>(`/reports/${encodeURIComponent(reportId)}`),

  reSandboxProposal: (proposalId: string) =>
    request<{
      proposal_id: string;
      sandbox_passed: boolean;
      rows_before: number;
      rows_after: number;
      rows_affected: number;
      sample_before: Record<string, unknown>[];
      sample_after: Record<string, unknown>[];
      message: string;
    }>(`/proposals/${proposalId}/re-sandbox`, {
      method: "POST",
    }),

  createProfile: (body: ProfileRequest) =>
    request<ProfileResponse>("/profile", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getProfiles: (limit = 20) =>
    request<ProfilesResponse>("/profiles", undefined, { limit }),

  getProfile: (reportId: string) =>
    request<ProfilingReportDetail>(`/profile/${reportId}`),

  createConnection: (body: ConnectRequest) =>
    request<ConnectResponse>("/connect", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getConnections: async () => {
    const response = await request<ConnectionsResponse | ConnectionSummary[]>(
      "/connections",
    );

    if (Array.isArray(response)) {
      return {
        count: response.length,
        connections: response,
      } satisfies ConnectionsResponse;
    }

    return response;
  },

  getConnection: (connectionId: string) =>
    request<ConnectionSummary>(`/connections/${connectionId}`),

  getConnectionHealth: (connectionId: string) =>
    request<ConnectionHealthResponse>(`/connections/${connectionId}/health`),

  getLiveTable: (
    connectionId: string,
    tableName: string,
    schema = "public",
    limit = 100,
  ) =>
    request<LiveTableResponse>("/tables/live", undefined, {
      connection_id: connectionId,
      table_name: tableName,
      schema,
      limit,
    }),

  reProfileConnection: (connectionId: string, body: ConnectRequest) =>
    request<ReProfileResponse>(`/connections/${connectionId}/re-profile`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  toggleDryRun: () =>
    request<{ dry_run: boolean; message: string }>("/dry-run/toggle", {
      method: "POST",
    }),
};
