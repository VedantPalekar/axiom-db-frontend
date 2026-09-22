"use client";

import Link from "next/link";
import { CheckCircle2, Lock, PlayCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HealingCard } from "./healing-card";
import { HeroPerspectiveGrid } from "../HeroPerspectiveGrid";

const designPrinciples = [
  "Safe by default",
  "Human in the loop",
  "Audit trail",
  "Open source",
];

// ── Cycling terminal ──────────────────────────────────────────────────────────

const QUERIES = [
  {
    cmd: 'axiomdb fix --issue "high error rate"',
    resp: "✓  Fix validated. Ready for approval.",
    respCls: "text-emerald-400",
  },
  {
    cmd: "axiomdb scan --table orders --anomaly",
    resp: "⚠  3 anomalies found. Proposing remediation...",
    respCls: "text-yellow-400",
  },
  {
    cmd: "axiomdb audit --since 24h",
    resp: "✓  12 events logged. All decisions traceable.",
    respCls: "text-emerald-400",
  },
  {
    cmd: "axiomdb sandbox --replay incident-4821",
    resp: "✓  Fix safe to apply. Sandbox passed in 1.2s.",
    respCls: "text-blue-400",
  },
  {
    cmd: "axiomdb approve --fix latest",
    resp: "✓  Human approval received. Applying now...",
    respCls: "text-emerald-400",
  },
];

type TermPhase = "typing-cmd" | "pause" | "typing-resp" | "hold";

const CURSOR = (
  <span
    className="inline-block w-[0.42em] h-[0.85em] bg-stone-300 ml-px align-middle"
    style={{ animation: "cursor-blink 1s step-end infinite" }}
  />
);

function TerminalWindow() {
  const [qIdx, setQIdx] = useState(0);
  const [cmdChars, setCmdChars] = useState(0);
  const [respChars, setRespChars] = useState(0);
  const [phase, setPhase] = useState<TermPhase>("typing-cmd");

  const query = QUERIES[qIdx];
  const cmdLen = query.cmd.length;
  const respLen = query.resp.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCmdChars(cmdLen);
      setRespChars(respLen);
      setPhase("hold");
      return;
    }

    let t: ReturnType<typeof setTimeout>;

    switch (phase) {
      case "typing-cmd":
        if (cmdChars < cmdLen) {
          t = setTimeout(() => setCmdChars((c) => c + 1), 42);
        } else {
          t = setTimeout(() => setPhase("pause"), 300);
        }
        break;
      case "pause":
        t = setTimeout(() => setPhase("typing-resp"), 120);
        break;
      case "typing-resp":
        if (respChars < respLen) {
          t = setTimeout(() => setRespChars((c) => c + 1), 28);
        } else {
          t = setTimeout(() => setPhase("hold"), 80);
        }
        break;
      case "hold":
        t = setTimeout(() => {
          setQIdx((i) => (i + 1) % QUERIES.length);
          setCmdChars(0);
          setRespChars(0);
          setPhase("typing-cmd");
        }, 1600);
        break;
    }

    return () => clearTimeout(t);
  }, [phase, cmdChars, respChars, cmdLen, respLen]);

  return (
    <div className="rounded-xl border border-stone-700/50 bg-stone-950 px-5 py-4 shadow-2xl shadow-black/50">
      {/* macOS traffic lights */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
      </div>
      <div className="min-h-[3rem] font-mono text-xs leading-6">
        {/* Command */}
        <div>
          <span className="text-stone-500">&gt; </span>
          <span className="text-stone-300">{query.cmd.slice(0, cmdChars)}</span>
          {phase === "typing-cmd" && CURSOR}
        </div>
        {/* Response */}
        {respChars > 0 && (
          <div>
            <span className={query.respCls}>{query.resp.slice(0, respChars)}</span>
            {phase === "typing-resp" && CURSOR}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Demo modal ────────────────────────────────────────────────────────────────

function DemoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="aspect-video w-full">
          <iframe
            src="https://www.youtube.com/embed/H3tvkptnSZ4?autoplay=1&rel=0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}

      <section className="relative overflow-hidden">
        <HeroPerspectiveGrid />

        <div className="relative z-10">
          <div className="mx-auto max-w-7xl px-6 pt-8 pb-24 md:pt-36 md:pb-32 lg:pt-28 lg:pb-40">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_440px] xl:gap-20">

              {/* ── LEFT — copy ── */}
              <div>
                {/* Badge */}
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-stone-500 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-stone-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  v0.1 · Early Access · Open Source
                </div>

                {/* Headline */}
                <h1 className="max-w-[560px] text-[2.6rem] font-extrabold leading-[1.1] tracking-tight text-stone-900 dark:text-white md:text-5xl lg:text-[3.25rem]">
                  Autonomous database self-healing.
                  <span className="mt-3 block text-[1.65rem] font-normal tracking-normal text-stone-500 dark:text-stone-400 md:text-[1.85rem] lg:text-[2rem] leading-snug">
                    For the 2am page that shouldn&apos;t have woken you.
                  </span>
                </h1>

                {/* Subtitle */}
                <p
                  className="mt-5 max-w-[440px] text-base text-stone-500 dark:text-stone-400"
                  style={{ lineHeight: "1.7" }}
                >
                  AxiomDB watches your data, diagnoses what broke, tests the fix
                  in an ephemeral sandbox, asks a human to approve, then writes
                  the whole story to your catalog.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setDemoOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-600 hover:to-blue-400 hover:shadow-blue-500/30 active:scale-[0.98]"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Watch demo
                  </button>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center rounded-lg border border-stone-200 bg-white/80 px-6 py-3 text-sm font-semibold text-stone-700 backdrop-blur-sm transition-colors hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
                  >
                    How it works
                  </Link>
                </div>

                {/* Trust section — guarantees + design principles unified */}
                <div className="mt-7 border-t border-stone-200 pt-5 dark:border-white/[0.07]">
                  {/* Primary guarantees */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500/80" />
                      Every fix documented
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500/80" />
                      Every decision auditable
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                      <Lock className="h-4 w-4 shrink-0 text-blue-500/80" />
                      Built for trust &amp; control
                    </div>
                  </div>

                  {/* Supporting design principles */}
                  <div className="mt-2.5 flex flex-wrap items-center">
                    {designPrinciples.map((label, i) => (
                      <span key={label} className="flex items-center">
                        <span className="text-[0.67rem] font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-600">
                          {label}
                        </span>
                        {i < designPrinciples.length - 1 && (
                          <span className="mx-2 select-none text-stone-300 dark:text-stone-700">
                            ·
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT — visuals ── */}
              <div className="flex flex-col gap-4">
                <HealingCard />
                <TerminalWindow />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
