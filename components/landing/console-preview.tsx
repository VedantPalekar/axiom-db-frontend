"use client";

import { useEffect, useRef, useState } from "react";

type LogEntry = {
  time: string;
  stage: string;
  text: string;
  color: string;
  delay: number; // ms after previous entry
};

// One full run: boot → 5 pipeline phases → reset
const FULL_SEQUENCE: LogEntry[] = [
  // ── Boot ─────────────────────────────────────────────────────────────────
  { time: "00:00:00", stage: "BOOT",    color: "text-stone-400 dark:text-stone-500",      delay: 0,    text: "chromadb ready · ./data/chromadb" },
  { time: "00:00:00", stage: "BOOT",    color: "text-stone-400 dark:text-stone-500",      delay: 340,  text: "audit table ready · _axiomdb_audit" },
  { time: "00:00:00", stage: "BOOT",    color: "text-stone-400 dark:text-stone-500",      delay: 320,  text: "event store ready · _axiomdb_events" },
  { time: "00:00:00", stage: "BOOT",    color: "text-stone-400 dark:text-stone-500",      delay: 300,  text: "redis ping ok · localhost:6379" },
  { time: "00:00:01", stage: "BOOT",    color: "text-stone-400 dark:text-stone-500",      delay: 350,  text: "diagnosis consumer running" },
  { time: "00:00:01", stage: "BOOT",    color: "text-stone-400 dark:text-stone-500",      delay: 280,  text: "repair agent running" },
  { time: "00:00:01", stage: "BOOT",    color: "text-stone-400 dark:text-stone-500",      delay: 280,  text: "apply agent running" },
  { time: "00:00:01", stage: "READY",   color: "text-emerald-500 dark:text-emerald-400",  delay: 500,  text: "axiomdb v0.4.0 · dry_run=true · all agents nominal ✓" },

  // ── Phase 1 — employees.region NULL violation ─────────────────────────
  { time: "14:02:09", stage: "WEBHOOK", color: "text-sky-500 dark:text-sky-400",          delay: 2200, text: "POST /webhook/om-test-failure · event_id=a949d871" },
  { time: "14:02:09", stage: "ENRICH",  color: "text-stone-400 dark:text-stone-500",      delay: 380,  text: "table=employees · OM 404 · enrichment_ok=false · continuing" },
  { time: "14:02:10", stage: "DETECT",  color: "text-emerald-600 dark:text-emerald-400",  delay: 600,  text: "null_violation · employees.region · severity=low · actionable=true" },
  { time: "14:02:11", stage: "DIAGNOSE",color: "text-blue-500 dark:text-blue-400",        delay: 1300, text: "rag.match=3 · confidence=0.92 · repairable=true" },
  { time: "14:02:13", stage: "SANDBOX", color: "text-blue-500 dark:text-blue-400",    delay: 1400, text: "pg.spawn id=tc_a91f · seeding 9 rows · 12 assertions passed" },
  { time: "14:02:14", stage: "PROPOSAL",color: "text-amber-500 dark:text-amber-400",      delay: 800,  text: "status=pending_approval · proposal_id=f3a1b8" },

  // ── Phase 2 — approval + apply ────────────────────────────────────────
  { time: "14:05:31", stage: "APPROVE", color: "text-emerald-600 dark:text-emerald-400",  delay: 2800, text: "proposal_id=f3a1b8 · decided_by=admin" },
  { time: "14:05:31", stage: "REPAIR",  color: "text-blue-500 dark:text-blue-400",    delay: 600,  text: "sandbox attempt 1/3 · passed" },
  { time: "14:05:32", stage: "STORE",   color: "text-blue-500 dark:text-blue-400",    delay: 500,  text: "chromadb · fix stored · was_successful=true · total=11" },
  { time: "14:05:33", stage: "APPLY",   color: "text-emerald-500 dark:text-emerald-400",  delay: 700,  text: "rowcount=4 · COMMITTED · action=applied · dry_run=false" },
  { time: "14:05:33", stage: "AUDIT",   color: "text-stone-400 dark:text-stone-500",      delay: 400,  text: "written · rows_affected=4 · sandbox_passed=true" },

  // ── Phase 3 — customers.region NULL violation ─────────────────────────
  { time: "14:08:44", stage: "WEBHOOK", color: "text-sky-500 dark:text-sky-400",          delay: 2000, text: "POST /webhook/om-test-failure · event_id=c7f2b301" },
  { time: "14:08:44", stage: "DETECT",  color: "text-emerald-600 dark:text-emerald-400",  delay: 550,  text: "null_violation · customers.region · severity=high · actionable=true" },
  { time: "14:08:45", stage: "DIAGNOSE",color: "text-blue-500 dark:text-blue-400",        delay: 1200, text: "rag.match=2 · confidence=0.87 · repairable=true" },
  { time: "14:08:47", stage: "SANDBOX", color: "text-blue-500 dark:text-blue-400",    delay: 1400, text: "pg.spawn id=tc_b3c2 · seeding 91 rows · assertions passed" },
  { time: "14:08:48", stage: "APPLY",   color: "text-emerald-500 dark:text-emerald-400",  delay: 1000, text: "rowcount=60 · COMMITTED · action=applied" },
  { time: "14:08:48", stage: "AUDIT",   color: "text-stone-400 dark:text-stone-500",      delay: 400,  text: "written · rows_affected=60 · sandbox_passed=true" },

  // ── Phase 4 — orders.amount range violation → escalation ─────────────
  { time: "14:15:02", stage: "WEBHOOK", color: "text-sky-500 dark:text-sky-400",          delay: 2000, text: "POST /webhook/om-test-failure · event_id=d8a3f992" },
  { time: "14:15:02", stage: "DETECT",  color: "text-emerald-600 dark:text-emerald-400",  delay: 500,  text: "range_violation · orders.amount · negative_values=1" },
  { time: "14:15:04", stage: "DIAGNOSE",color: "text-blue-500 dark:text-blue-400",        delay: 1200, text: "rag.match=1 · confidence=0.64 · below_threshold=0.70" },
  { time: "14:15:05", stage: "ESCALATE",color: "text-red-500 dark:text-red-400",          delay: 700,  text: "confidence=0.64 < 0.70 · published to axiomdb:escalation" },

  // ── Phase 5 — dry-run toggle + uniqueness violation ───────────────────
  { time: "14:22:18", stage: "TOGGLE",  color: "text-amber-500 dark:text-amber-400",      delay: 2500, text: "dry_run=false · apply agent now in LIVE MODE" },
  { time: "14:22:33", stage: "WEBHOOK", color: "text-sky-500 dark:text-sky-400",          delay: 1500, text: "POST /webhook/om-test-failure · event_id=e1b9d445" },
  { time: "14:22:33", stage: "DETECT",  color: "text-emerald-600 dark:text-emerald-400",  delay: 500,  text: "uniqueness_violation · customers.email · duplicates=3" },
  { time: "14:22:35", stage: "DIAGNOSE",color: "text-blue-500 dark:text-blue-400",        delay: 1300, text: "rag.match=2 · confidence=0.81 · repairable=true" },
  { time: "14:22:37", stage: "SANDBOX", color: "text-blue-500 dark:text-blue-400",    delay: 1400, text: "pg.spawn id=tc_c9d1 · seeding 91 rows · assertions passed" },
  { time: "14:22:38", stage: "APPLY",   color: "text-emerald-500 dark:text-emerald-400",  delay: 900,  text: "rowcount=3 · COMMITTED · action=applied" },
  { time: "14:22:38", stage: "AUDIT",   color: "text-stone-400 dark:text-stone-500",      delay: 400,  text: "written · rows_affected=3 · sandbox_passed=true" },
];

