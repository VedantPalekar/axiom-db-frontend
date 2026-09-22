export type PipelineStageStatus = "ok" | "error" | "degraded" | string;

export interface SystemStatus {
  version: string;
  dry_run: boolean;
  confidence_threshold: number;
  pipeline: Record<string, PipelineStageStatus>;
}

export interface AuditEntry {
  id: number;
  event_id: string;
  table_fqn: string;
  table_name: string;
  action: "applied" | "dry_run" | "failed" | "rolled_back" | "skipped";
  rows_affected: number;
  dry_run: boolean;
  sandbox_passed: boolean;
  confidence: number;
  failure_categories: string[];
  applied_at: string;
  error: string | null;
  fix_sql: string | null;
  rollback_sql: string | null;
  post_apply_assertions: AuditAssertion[];
}

export interface AuditResponse {
  count: number;
  entries: AuditEntry[];
}

export interface AuditAssertion {
  test_name: string;
  column: string | null;
  passed: boolean;
  actual_value: string;
}

export interface StreamInfo {
  length: number;
  last_message_id: string | null;
}

export interface StreamStats {
  streams: Record<string, StreamInfo>;
}

export interface Escalation {
  message_id: string;
  event_id: string;
  table_fqn: string;
  reason: string;
  stage: "apply" | "approval" | "diagnosis" | string;
  escalated_at: string | null;
}

export interface EscalationsResponse {
  count: number;
  escalations: Escalation[];
}

export type ProposalStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "executing"
  | "completed"
  | "failed";

export interface ProposalSummary {
  proposal_id: string;
  event_id: string;
  table_fqn: string;
  table_name: string;
  failure_categories: string[];
  root_cause: string;
  confidence: number;
  fix_sql: string;
  fix_description: string;
  sandbox_passed: boolean;
  rows_affected: number;
  status: ProposalStatus;
  created_at: string;
  decided_at: string | null;
  rejection_reason: string | null;
  fix_type?: "DELETE" | "UPDATE" | "INSERT" | "OTHER";
  highlighted_columns?: string[];
  anomaly_type_label?: string;
  fix_sql_display?: string;
}

export interface ProposalListResponse {
  count: number;
  proposals: ProposalSummary[];
}

export interface ProposalDetail extends ProposalSummary {
  rollback_sql: string | null;
  estimated_rows: number | null;
  rows_before: number;
  rows_after: number;
  sample_before: Record<string, unknown>[];
  sample_after: Record<string, unknown>[];
  decision_by: string;
  diagnosis_json: string;
  event_json: string;
}

export interface ApproveProposalRequest {
  decided_by: string;
}

export interface ApproveProposalResponse {
  proposal_id: string;
  status: ProposalStatus;
  message: string;
  repair_msg_id: string;
  dry_run: boolean;
}

export interface RejectProposalRequest {
  reason: string;
  decided_by: string;
}

export interface RejectProposalResponse {
  proposal_id: string;
  status: ProposalStatus;
  reason: string;
  message: string;
}

export interface ProfileRequest {
  connection_url: string;
  schemas?: string[];
  table_limit?: number;
}

export interface ProfileResponse {
  report_id: string;
  connection_hint: string;
  status: "completed" | "failed" | "partial" | string;
  tables_scanned: number;
  total_anomalies: number;
  critical_count: number;
  warning_count: number;
  duration_ms: number;
  message: string;
}

export interface ProfilingReportSummary {
  report_id: string;
  connection_hint: string;
  status: "completed" | "failed" | "partial" | string;
  tables_scanned: number;
  total_anomalies: number;
  critical_count: number;
  warning_count: number;
  duration_ms: number;
  created_at: string;
}

export interface ProfilesResponse {
  count: number;
  reports: ProfilingReportSummary[];
}

export interface ProfilingAnomaly {
  column_name: string;
  anomaly_type: string;
  severity: "info" | "warning" | "critical";
  affected_rows: number;
  total_rows: number;
  rate: number;
  description: string;
  sample_values: string[];
}

export interface ProfilingTable {
  table_name: string;
  schema_name: string;
  total_rows?: number;
  total_columns?: number;
  anomalies: ProfilingAnomaly[];
  profiled_at?: string;
  profiling_duration_ms?: number;
}

export interface ProfilingReportDetail {
  report_id: string;
  connection_hint: string;
  status: "completed" | "failed" | "partial" | string;
  tables_scanned: number;
  total_anomalies: number;
  critical_count: number;
  warning_count: number;
  duration_ms: number;
  created_at?: string;
  error?: string | null;
  tables: ProfilingTable[];
}

export interface ConnectRequest {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schemas: string[];
  service_name?: string;
}

export type ConnectionStatus =
  | "pending"
  | "connected"
  | "ingesting"
  | "profiling"
  | "ready"
  | "failed";

export interface ConnectionSummary {
  connection_id: string;
  service_name: string;
  connection_hint: string;
  db_name: string;
  schema_names: string[];
  status: ConnectionStatus;
  om_service_fqn: string | null;
  profiling_report_id: string | null;
  tables_found: number | null;
  total_anomalies: number | null;
  critical_count: number | null;
  error: string | null;
  registered_at: string;
  last_profiled_at: string | null;
}

export interface ConnectionsResponse {
  count: number;
  connections: ConnectionSummary[];
}

export interface ConnectResponse {
  connection_id: string;
  service_name: string;
  connection_hint: string;
  status: ConnectionStatus;
  tables_found: number | null;
  total_anomalies: number | null;
  critical_count: number | null;
  profiling_report_id: string | null;
  message: string;
}

export interface ReProfileResponse {
  connection_id: string;
  status: ConnectionStatus;
  message: string;
}

export interface ConnectionHealthTable {
  table_name: string;
  schema: string;
  anomaly_count: number;
  status: "clean" | "dirty" | string;
}

export interface ConnectionHealthResponse {
  connection_id: string;
  health_score: number;
  status: "clean" | "partial" | "dirty" | string;
  total_anomalies: number;
  critical_count: number;
  warning_count: number;
  tables_found: number;
  tables: ConnectionHealthTable[];
  last_profiled_at: string | null;
  db_name: string;
  connection_hint: string;
}

export interface LiveTableColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface LiveTableResponse {
  table_name: string;
  schema: string;
  columns: LiveTableColumn[];
  rows: Record<string, unknown>[];
  total_rows: number;
  returned_rows: number;
  anomaly_columns: string[];
  last_profiled_at: string | null;
}

// ── Auto-Documentation — Fix Reports 

export type FixType = "update" | "delete" | "insert" | "other";
export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export interface FixReport {
  report_id: string;
  event_id: string;
  table_fqn: string;
  table_name: string;
  column_name: string;
  anomaly_type: string;
  anomaly_severity: AnomalySeverity;
  fix_type: FixType;
  fix_sql: string;
  rows_affected: number;
  confidence: number;
  sandbox_passed: boolean;
  post_apply_passed: boolean;
  assertions_passed: number;
  assertions_total: number;
  recurrence_count: number;
  downstream_tables: string[];
  approver: string;
  created_at: string;
}

export interface ReportsResponse {
  count: number;
  reports: FixReport[];
}

export interface ReportStats {
  total_incidents: number;
  total_rows_healed: number;
  avg_confidence: number;
  tables_touched: number;
  recurrence_rate: number;
}