"use client";

import { useState } from "react";

type Tech = {
  name: string;
  detail: string;
};

const GROUPS: { label: string; techs: Tech[] }[] = [
  {
    label: "Backend",
    techs: [
      {
        name: "FastAPI",
        detail:
          "Serves every API route — proposals, dashboard, audit, dry-run toggle. Fully async end to end.",
      },
      {
        name: "asyncpg",
        detail:
          "Raw async PostgreSQL driver. Powers before/after row snapshots in the sandbox executor.",
      },
      {
        name: "SQLAlchemy async",
        detail:
          "ORM layer for non-sandbox queries. Keeps schema migrations and model definitions in sync.",
      },
      {
        name: "Pydantic",
        detail:
          "Validates all runtime settings via BaseSettings — sandbox_diff_rows, DB URLs — overridable via .env.",
      },
      {
        name: "Docker Compose",
        detail:
          "Orchestrates the full local stack: API server, Redis, Postgres, workers, and OpenMetadata.",
      },
    ],
  },
  {
    label: "AI / ML",
    techs: [
      {
        name: "Groq LLaMA 3.3 70B",
        detail:
          "Inference backbone. Generates candidate fix SQL and post-apply assertions for each anomaly.",
      },
      {
        name: "ChromaDB",
        detail:
          "Vector store for past incidents. Lets the apply agent retrieve semantically similar historical fixes.",
      },
      {
        name: "sentence-transformers",
        detail:
          "Encodes fix descriptions and table schemas for ChromaDB ingestion and similarity retrieval.",
      },
      {
        name: "all-MiniLM-L6-v2",
        detail:
          "Lightweight 384-dim embedding model — fast enough to run inline without a dedicated GPU.",
      },
    ],
  },
  {
    label: "Infrastructure",
    techs: [
      {
        name: "Redis Streams",
        detail:
          "Event bus between agents. Each pipeline stage (detect → analyze → fix → approve → apply) publishes to a stream.",
      },
      {
        name: "testcontainers",
        detail:
          "Spins ephemeral Postgres instances for sandboxed fix validation. No production rows touched until approved.",
      },
      {
        name: "OpenMetadata",
        detail:
          "Receives post-apply audit entries. Maintains a human-readable lineage record for every database change.",
      },
      {
        name: "Slack SDK",
        detail:
          "Fires approval-request notifications. Humans can approve or reject a proposed fix directly from Slack.",
      },
    ],
  },
  {
    label: "Frontend",
    techs: [
      {
        name: "Next.js 16",
        detail:
          "App Router with server components for dashboard, audit log, proposal modal, and deep-link audit detail pages.",
      },
      {
        name: "TypeScript",
        detail:
          "Strict types across all API response shapes — proposal status enums, audit entries, diff row objects.",
      },
      {
        name: "Tailwind CSS",
        detail:
          "Utility-first, dark-mode-first design system. Consistent across all landing and dashboard pages.",
      },
      {
        name: "React Query",
        detail:
          "Handles 5-second audit polling, optimistic UI on proposal approvals, and re-sandbox request lifecycle.",
      },
      {
        name: "Zustand",
        detail:
          "Lightweight global store — dry-run toggle state, active proposal selection, and modal open/close.",
      },
    ],
  },
];

function TechPill({ tech }: { tech: Tech }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="inline-block cursor-default select-none rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-stone-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300">
        {tech.name}
      </span>

      {show && (
        <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-56 -translate-x-1/2 rounded-xl border border-stone-200 bg-white p-3.5 shadow-lg shadow-stone-200/60 dark:border-white/[0.08] dark:bg-[#12121A] dark:shadow-black/50">
          <p className="text-[11px] leading-[1.65] text-stone-500 dark:text-stone-400">
            {tech.detail}
          </p>
          {/* caret */}
          <span className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-stone-200 bg-white dark:border-white/[0.08] dark:bg-[#12121A]" />
        </div>
      )}
    </div>
  );
}

export function TechStack() {
  return (
    <section
      id="stack"
      className=""
    >
      <div className="mx-auto max-w-5xl px-6 py-24">

        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <span className="mb-4 inline-block bg-yellow-300 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">
            Tech stack
          </span>
          <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight md:text-4xl">
            <span className="text-stone-900 dark:text-white">Purpose-built from</span>
            <br />
            <span className="text-stone-400 dark:text-stone-500">the right primitives.</span>
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-500 dark:text-stone-400">
            Every technology chosen because it was the right tool — not because
            it was familiar. Event-driven end to end. No polling. No shared
            mutable state between agents.
          </p>
        </div>

        {/* Groups */}
        <div className="space-y-8">
          {GROUPS.map(({ label, techs }) => (
            <div
              key={label}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr] sm:items-start"
            >
              {/* Label */}
              <div className="flex items-center sm:pt-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  {label}
                </span>
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-2">
                {techs.map((tech) => (
                  <TechPill key={tech.name} tech={tech} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p className="mt-12 font-mono text-[10px] tracking-[0.18em] text-stone-400 dark:text-stone-500 uppercase">
          · Hover any pill for usage context
        </p>

      </div>
    </section>
  );
}
