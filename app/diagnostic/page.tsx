"use client";

import { useState, useCallback } from "react";

const CHECKS = [
  {
    id: "cors", section: "connectivity", title: "CORS Handshake",
    sub: "Frontend origin allowed by backend", route: "GET /status",
    checks: [
      { label: "Response arrives (no CORS block)", key: "cors_ok" },
      { label: "No Access-Control-Allow-Origin error", key: "cors_header" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/status`);
        const latency = Date.now() - t;
        if (!r.ok) return { status: "fail", results: { cors_ok: false, cors_header: false }, latency, note: `HTTP ${r.status}` };
        return { status: "pass", results: { cors_ok: true, cors_header: true }, latency };
      } catch (e: any) {
        return { status: "fail", results: { cors_ok: false, cors_header: false }, latency: Date.now() - t, note: e.message };
      }
    },
  },
  {
    id: "api_base", section: "connectivity", title: "API Base URL Resolves",
    sub: "NEXT_PUBLIC_API_BASE_URL → backend", route: "GET /status",
    checks: [
      { label: "Returns HTTP 200", key: "http200" },
      { label: "JSON body parseable", key: "json_ok" },
      { label: "Contains a status/health field", key: "shape_ok" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/status`);
        const latency = Date.now() - t;
        if (!r.ok) return { status: "fail", results: { http200: false, json_ok: false, shape_ok: false }, latency };
        const j = await r.json();
        const shape = "pipeline_status" in j || "status" in j || "health" in j;
        return { status: shape ? "pass" : "warn", results: { http200: true, json_ok: true, shape_ok: shape }, latency };
      } catch (e: any) {
        return { status: "fail", results: { http200: false, json_ok: false, shape_ok: false }, latency: Date.now() - t, note: e.message };
      }
    },
  },
  {
    id: "dash_status", section: "dashboard", title: "Pipeline Health Card",
    sub: "/status → PipelineHealthCard", route: "GET /status",
    checks: [
      { label: "Endpoint returns 200", key: "ok" },
      { label: "Response has at least 1 field", key: "has_data" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/status`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_data = Object.keys(j).length > 0;
        return { status: r.ok && has_data ? "pass" : "warn", results: { ok: r.ok, has_data }, latency };
      } catch (e: any) { return { status: "fail", results: { ok: false, has_data: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "dash_audit", section: "dashboard", title: "Audit Log Section",
    sub: "/audit → AuditSection (polls 5s)", route: "GET /audit?limit=20",
    checks: [
      { label: "Endpoint returns 200", key: "ok" },
      { label: "Response has entries array", key: "has_entries" },
      { label: "Empty state safe (array exists even if [])", key: "empty_safe" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/audit?limit=20`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_entries = Array.isArray(j.entries) || Array.isArray(j);
        return { status: r.ok && has_entries ? "pass" : "warn", results: { ok: r.ok, has_entries, empty_safe: has_entries }, latency };
      } catch (e: any) { return { status: "fail", results: { ok: false, has_entries: false, empty_safe: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "dash_streams", section: "dashboard", title: "Streams Card",
    sub: "/streams → StreamsSection (polls 5s)", route: "GET /streams",
    checks: [
      { label: "Endpoint returns 200", key: "ok" },
      { label: "Response is non-null object", key: "has_data" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/streams`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_data = j !== null && typeof j === "object";
        return { status: r.ok ? "pass" : "warn", results: { ok: r.ok, has_data }, latency };
      } catch (e: any) { return { status: "fail", results: { ok: false, has_data: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "dash_escalations", section: "dashboard", title: "Escalations Section",
    sub: "/escalations → EscalationsSection (polls 10s)", route: "GET /escalations?limit=10",
    checks: [
      { label: "Endpoint returns 200", key: "ok" },
      { label: "Has escalations field", key: "has_field" },
      { label: "Empty state safe (no crash on [])", key: "empty_safe" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/escalations?limit=10`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_field = "escalations" in j;
        const empty_safe = has_field && Array.isArray(j.escalations);
        return { status: r.ok && has_field ? "pass" : "warn", results: { ok: r.ok, has_field, empty_safe }, latency };
      } catch (e: any) { return { status: "fail", results: { ok: false, has_field: false, empty_safe: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "conn_list", section: "connections", title: "Connections List",
    sub: "/connections → ConnectionsPage table", route: "GET /connections",
    checks: [
      { label: "Endpoint returns 200", key: "ok" },
      { label: "Shape: { count, connections[] } OR raw array", key: "shape_ok" },
      { label: "Empty state safe (0 connections)", key: "empty_safe" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/connections`);
        const latency = Date.now() - t;
        const j = await r.json();
        const shape_ok = Array.isArray(j) || ("connections" in j && Array.isArray(j.connections));
        return { status: r.ok && shape_ok ? "pass" : "warn", results: { ok: r.ok, shape_ok, empty_safe: shape_ok }, latency, note: `Found ${(Array.isArray(j) ? j : j.connections ?? []).length} connection(s)` };
      } catch (e: any) { return { status: "fail", results: { ok: false, shape_ok: false, empty_safe: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "conn_detail", section: "connections", title: "Connection Detail / Status Poll",
    sub: "/connections/{id} — status badge cycling", route: "GET /connections/{id}",
    checks: [
      { label: "At least one connection exists", key: "has_connection" },
      { label: "Detail endpoint returns 200", key: "detail_ok" },
      { label: "Has status field for badge rendering", key: "has_status" },
      { label: "Status is a valid enum value", key: "status_valid" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      const validStatuses = ["pending", "ingesting", "profiling", "ready", "failed"];
      try {
        const listJ = await fetch(`${base}/connections`).then(r => r.json());
        const connections = Array.isArray(listJ) ? listJ : (listJ.connections ?? []);
        if (!connections.length) return { status: "warn", results: { has_connection: false, detail_ok: false, has_status: false, status_valid: false }, latency: Date.now() - t, note: "No connections yet" };
        const id = connections[0].connection_id;
        const r = await fetch(`${base}/connections/${id}`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_status = "status" in j;
        const status_valid = has_status && validStatuses.includes(j.status);
        return { status: r.ok && status_valid ? "pass" : "warn", results: { has_connection: true, detail_ok: r.ok, has_status, status_valid }, latency, note: `status="${j.status}"` };
      } catch (e: any) { return { status: "fail", results: { has_connection: false, detail_ok: false, has_status: false, status_valid: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "prop_pending", section: "proposals", title: "Pending Proposals Queue",
    sub: "/proposals/pending → ProposalTable (polls 5s)", route: "GET /proposals/pending",
    checks: [
      { label: "Endpoint returns 200", key: "ok" },
      { label: "Has proposals array", key: "has_proposals" },
      { label: "Empty state safe (no crash on [])", key: "empty_safe" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/proposals/pending`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_proposals = "proposals" in j && Array.isArray(j.proposals);
        return { status: r.ok && has_proposals ? "pass" : "warn", results: { ok: r.ok, has_proposals, empty_safe: has_proposals }, latency, note: `${j.count ?? 0} pending` };
      } catch (e: any) { return { status: "fail", results: { ok: false, has_proposals: false, empty_safe: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "prop_detail", section: "proposals", title: "Proposal Detail Modal",
    sub: "/proposals/{id} — sandbox preview", route: "GET /proposals/{id}",
    checks: [
      { label: "At least one proposal exists", key: "has_proposal" },
      { label: "Detail endpoint returns 200", key: "detail_ok" },
      { label: "Has proposal_id field", key: "has_id" },
      { label: "Has status field", key: "has_status" },
      { label: "Diagnosis/sandbox data present", key: "has_diagnosis" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const listJ = await fetch(`${base}/proposals?limit=5`).then(r => r.json());
        const proposals = listJ.proposals ?? [];
        if (!proposals.length) return { status: "warn", results: { has_proposal: false, detail_ok: false, has_id: false, has_status: false, has_diagnosis: false }, latency: Date.now() - t, note: "No proposals yet — trigger webhook first" };
        const id = proposals[0].proposal_id;
        const r = await fetch(`${base}/proposals/${id}`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_id = "proposal_id" in j;
        const has_status = "status" in j;
        const has_diagnosis = j.diagnosis !== null && j.diagnosis !== undefined;
        return { status: r.ok && has_id && has_status ? (has_diagnosis ? "pass" : "warn") : "fail", results: { has_proposal: true, detail_ok: r.ok, has_id, has_status, has_diagnosis }, latency, note: `status="${j.status}"` };
      } catch (e: any) { return { status: "fail", results: { has_proposal: false, detail_ok: false, has_id: false, has_status: false, has_diagnosis: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "prop_routes", section: "proposals", title: "Approve / Reject Routes Exist",
    sub: "POST endpoints reachable before button fires", route: "OPTIONS /proposals/{id}/approve+reject",
    checks: [
      { label: "Approve endpoint reachable (not 404)", key: "approve_reachable" },
      { label: "Reject endpoint reachable (not 404)", key: "reject_reachable" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const listJ = await fetch(`${base}/proposals?limit=1`).then(r => r.json());
        const proposals = listJ.proposals ?? [];
        if (!proposals.length) return { status: "warn", results: { approve_reachable: false, reject_reachable: false }, latency: Date.now() - t, note: "No proposals to test against" };
        const id = proposals[0].proposal_id;
        const [aR, rR] = await Promise.all([
          fetch(`${base}/proposals/${id}/approve`, { method: "OPTIONS" }),
          fetch(`${base}/proposals/${id}/reject`, { method: "OPTIONS" }),
        ]);
        const latency = Date.now() - t;
        return { status: aR.status !== 404 && rR.status !== 404 ? "pass" : "fail", results: { approve_reachable: aR.status !== 404, reject_reachable: rR.status !== 404 }, latency };
      } catch (e: any) { return { status: "fail", results: { approve_reachable: false, reject_reachable: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "prof_list", section: "profiling", title: "Profiling Reports List",
    sub: "/profiles → ProfilingPage (polls 10s)", route: "GET /profiles?limit=20",
    checks: [
      { label: "Endpoint returns 200", key: "ok" },
      { label: "Has reports array or raw array", key: "has_reports" },
      { label: "Empty state safe", key: "empty_safe" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      try {
        const r = await fetch(`${base}/profiles?limit=20`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_reports = "reports" in j || Array.isArray(j);
        const reports = j.reports ?? (Array.isArray(j) ? j : []);
        return { status: r.ok && has_reports ? "pass" : "warn", results: { ok: r.ok, has_reports, empty_safe: has_reports }, latency, note: `${reports.length} report(s)` };
      } catch (e: any) { return { status: "fail", results: { ok: false, has_reports: false, empty_safe: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
  {
    id: "prof_detail", section: "profiling", title: "Profile Detail + Anomaly Severity",
    sub: "/profile/{id} — severity badge enum check", route: "GET /profile/{id}",
    checks: [
      { label: "At least one report exists", key: "has_report" },
      { label: "Detail endpoint returns 200", key: "detail_ok" },
      { label: "Has anomalies array", key: "has_anomalies" },
      { label: "All severity values are valid enum", key: "severity_valid" },
    ],
    test: async (base: string) => {
      const t = Date.now();
      const validSeverities = ["info", "warning", "critical"];
      try {
        const listJ = await fetch(`${base}/profiles?limit=1`).then(r => r.json());
        const reports = listJ.reports ?? (Array.isArray(listJ) ? listJ : []);
        if (!reports.length) return { status: "warn", results: { has_report: false, detail_ok: false, has_anomalies: false, severity_valid: false }, latency: Date.now() - t, note: "No profiles yet" };
        const id = reports[0].report_id;
        const r = await fetch(`${base}/profile/${id}`);
        const latency = Date.now() - t;
        const j = await r.json();
        const has_anomalies = "tables" in j && Array.isArray(j.tables) && j.tables.every((t: any) => "anomalies" in t && Array.isArray(t.anomalies));
        const all_anomalies = has_anomalies ? j.tables.flatMap((t: any) => t.anomalies) : [];
        const severity_valid = !has_anomalies || all_anomalies.length === 0 || all_anomalies.every((a: any) => validSeverities.includes(a.severity));
        return { status: r.ok && has_anomalies ? "pass" : "warn", results: { has_report: true, detail_ok: r.ok, has_anomalies, severity_valid }, latency };
      } catch (e: any) { return { status: "fail", results: { has_report: false, detail_ok: false, has_anomalies: false, severity_valid: false }, latency: Date.now() - t, note: e.message }; }
    },
  },
];

type CheckStatus = "idle" | "running" | "pass" | "fail" | "warn";
type CheckState = { status: CheckStatus; results: Record<string, boolean>; latency: number | null; note: string | null };

const SECTIONS = [
  { id: "connectivity", label: "01 — Core Connectivity" },
  { id: "dashboard",    label: "02 — Dashboard Page" },
  { id: "connections",  label: "03 — Connections Page" },
  { id: "proposals",   label: "04 — Proposals Page" },
  { id: "profiling",   label: "05 — Profiling Page" },
];

const STATUS_COLORS: Record<CheckStatus, string> = {
  idle:    "bg-stone-100 text-stone-400 border-stone-200",
  running: "bg-blue-50 text-blue-600 border-blue-200",
  pass:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  fail:    "bg-red-50 text-red-700 border-red-200",
  warn:    "bg-amber-50 text-amber-700 border-amber-200",
};
const STATUS_LABEL: Record<CheckStatus, string> = {
  idle: "WAITING", running: "RUNNING", pass: "✓ PASS", fail: "✗ FAIL", warn: "⚠ WARN",
};
const CARD_BORDER: Record<CheckStatus, string> = {
  idle: "border-stone-200", running: "border-blue-300", pass: "border-emerald-300", fail: "border-red-300", warn: "border-amber-300",
};

function CheckIcon({ val, running }: { val: boolean | undefined; running: boolean }) {
  if (running) return <span className="text-blue-400 font-mono text-xs">◌</span>;
  if (val === true) return <span className="text-emerald-500 font-mono text-xs">✓</span>;
  if (val === false) return <span className="text-red-500 font-mono text-xs">✗</span>;
  return <span className="text-stone-300 font-mono text-xs">·</span>;
}

export default function DiagnosticPage() {
  const [apiBase, setApiBase] = useState(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1");
  const [states, setStates] = useState<Record<string, CheckState>>(() =>
    Object.fromEntries(CHECKS.map(c => [c.id, { status: "idle", results: {}, latency: null, note: null }]))
  );
  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = useCallback((msg: string, type = "info") => {
    const time = new Date().toLocaleTimeString("en", { hour12: false });
    setLogs(prev => [...prev.slice(-80), { time, msg, type }]);
  }, []);

  const runAll = async () => {
    setRunning(true);
    setLogs([]);
    const initial = Object.fromEntries(CHECKS.map(c => [c.id, { status: "running" as CheckStatus, results: {}, latency: null, note: null }]));
    setStates(initial);
    addLog(`Starting diagnostic → ${apiBase}`, "info");

    for (const check of CHECKS) {
      addLog(`→ ${check.title}`, "info");
      let result: any;
      try {
        result = await check.test(apiBase);
      } catch (e: any) {
        result = { status: "fail", results: {}, latency: null, note: e.message };
      }
      setStates(prev => ({ ...prev, [check.id]: result }));
      const icon = result.status === "pass" ? "✓" : result.status === "warn" ? "⚠" : "✗";
      const t = result.status === "pass" ? "ok" : result.status === "warn" ? "wrn" : "err";
      addLog(`  ${icon} ${check.title}${result.latency ? ` — ${result.latency}ms` : ""}${result.note ? " · " + result.note : ""}`, t);
      await new Promise(r => setTimeout(r, 60));
    }

    addLog("Diagnostic complete.", "info");
    setRunning(false);
  };

  const reset = () => {
    setStates(Object.fromEntries(CHECKS.map(c => [c.id, { status: "idle", results: {}, latency: null, note: null }])));
    setLogs([]);
  };

  const allStatuses = CHECKS.map(c => states[c.id].status);
  const pass = allStatuses.filter(s => s === "pass").length;
  const fail = allStatuses.filter(s => s === "fail").length;
  const warn = allStatuses.filter(s => s === "warn").length;
  const idle = allStatuses.every(s => s === "idle");

  const logColor: Record<string, string> = { info: "text-stone-400", ok: "text-emerald-500", err: "text-red-500", wrn: "text-amber-500" };

  return (
    <div className="min-h-screen bg-[#fdf6ec] p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight">AxiomDB · Frontend Diagnostic</h1>
          <p className="mt-1 text-sm text-stone-500">Checks every page, UI state, and API contract from the frontend.</p>
        </div>
        <span className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-mono text-xs text-stone-400">
          localhost:3000 → localhost:8001
        </span>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 flex-1 min-w-[260px] max-w-sm">
          <span className="font-mono text-xs text-stone-400 whitespace-nowrap">API</span>
          <input
            className="flex-1 bg-transparent font-mono text-xs text-stone-700 outline-none"
            value={apiBase}
            onChange={e => setApiBase(e.target.value)}
          />
        </div>
        <button
          disabled={running}
          onClick={runAll}
          className="rounded-xl bg-stone-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-stone-700 transition-colors"
        >
          {running ? "◌ Running..." : "▶ Run All Checks"}
        </button>
        <button
          onClick={reset}
          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-500 hover:bg-stone-50 transition-colors"
        >
          ↺ Reset
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 flex flex-wrap gap-2">
        {idle ? (
          <span className="rounded-full border border-stone-200 bg-white px-4 py-1.5 font-mono text-xs text-stone-400">Waiting to run</span>
        ) : (
          <>
            {pass > 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 font-mono text-xs text-emerald-700">{pass} passed</span>}
            {warn > 0 && <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 font-mono text-xs text-amber-700">{warn} warnings</span>}
            {fail > 0 && <span className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 font-mono text-xs text-red-700">{fail} failed</span>}
          </>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.id} className="mb-8">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">{section.label}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CHECKS.filter(c => c.section === section.id).map(check => {
              const s = states[check.id];
              const isRunning = s.status === "running";
              return (
                <div key={check.id} className={`rounded-xl border bg-white shadow-sm transition-colors ${CARD_BORDER[s.status]}`}>
                  <div className="flex items-start justify-between p-4 pb-3 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{check.title}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-stone-400">{check.sub}</p>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <div className="px-4 pb-4">
                    <ul className="space-y-1.5">
                      {check.checks.map(ci => (
                        <li key={ci.key} className="flex items-start gap-2 text-xs text-stone-500">
                          <CheckIcon val={s.results[ci.key]} running={isRunning} />
                          <span>{ci.label}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 rounded-lg bg-stone-50 border border-stone-100 px-3 py-2 font-mono text-[10px] text-stone-400">
                      <span className="text-blue-500">{check.route}</span>
                    </div>
                    {s.latency !== null && (
                      <p className="mt-2 font-mono text-[10px] text-stone-400">
                        {s.latency}ms{s.note ? <span> · {s.note}</span> : null}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Log */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
          <span className={`h-2 w-2 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-stone-300"}`} />
          <span className="font-mono text-[11px] text-stone-400">Diagnostic Log</span>
        </div>
        <div className="max-h-48 overflow-y-auto p-4 space-y-0.5">
          {logs.length === 0 ? (
            <p className="font-mono text-[11px] text-stone-300">// Press Run All Checks to begin...</p>
          ) : logs.map((l, i) => (
            <div key={i} className="flex gap-3 font-mono text-[11px]">
              <span className="text-stone-300 shrink-0">{l.time}</span>
              <span className={logColor[l.type] ?? "text-stone-400"}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}