const MAX_VISIBLE = 10;

const WATCHING = [
  { col: "employees.region",  status: "ok"    },
  { col: "customers.region",  status: "ok"    },
  { col: "orders.amount",     status: "alert" },
  { col: "customers.email",   status: "ok"    },
];

export function ConsolePreview() {
  const [visible, setVisible] = useState<LogEntry[]>([]);
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = (idx: number) => {
    if (idx >= FULL_SEQUENCE.length) {
      // pause then reset
      timerRef.current = setTimeout(() => {
        setVisible([]);
        setDone(false);
        indexRef.current = 0;
        timerRef.current = setTimeout(() => schedule(0), 600);
      }, 3000);
      setDone(true);
      return;
    }
    const entry = FULL_SEQUENCE[idx];
    timerRef.current = setTimeout(() => {
      setVisible((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      indexRef.current = idx + 1;
      schedule(idx + 1);
    }, entry.delay);
  };

  useEffect(() => {
    schedule(0);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 py-24">

        {/* Heading row */}
        <div className="mb-14 flex items-end justify-between">
          <div>
            <span className="mb-4 inline-block bg-yellow-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-800">
              Live Preview
            </span>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              <span className="text-stone-900 dark:text-white">The console, in motion.</span>
            </h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
              streaming · redis://events
            </span>
          </div>
        </div>

        {/* Mock browser */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-white/[0.08] dark:bg-[#16161F]">
          {/* Chrome bar */}
          <div className="flex items-center gap-3 border-b border-stone-100 bg-stone-50 px-4 py-2.5 dark:border-white/[0.06] dark:bg-[#1A1A24]">
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex flex-1 items-center justify-center rounded-md border border-stone-200 bg-white px-3 py-1 dark:border-white/[0.08] dark:bg-white/5">
              <span className="truncate text-[11px] text-stone-400 dark:text-stone-600">axiomdb.app/console</span>
            </div>
          </div>

          {/* Console body */}
          <div className="flex min-h-[280px] divide-x divide-stone-100 dark:divide-white/[0.05]">

            {/* Left — watching */}
            <div className="w-52 shrink-0 px-4 py-4 sm:w-56">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-600">
                Watching
              </p>
              <div className="space-y-3">
                {WATCHING.map(({ col, status }) => (
                  <div key={col} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-stone-400 dark:text-stone-600" fill="currentColor">
                        <rect x="1" y="4" width="14" height="8" rx="2" />
                      </svg>
                      <span className="truncate font-mono text-[11px] text-stone-600 dark:text-stone-400">{col}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${status === "alert" ? "animate-pulse bg-red-400" : "bg-emerald-400"}`} />
                      <span className={`text-[10px] font-medium ${status === "alert" ? "text-red-500" : "text-emerald-500"}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — stream log */}
            <div className="flex-1 px-5 py-4">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-600">
                ↳ Stream · events.axiom
              </p>
              <div className="space-y-2">
                {visible.map((entry, i) => (
                  <div
                    key={`${entry.time}-${entry.stage}-${i}`}
                    className="flex items-baseline gap-3 opacity-0"
                    style={{ animation: "fadeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
                  >
                    <span className="w-14 shrink-0 font-mono text-[10px] text-stone-400 dark:text-stone-500">
                      {entry.time}
                    </span>
                    <span className={`w-[4.5rem] shrink-0 font-mono text-[10px] font-bold uppercase ${entry.color}`}>
                      {entry.stage}
                    </span>
                    <span className="text-[11px] leading-snug text-stone-600 dark:text-stone-400">
                      {entry.text}
                    </span>
                  </div>
                ))}

                {/* Cursor / idle indicator */}
                {done ? (
                  <div className="flex items-center gap-2 pt-1 opacity-50">
                    <span className="font-mono text-[10px] text-stone-400">—</span>
                    <span className="font-mono text-[10px] text-stone-400 dark:text-stone-600">awaiting next event</span>
                    <span className="inline-block h-3 w-0.5 animate-pulse bg-stone-400 dark:bg-stone-600" />
                  </div>
                ) : (
                  <span className="inline-block h-3 w-0.5 animate-pulse bg-stone-400 dark:bg-stone-600" />
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
