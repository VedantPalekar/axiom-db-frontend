"use client";

import { useEffect, useState } from "react";

// ─── Pipeline flow diagram data ──────────────────────────────────────────────

const PIPELINE = [
  { label: "OpenMetadata" },
  { label: "FastAPI" },
  { label: "Redis" },
  { label: "LLM · Groq" },
  { label: "Sandbox" },
  { label: "Human Gate" },
  { label: "Production" },
] as const;

// Color per node index (7 nodes)
const NODE_COLORS = [
  { active: "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400",     glowHex: "#f43f5e" },
  { active: "border-orange-300 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400", glowHex: "#f97316" },
  { active: "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",  glowHex: "#f59e0b" },
  { active: "border-sky-300 bg-sky-50 text-sky-600 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400",           glowHex: "#0ea5e9" },
  { active: "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400", glowHex: "#6366f1" },
  { active: "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400",     glowHex: "#3b82f6" },
  { active: "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400", glowHex: "#10b981" },
] as const;

const NODE_INACTIVE =
  "border-stone-200 bg-white text-stone-400 dark:border-white/[0.08] dark:bg-[#16161F] dark:text-stone-600";

// ─── Stage cards data ─────────────────────────────────────────────────────────

const STAGES = [
  {
    num: 1,
    label: "Detect",
    description:
      "A data quality test fails in OpenMetadata. NULL violation, range breach, uniqueness error, referential integrity break, format mismatch. The webhook hits FastAPI instantly. No polling. No cron. The pipeline starts the moment the failure is confirmed.",
    tags: ["FastAPI", "OpenMetadata", "Redis Streams", "Pydantic"],
    numCls: "bg-rose-600",
    tagCls: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
    borderCls: "border-stone-100 hover:border-rose-200 dark:border-white/[0.06] dark:hover:border-rose-900",
  },
  {
    num: 2,
    label: "Diagnose",
    description:
      "A FastAPI worker pulls the failure from the Redis stream and calls LLaMA 3.3 70B via Groq. The prompt includes the failure payload plus the top 3 similar past fixes retrieved from ChromaDB using vector similarity. The model returns candidate SQL and a confidence score. Below the threshold, it escalates. Above it, the pipeline moves forward.",
    tags: ["Groq", "LLaMA 3.3 70B", "ChromaDB", "sentence-transformers"],
    numCls: "bg-amber-500",
    tagCls: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
    borderCls: "border-stone-100 hover:border-amber-200 dark:border-white/[0.06] dark:hover:border-amber-900",
  },
  {
    num: 3,
    label: "Sandbox",
    description:
      "The fix never touches production first. An ephemeral Postgres container spins up via testcontainers, clones the schema, seeds up to 500 real rows, and runs the SQL. Three retries with adjusted prompts on failure. The container is destroyed after the test. Nothing persists.",
    tags: ["testcontainers", "asyncpg", "Docker", "SQLAlchemy async"],
    numCls: "bg-sky-600",
    tagCls: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900",
    borderCls: "border-stone-100 hover:border-sky-200 dark:border-white/[0.06] dark:hover:border-sky-900",
  },
  {
    num: 4,
    label: "Propose",
    description:
      "A Proposal record is written to Postgres and surfaced in two places at once: the Next.js operator console and a live Slack card. Operators can approve, reject with a reason, or let it expire. Dry-run mode is togglable at runtime without a redeploy. No fix ever reaches production without an explicit human decision.",
    tags: ["Next.js", "Slack SDK", "SQLAlchemy", "Zustand"],
    numCls: "bg-blue-600",
    tagCls: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
    borderCls: "border-stone-100 hover:border-blue-200 dark:border-white/[0.06] dark:hover:border-blue-900",
  },
  {
    num: 5,
    label: "Apply",
    description:
      "On approval, the fix runs inside an explicit transaction on production. Post-apply assertions execute immediately after. If any assertion fails, the transaction rolls back automatically and the incident escalates. Every apply, rollback, and assertion result is written to an append-only audit log via Redis Streams in real time.",
    tags: ["asyncpg", "SQLAlchemy async", "Redis Streams"],
    numCls: "bg-emerald-600",
    tagCls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
    borderCls: "border-stone-100 hover:border-emerald-200 dark:border-white/[0.06] dark:hover:border-emerald-900",
  },
  {
    num: 6,
    label: "Document",
    description:
      "After a successful apply, a FixReport is written to Postgres. The affected column gets annotated in OpenMetadata and tagged AxiomDB.healed. The Slack card updates with deep links to the proposal and audit entry. The fix embedding is stored back in ChromaDB so future diagnoses can learn from this outcome.",
    tags: ["OpenMetadata", "Slack SDK", "ChromaDB", "asyncpg"],
    numCls: "bg-stone-600",
    tagCls: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/60 dark:text-stone-400 dark:border-stone-700",
    borderCls: "border-stone-100 hover:border-stone-300 dark:border-white/[0.06] dark:hover:border-stone-600",
  },
] as const;

