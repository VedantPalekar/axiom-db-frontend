"use client";

import { LayoutDashboard, History } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Slack logo ───────────────────────────────────────────────────────────────

function SlackLogo({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.712 33.994a5.143 5.143 0 0 1-5.143 5.143 5.143 5.143 0 0 1-5.143-5.143 5.143 5.143 0 0 1 5.143-5.143h5.143v5.143z" fill="#E01E5A"/>
      <path d="M22.284 33.994a5.143 5.143 0 0 1 5.143-5.143 5.143 5.143 0 0 1 5.143 5.143v12.857a5.143 5.143 0 0 1-5.143 5.143 5.143 5.143 0 0 1-5.143-5.143V33.994z" fill="#E01E5A"/>
      <path d="M27.427 19.712a5.143 5.143 0 0 1-5.143-5.143 5.143 5.143 0 0 1 5.143-5.143 5.143 5.143 0 0 1 5.143 5.143v5.143H27.427z" fill="#36C5F0"/>
      <path d="M27.427 22.284a5.143 5.143 0 0 1 5.143 5.143 5.143 5.143 0 0 1-5.143 5.143H14.569a5.143 5.143 0 0 1-5.143-5.143 5.143 5.143 0 0 1 5.143-5.143h12.858z" fill="#36C5F0"/>
      <path d="M41.709 27.427a5.143 5.143 0 0 1 5.143 5.143 5.143 5.143 0 0 1-5.143 5.143 5.143 5.143 0 0 1-5.143-5.143v-5.143h5.143z" fill="#2EB67D"/>
      <path d="M39.137 27.427a5.143 5.143 0 0 1-5.143-5.143 5.143 5.143 0 0 1 5.143-5.143H51.994a5.143 5.143 0 0 1 5.143 5.143 5.143 5.143 0 0 1-5.143 5.143H39.137z" fill="#2EB67D"/>
      <path d="M34.004 13.142a5.143 5.143 0 0 1-5.143-5.143A5.143 5.143 0 0 1 34.004 2.856a5.143 5.143 0 0 1 5.143 5.143v5.143h-5.143z" fill="#ECB22E"/>
      <path d="M34.004 15.714a5.143 5.143 0 0 1 5.143 5.143 5.143 5.143 0 0 1-5.143 5.143H21.147a5.143 5.143 0 0 1-5.143-5.143 5.143 5.143 0 0 1 5.143-5.143h12.857z" fill="#ECB22E"/>
    </svg>
  );
}

// ─── Browser chrome ───────────────────────────────────────────────────────────

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-white/[0.08] dark:bg-[#16161F]">
      <div className="flex items-center gap-3 border-b border-stone-100 bg-stone-50 px-4 py-2.5 dark:border-white/[0.06] dark:bg-[#1A1A24]">
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex flex-1 items-center justify-center rounded-md border border-stone-200 bg-white px-3 py-1 dark:border-white/[0.08] dark:bg-white/5">
          <span className="truncate text-[11px] text-stone-400 dark:text-stone-600">{url}</span>
        </div>
      </div>
      <div className="p-0">{children}</div>
    </div>
  );
}

// ─── Animated Dashboard mockup ────────────────────────────────────────────────

type DashPhase =
  | "idle"
  | "incoming"
  | "diagnosing"
  | "sandboxing"
  | "pending"
  | "approved"
  | "applying"
  | "resolved";

const DASH_SEQUENCE: { phase: DashPhase; delay: number }[] = [
  { phase: "idle",       delay: 0    },
  { phase: "incoming",   delay: 1000 },
  { phase: "diagnosing", delay: 1150 },
  { phase: "sandboxing", delay: 1100 },
  { phase: "pending",    delay: 950  },
  { phase: "approved",   delay: 2300 },
  { phase: "applying",   delay: 380  },
  { phase: "resolved",   delay: 1100 },
];

// Pipeline stage labels for the inline trace bar
const PIPELINE_STAGES = ["detect", "diagnose", "sandbox", "propose", "apply"] as const;