// ─── Animation constants ──────────────────────────────────────────────────────

// step 0-5: connector[step] active, nodes 0..step lit
// step 6-7: all nodes lit, no connector active (success pause × 2)
const TOTAL_STEPS = 8;
const STEP_MS = 680;

// ─── Connector component ──────────────────────────────────────────────────────

function Connector({ isActive, glowHex }: { isActive: boolean; glowHex: string }) {
  return (
    <div className="relative flex-1 mx-1.5 flex items-center" style={{ height: 2 }}>
      {/* Static line */}
      <div className="absolute inset-0 rounded-full bg-stone-200 dark:bg-stone-800" />

      {/* Arrowhead */}
      <div
        className="absolute right-0 top-1/2 z-10"
        style={{
          width: 5,
          height: 5,
          borderRight: "1.5px solid",
          borderTop: "1.5px solid",
          borderColor: "#a8a29e",
          transform: "translateY(-50%) rotate(45deg)",
        }}
      />

      {/* Traveling dot — remounts each time isActive flips true */}
      {isActive && (
        <div
          className="absolute z-20"
          style={{
            top: "50%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            transform: "translateY(-50%)",
            backgroundColor: glowHex,
            boxShadow: `0 0 10px 4px ${glowHex}70`,
            animation: `axiom-travel ${STEP_MS - 40}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function HowItWorks() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % TOTAL_STEPS), STEP_MS);
    return () => clearInterval(id);
  }, []);

  const stageLabel =
    step < 6
      ? `Stage ${step + 1} · ${STAGES[step].label}`
      : "✓ Pipeline complete";

  return (
    <section
      id="how-it-works"
      className=""
    >
      {/* Keyframes — inline to avoid touching global CSS */}
      <style>{`
        @keyframes axiom-travel {
          from { left: -6px; }
          to   { left: calc(100% + 6px); }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-6 py-24">

        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <span className="mb-4 inline-block bg-yellow-300 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">
            How it works
          </span>
          <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight md:text-4xl">
            <span className="text-stone-900 dark:text-white">Six stages. Fully automated.</span>
            <br />
            <span className="text-stone-400 dark:text-stone-500">One human decision.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-500 dark:text-stone-400">
            Every stage is an independent worker consuming from a Redis Stream.
            No agent calls another directly — failures are isolated, retries are
            scoped, and the audit trail is complete.
          </p>
        </div>

        {/* ── Flow diagram ─────────────────────────────────────────────────── */}
        <div className="mb-14 rounded-2xl border border-stone-100 bg-stone-50/60 px-6 py-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
          {/* Scrollable on narrow viewports */}
          <div className="overflow-x-auto">
            <div className="flex min-w-[640px] items-center">
              {PIPELINE.map((node, i) => {
                // Node lights up once the signal "arrives" (step >= i)
                const isLit = step >= i;
                const isConnActive = step === i && i < 6;

                return (
                  <div key={node.label} className="flex flex-1 items-center last:flex-none">
                    {/* Node chip */}
                    <div
                      className={`flex-shrink-0 rounded-full border px-3 py-1.5 transition-all duration-500 ${
                        isLit ? NODE_COLORS[i].active : NODE_INACTIVE
                      }`}
                    >
                      <span className="whitespace-nowrap font-mono text-[11px] font-semibold">
                        {node.label}
                      </span>
                    </div>

                    {/* Connector */}
                    {i < PIPELINE.length - 1 && (
                      <Connector
                        isActive={isConnActive}
                        glowHex={NODE_COLORS[i].glowHex}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active stage label */}
          <div className="mt-5 flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full transition-colors duration-500"
              style={{
                backgroundColor:
                  step < 6 ? NODE_COLORS[step].glowHex : "#10b981",
              }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 dark:text-stone-600">
              {stageLabel}
            </span>
          </div>
        </div>

        {/* ── Stage cards ───────────────────────────────────────────────────── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage) => {
            const cardIndex = stage.num - 1;
            const isCardActive = step === cardIndex;

            return (
              <div
                key={stage.num}
                className={`flex flex-col rounded-xl border bg-white p-6 transition-all duration-300 dark:bg-[#16161F] ${stage.borderCls} ${
                  isCardActive
                    ? "shadow-md dark:shadow-black/30 -translate-y-0.5"
                    : ""
                }`}
              >
                {/* Number badge + label */}
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${stage.numCls}`}
                  >
                    {stage.num}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    {stage.label}
                  </h3>
                </div>

                {/* Description */}
                <p className="flex-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {stage.description}
                </p>

                {/* Tech tags */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {stage.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${stage.tagCls}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