function getActiveStageIdx(phase: DashPhase): number {
  switch (phase) {
    case "incoming":             return 0;
    case "diagnosing":           return 1;
    case "sandboxing":           return 2;
    case "pending":
    case "approved":             return 3;
    case "applying":             return 4;
    case "resolved":             return 5; // all complete
    default:                     return -1;
  }
}

type LiveRow = {
  status: string;
  color: string;
  dot: string;
  highlight: boolean;
};

function getLiveRow(phase: DashPhase): LiveRow | null {
  switch (phase) {
    case "incoming":   return { status: "detecting",        color: "text-rose-500",    dot: "animate-pulse bg-rose-400",    highlight: false };
    case "diagnosing": return { status: "diagnosing",       color: "text-blue-500",    dot: "animate-pulse bg-blue-400",    highlight: false };
    case "sandboxing": return { status: "sandboxing",       color: "text-sky-500",     dot: "animate-pulse bg-sky-400",     highlight: false };
    case "pending":    return { status: "pending approval", color: "text-amber-500",   dot: "animate-pulse bg-amber-400",   highlight: false };
    case "approved":   return { status: "approved",         color: "text-emerald-600", dot: "bg-emerald-500",               highlight: true  };
    case "applying":   return { status: "applying",         color: "text-emerald-500", dot: "animate-pulse bg-emerald-400", highlight: false };
    case "resolved":   return { status: "resolved",         color: "text-emerald-500", dot: "bg-emerald-500",               highlight: false };
    default:           return null;
  }
}

// Status-bar event log at bottom of dashboard
const STATUS_LOG: Partial<Record<DashPhase, { icon: string; text: string; success?: boolean }>> = {
  incoming:   { icon: "⚡", text: "Webhook · event_id=a949d871 · orders.ship_region" },
  diagnosing: { icon: "◦",  text: "Groq LLaMA 3.3 70B · rag.match=3 · conf=0.92" },
  sandboxing: { icon: "◦",  text: "pg.spawn · 500 rows seeded · 12 assertions passing" },
  pending:    { icon: "⏸",  text: "Proposal ready · proposal_id=f3a1b8 · awaiting approval" },
  approved:   { icon: "✓",  text: "Approved by VedantPalekar · entering transaction", success: true },
  applying:   { icon: "◦",  text: "Applying in transaction · dry_run=false · rowcount=301" },
  resolved:   { icon: "✓",  text: "301 rows fixed · COMMITTED · audit written", success: true },
};

const OLDER_INCIDENTS = [
  { id: "INC-4821", label: "null spike · users.email",          status: "approved",  color: "text-blue-500",    dot: "bg-blue-500",    time: "2m"  },
  { id: "INC-4820", label: "schema drift · orders.amount type", status: "in review", color: "text-amber-500",   dot: "bg-amber-400",   time: "11m" },
  { id: "INC-4819", label: "freshness lag · etl.daily_revenue", status: "resolved",  color: "text-emerald-500", dot: "bg-emerald-500", time: "44m" },
] as const;

function DashboardMockup() {
  const [phase, setPhase] = useState<DashPhase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = (idx: number) => {
      if (idx >= DASH_SEQUENCE.length) {
        timerRef.current = setTimeout(() => {
          setPhase("idle");
          timerRef.current = setTimeout(() => schedule(0), 600);
        }, 3800);
        return;
      }
      const { phase: next, delay } = DASH_SEQUENCE[idx];
      timerRef.current = setTimeout(() => {
        setPhase(next);
        schedule(idx + 1);
      }, delay);
    };
    schedule(0);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const liveRow       = getLiveRow(phase);
  const stageIdx      = getActiveStageIdx(phase);
  const statusLog     = STATUS_LOG[phase];
  const showBadge     = phase === "pending";
  const isSpinning    = ["diagnosing", "sandboxing", "applying"].includes(phase);
  const mttr          = phase === "resolved" ? "3m 49s" : "4m 12s";
  const mttrFlash     = phase === "resolved";

  return (
    <div className="flex min-h-[340px] flex-col">

      {/* Main area: sidebar + incident list */}
      <div className="flex flex-1">

        {/* Sidebar */}
        <div className="flex w-28 shrink-0 flex-col gap-0.5 border-r border-stone-100 bg-stone-50/60 px-3 py-4 dark:border-white/[0.05] dark:bg-[#111118]">
          {(["Incidents", "Pipeline", "Approvals", "Agents", "Catalog"] as const).map((item) => (
            <div
              key={item}
              className={`relative flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-medium ${
                item === "Incidents"
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                  : "text-stone-400 dark:text-stone-600"
              }`}
            >
              {item}
              {item === "Approvals" && showBadge && (
                <span
                  key="badge"
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white"
                  style={{ animation: "surfaceFadeIn 0.2s ease forwards" }}
                >
                  1
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Incident list */}
        <div className="flex flex-1 flex-col px-5 py-4">

          {/* Header + metrics */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              Active incidents
            </span>
            <div className="flex gap-2">
              {[
                { label: "MTTR",       value: mttr,   flash: mttrFlash },
                { label: "AUTO-FIXED", value: "73%",  flash: false     },
                { label: "RECURRING",  value: "2.1%", flash: false     },
              ].map(({ label, value, flash }) => (
                <div
                  key={label}
                  className={`rounded-md border px-2.5 py-1 text-center transition-all duration-500 ${
                    flash
                      ? "border-emerald-300 dark:border-emerald-800"
                      : "border-stone-200 dark:border-white/[0.08]"
                  }`}
                >
                  <div className="text-[8px] font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                    {label}
                  </div>
                  <div
                    className={`text-[11px] font-bold transition-colors duration-500 ${
                      flash
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-stone-800 dark:text-stone-100"
                    }`}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-stone-100 dark:divide-white/[0.04]">

            {/* Live incident row — only rendered when pipeline is active */}
            {liveRow && (
              <div
                className={`flex flex-col py-2 transition-colors duration-300 ${
                  liveRow.highlight
                    ? "rounded-md bg-emerald-50/70 px-1 dark:bg-emerald-950/20"
                    : ""
                }`}
                style={{
                  animation:
                    phase === "incoming"
                      ? "surfaceFadeIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards"
                      : undefined,
                }}
              >
                {/* Incident row */}
                <div className="flex items-center gap-3">
                  <span className="w-14 shrink-0 font-mono text-[10px] text-stone-400 dark:text-stone-600">
                    INC-4822
                  </span>
                  <span className="flex-1 text-[11px] text-stone-700 dark:text-stone-300">
                    null_violation · orders.ship_region
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${liveRow.dot}`} />
                    <span className={`text-[10px] font-medium transition-colors duration-300 ${liveRow.color}`}>
                      {liveRow.status}
                    </span>
                  </div>
                  <span className="w-6 shrink-0 text-right text-[10px] text-stone-400">0m</span>
                </div>

                {/* Pipeline trace — visible until resolved */}
                {stageIdx >= 0 && phase !== "resolved" && (
                  <div className="ml-[3.75rem] mt-1 flex items-center gap-0.5">
                    {PIPELINE_STAGES.map((stage, i) => (
                      <div key={stage} className="flex items-center gap-0.5">
                        <span
                          className={`font-mono text-[9px] transition-colors duration-300 ${
                            i < stageIdx
                              ? "text-emerald-500 dark:text-emerald-500"
                              : i === stageIdx
                              ? "font-bold text-blue-500 dark:text-blue-400"
                              : "text-stone-300 dark:text-stone-700"
                          }`}
                        >
                          {i < stageIdx ? "✓" : i === stageIdx ? "›" : "·"}&thinsp;{stage}
                        </span>
                        {i < PIPELINE_STAGES.length - 1 && (
                          <span className="text-[9px] text-stone-300 dark:text-stone-700"> — </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Older static incidents */}
            {OLDER_INCIDENTS.map(({ id, label, status, color, dot, time }) => (
              <div key={id} className="flex items-center gap-3 py-2.5">
                <span className="w-14 shrink-0 font-mono text-[10px] text-stone-400 dark:text-stone-600">
                  {id}
                </span>
                <span className="flex-1 text-[11px] text-stone-700 dark:text-stone-300">{label}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className={`text-[10px] font-medium ${color}`}>{status}</span>
                </div>
                <span className="w-6 shrink-0 text-right text-[10px] text-stone-400">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar — remounts on each phase to restart the fade-in */}
      <div
        key={phase}
        className={`flex min-h-[28px] items-center gap-2 border-t border-stone-100 px-4 py-1.5 dark:border-white/[0.05] ${
          statusLog ? "bg-stone-50/80 dark:bg-[#111118]" : "bg-transparent"
        }`}
        style={statusLog ? { animation: "surfaceFadeIn 0.3s ease forwards" } : undefined}
      >
        {statusLog && (
          <>
            <span
              className={`shrink-0 text-[10px] ${
                statusLog.success
                  ? "text-emerald-500"
                  : "text-stone-400 dark:text-stone-600"
              }`}
            >
              {statusLog.icon}
            </span>
            <span className="truncate font-mono text-[10px] text-stone-400 dark:text-stone-600">
              {statusLog.text}
            </span>
            {isSpinning && (
              <span className="ml-auto flex shrink-0 items-center gap-0.5">
                {[0, 100, 200].map((d) => (
                  <span
                    key={d}
                    className="h-1 w-1 rounded-full bg-stone-400 dark:bg-stone-600"
                    style={{
                      animation: "bounce 1s ease infinite",
                      animationDelay: `${d}ms`,
                    }}
                  />
                ))}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Animated Slack mockup ────────────────────────────────────────────────────

type SlackPhase =
  | "idle"
  | "detecting"
  | "proposal"
  | "question"
  | "typing"
  | "answer"
  | "approving"
  | "executing"
  | "resolved";

const PHASE_SEQUENCE: { phase: SlackPhase; delay: number }[] = [
  { phase: "idle",      delay: 0    },
  { phase: "detecting", delay: 900  },
  { phase: "proposal",  delay: 1700 },
  { phase: "question",  delay: 2300 },
  { phase: "typing",    delay: 1000 },
  { phase: "answer",    delay: 1250 },
  { phase: "approving", delay: 2100 },
  { phase: "executing", delay: 420  },
  { phase: "resolved",  delay: 1350 },
];

function AxiomAvatar() {
  return (
    <img
      src="/assets/axiomLogo.png"
      alt="AxiomDB"
      className="h-6 w-6 shrink-0 rounded-md object-cover"
    />
  );
}

function UserAvatar() {
  return (
    <img
      src="/assets/hinataDP.png"
      alt="VedantPalekar"
      className="h-6 w-6 shrink-0 rounded-md object-cover"
    />
  );
}

function DetectingCard() {
  return (
    <div className="rounded-md border-l-[3px] border-rose-500 bg-white px-3 py-2.5 shadow-sm dark:bg-white/[0.04]">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
        <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">Anomaly Detected</span>
      </div>
      <div className="grid grid-cols-[52px_1fr] gap-x-3 gap-y-0.5 text-[10px]">
        <span className="text-stone-400">Table</span>
        <span className="font-mono text-stone-600 dark:text-stone-300">orders.ship_region</span>
        <span className="text-stone-400">Failure</span>
        <span className="font-mono text-rose-600 dark:text-rose-400">null_violation · 301 rows</span>
        <span className="text-stone-400">Event</span>
        <span className="font-mono text-stone-500 dark:text-stone-500">event_id=a949d871</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-stone-600">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border border-stone-300 border-t-blue-500 dark:border-stone-700 dark:border-t-blue-400"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        Diagnosing with Groq LLaMA 3.3 70B…
      </div>
    </div>
  );
}

function ProposalCard({
  approveHighlighted,
  buttonsHidden,
}: {
  approveHighlighted: boolean;
  buttonsHidden: boolean;
}) {
  return (
    <div className="rounded-md border-l-[3px] border-amber-400 bg-white px-3 py-2.5 shadow-sm dark:bg-white/[0.04]">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">Proposal Ready</span>
        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          conf 0.92
        </span>
        <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
          sandbox ✓
        </span>
      </div>
      <div className="grid grid-cols-[52px_1fr] gap-x-3 gap-y-0.5 text-[10px]">
        <span className="text-stone-400">SQL</span>
        <span className="font-mono text-stone-600 dark:text-stone-300">
          UPDATE orders<br />
          SET ship_region = &apos;N/A&apos;<br />
          WHERE ship_region IS NULL
        </span>
        <span className="text-stone-400">Tested</span>
        <span className="text-emerald-600 dark:text-emerald-400">500 rows · 12 assertions passed</span>
        <span className="text-stone-400">RAG</span>
        <span className="text-stone-500 dark:text-stone-500">3 similar fixes retrieved</span>
      </div>
      {!buttonsHidden && (
        <div className="mt-2.5 flex gap-1.5">
          <button
            className={`rounded px-3 py-1 text-[10px] font-semibold text-white transition-all duration-150 ${
              approveHighlighted
                ? "scale-95 bg-emerald-500 shadow-md shadow-emerald-500/40"
                : "bg-emerald-600"
            }`}
          >
            ✓ Approve
          </button>
          <button className="rounded border border-stone-200 px-3 py-1 text-[10px] font-medium text-stone-500 dark:border-white/[0.12] dark:text-stone-500">
            Reject
          </button>
          <button className="rounded border border-stone-200 px-3 py-1 text-[10px] font-medium text-stone-500 dark:border-white/[0.12] dark:text-stone-500">
            Re-sandbox
          </button>
        </div>
      )}
    </div>
  );
}

function ExecutingCard() {
  return (
    <div className="rounded-md border-l-[3px] border-blue-500 bg-white px-3 py-2.5 shadow-sm dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full border-2 border-stone-200 border-t-blue-500 dark:border-stone-700 dark:border-t-blue-400"
          style={{ animation: "spin 0.7s linear infinite" }}
        />
        <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">Executing…</span>
      </div>
      <p className="mt-1 font-mono text-[10px] text-stone-400 dark:text-stone-600">
        proposal_id=f3a1b8 · approved by VedantPalekar · dry_run=false
      </p>
    </div>
  );
}

function ResolvedCard() {
  return (
    <div
      className="rounded-md border-l-[3px] border-emerald-500 bg-white px-3 py-2.5 shadow-sm dark:bg-white/[0.04]"
      style={{ animation: "surfaceFadeIn 0.4s ease forwards" }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-emerald-500">✓</span>
        <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">Applied Successfully</span>
      </div>
      <div className="grid grid-cols-[52px_1fr] gap-x-3 gap-y-0.5 text-[10px]">
        <span className="text-stone-400">Rows</span>
        <span className="font-mono text-stone-600 dark:text-stone-300">301 fixed</span>
        <span className="text-stone-400">Assertions</span>
        <span className="text-emerald-600 dark:text-emerald-400">passed</span>
        <span className="text-stone-400">Duration</span>
        <span className="font-mono text-stone-600 dark:text-stone-300">1.2s</span>
        <span className="text-stone-400">Audit</span>
        <span className="cursor-pointer text-blue-500 underline decoration-dotted">→ View entry</span>
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-stone-400 dark:text-stone-600">
        tagged AxiomDB.healed in OpenMetadata
      </p>
    </div>
  );
}

function SlackMockup() {
  const [phase, setPhase] = useState<SlackPhase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = (idx: number) => {
      if (idx >= PHASE_SEQUENCE.length) {
        timerRef.current = setTimeout(() => {
          setPhase("idle");
          timerRef.current = setTimeout(() => schedule(0), 500);
        }, 3800);
        return;
      }
      const { phase: nextPhase, delay } = PHASE_SEQUENCE[idx];
      timerRef.current = setTimeout(() => {
        setPhase(nextPhase);
        schedule(idx + 1);
      }, delay);
    };
    schedule(0);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const showCard    = phase !== "idle";
  const cardContent =
    phase === "detecting"                                                    ? "detecting"
    : ["proposal","question","typing","answer","approving"].includes(phase)  ? "proposal"
    : phase === "executing"                                                   ? "executing"
    : phase === "resolved"                                                    ? "resolved"
    : null;

  const showThread       = ["question","typing","answer","approving","executing","resolved"].includes(phase);
  const showTyping       = phase === "typing";
  const showAnswer       = ["answer","approving","executing","resolved"].includes(phase);
  const approveHighlight = phase === "approving";
  const buttonsHidden    = ["executing","resolved"].includes(phase);

  return (
    <div className="flex min-h-[340px]">
      {/* Slack-style sidebar */}
      <div className="flex w-[90px] shrink-0 flex-col gap-px border-r border-stone-100 bg-[#3B0A3F]/[0.04] px-1.5 py-3 dark:border-white/[0.05] dark:bg-[#111118]">
        <p className="mb-2 px-2 font-mono text-[8px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-700">
          Workspace
        </p>
        {["# general", "# axiom-ops", "# data-eng", "# on-call"].map((ch) => (
          <div
            key={ch}
            className={`rounded px-1.5 py-1 text-[10px] font-medium leading-snug ${
              ch === "# axiom-ops"
                ? "bg-white/80 font-semibold text-stone-800 shadow-sm dark:bg-white/[0.08] dark:text-stone-100"
                : "text-stone-400 dark:text-stone-600"
            }`}
          >
            {ch}
          </div>
        ))}
      </div>

      {/* Main conversation pane */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Channel header */}
        <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2 dark:border-white/[0.06]">
          <SlackLogo size={11} />
          <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">axiom-ops</span>
          <span className="text-[10px] text-stone-400 dark:text-stone-600">· data quality alerts</span>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-hidden px-3 py-3">
          {/* Main bot post */}
          {showCard && cardContent && (
            <div
              className="flex gap-2"
              style={{ animation: "surfaceFadeIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
            >
              <AxiomAvatar />
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">AxiomDB</span>
                  <span className="text-[9px] text-stone-400 dark:text-stone-600">Today 14:02</span>
                </div>
                {cardContent === "detecting"  && <DetectingCard />}
                {cardContent === "proposal"   && (
                  <ProposalCard approveHighlighted={approveHighlight} buttonsHidden={buttonsHidden} />
                )}
                {cardContent === "executing"  && <ExecutingCard />}
                {cardContent === "resolved"   && <ResolvedCard />}
              </div>
            </div>
          )}

          {/* Thread */}
          {showThread && (
            <div
              className="ml-8 space-y-2.5 border-l-2 border-stone-200 pl-3 dark:border-white/[0.08]"
              style={{ animation: "surfaceFadeIn 0.3s ease forwards" }}
            >
              <div className="flex gap-2">
                <UserAvatar />
                <div>
                  <div className="mb-0.5 flex items-baseline gap-1.5">
                    <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">VedantPalekar</span>
                    <span className="text-[9px] text-stone-400 dark:text-stone-600">14:03</span>
                  </div>
                  <p className="text-[11px] text-stone-700 dark:text-stone-300">is it safe to approve?</p>
                </div>
              </div>

              {showTyping && !showAnswer && (
                <div className="flex gap-2" style={{ animation: "surfaceFadeIn 0.2s ease forwards" }}>
                  <AxiomAvatar />
                  <div className="flex items-center gap-1 rounded-lg rounded-tl-none bg-stone-100 px-2.5 py-2 dark:bg-white/[0.06]">
                    {[0, 120, 240].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-stone-400 dark:bg-stone-600"
                        style={{ animation: `bounce 1s ease infinite`, animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {showAnswer && (
                <div className="flex gap-2" style={{ animation: "surfaceFadeIn 0.35s ease forwards" }}>
                  <AxiomAvatar />
                  <div>
                    <div className="mb-0.5 flex items-baseline gap-1.5">
                      <span className="text-[11px] font-bold text-stone-800 dark:text-stone-100">AxiomDB</span>
                      <span className="text-[9px] text-stone-400 dark:text-stone-600">14:03</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300">
                      3 similar fixes to{" "}
                      <span className="rounded bg-stone-200 px-1 font-mono text-[10px] dark:bg-white/[0.1]">
                        ship_region
                      </span>{" "}
                      in the past 30 days, all successful. Sandbox confirmed clean on 500 rows. Confidence 0.92 — above threshold. Safe to approve.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!showCard && (
            <div className="flex items-center gap-2 pt-2 opacity-40">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] text-stone-400 dark:text-stone-600">
                watching · axiomdb:slack stream
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline mockup ──────────────────────────────────────────────────────────

function TimelineMockup() {
  const entries = [
    { when: "TODAY · 14:02",     desc: "users.email null cascade · auto-patch · approved by @VedantPalekar",   badge: "1st seen",      badgeStyle: "border border-stone-300 text-stone-500 dark:border-white/[0.12] dark:text-stone-500" },
    { when: "YESTERDAY · 18:42", desc: "form_submissions schema drift · column type fix",             badge: "recurrence ×3", badgeStyle: "border border-amber-300 text-amber-600 dark:border-amber-700/60 dark:text-amber-500" },
    { when: "2D AGO · 09:11",    desc: "etl.daily_revenue freshness · upstream backfill",             badge: "1st seen",      badgeStyle: "border border-stone-300 text-stone-500 dark:border-white/[0.12] dark:text-stone-500" },
    { when: "5D AGO · 23:50",    desc: "sessions_idx duplicate keys · index rebuild",                 badge: "recurrence ×2", badgeStyle: "border border-amber-300 text-amber-600 dark:border-amber-700/60 dark:text-amber-500" },
  ];

  return (
    <div className="space-y-4 px-1 py-2">
      {entries.map(({ when, desc, badge, badgeStyle }) => (
        <div key={when} className="flex items-start gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-600">{when}</span>
            <span className="text-[13px] text-stone-700 dark:text-stone-300">{desc}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeStyle}`}>{badge}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Surface card ─────────────────────────────────────────────────────────────

function SurfaceCard({
  icon, tag, title, description, url, mockup,
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  url: string;
  mockup: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/[0.07] dark:bg-[#12121A]">
      <div className="flex items-center gap-2">
        <span className="text-stone-400 dark:text-stone-600">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-600">
          {tag}
        </span>
      </div>
      <div>
        <h3 className="text-xl font-bold leading-snug text-stone-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">{description}</p>
      </div>
      <BrowserFrame url={url}>{mockup}</BrowserFrame>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ThreeSurfaces() {
  return (
    <section id="surfaces">
      <style>{`
        @keyframes surfaceFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14">
          <span className="mb-4 inline-block bg-yellow-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-800">
            Where you live with it
          </span>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            <span className="text-stone-900 dark:text-white">Three surfaces.</span>
            <br />
            <span className="text-stone-400 dark:text-stone-600">One source of truth.</span>
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
          <SurfaceCard
            icon={<LayoutDashboard size={13} />}
            tag="Dashboard"
            title="See every incident, in flight and resolved."
            description="Live pipeline, queued approvals, agent traces. Built for the engineers who actually fix things."
            url="axiomdb.app/incidents"
            mockup={<DashboardMockup />}
          />
          <SurfaceCard
            icon={<SlackLogo size={14} />}
            tag="Slack · Conversational"
            title="Talk to it like a teammate."
            description="Not another notification firehose. Ask why, push back, request a different fix."
            url="axiomdb.slack.com / #axiom-ops"
            mockup={<SlackMockup />}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/[0.07] dark:bg-[#12121A]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={13} className="text-stone-400 dark:text-stone-600" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-600">
                Incident Timeline · With Recurrence
              </span>
            </div>
            <span className="text-[11px] text-stone-400 dark:text-stone-600">412 fixes · 9 recurring patterns</span>
          </div>
          <h3 className="mb-5 text-xl font-bold text-stone-900 dark:text-white">
            Every fix ever applied. Searchable. Linkable.
          </h3>
          <TimelineMockup />
        </div>
      </div>
    </section>
  );
}
