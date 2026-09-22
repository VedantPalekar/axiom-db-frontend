"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import { DEMO_VIDEO_ID } from "../../lib/constants";
import { cn } from "@/lib/utils";
import { Eyebrow, HudButton, HudPanel, Readout } from "./hud";

// ── Live feed: one incident, start to finish, nobody paged ───────────────────
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const FEED: { t: string; tag: string; text: string; tone: "red" | "cyan" | "green" | "amber" | "violet" }[] = [
  { t: "02:14:07", tag: "DAMAGE", text: "orders.ship_region · null_violation · 301 rows", tone: "red" },
  { t: "02:14:08", tag: "DIAGNOSE", text: "groq llm · 3 similar fixes in memory · confidence 0.95", tone: "cyan" },
  { t: "02:14:11", tag: "SANDBOX", text: "ephemeral postgres · 500 rows seeded · fix PASSED", tone: "cyan" },
  { t: "02:14:12", tag: "PROPOSE", text: "card posted to #axiom-ops · rollback sql attached", tone: "cyan" },
  { t: "02:14:12", tag: "HOLD", text: "no page sent · operator status: asleep", tone: "violet" },
  { t: "07:31:40", tag: "APPROVE", text: "1 click · applied in txn · 2/2 assertions passed", tone: "green" },
  { t: "07:31:41", tag: "HEALED", text: "301 rows fixed · audit + catalog updated · receipt sent", tone: "green" },
];

const PHASE_MS = [900, 1400, 1400, 1400, 1400, 2200, 1500, 2600];

function LiveFeed() {
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    const step = () => {
      i = (i + 1) % (FEED.length + 1);
      setPhase(i as Phase);
      id = setTimeout(step, PHASE_MS[i] ?? 1400);
    };
    id = setTimeout(step, PHASE_MS[0]);
    return () => clearTimeout(id);
  }, []);

  const damaged = phase >= 1 && phase < 6;
  const healed = phase >= 6;
  const hp = phase === 0 ? 100 : healed ? 100 : 62;
  const barTone = healed ? "bg-hud-green shadow-[0_0_14px_var(--hud-green)]" : damaged ? "bg-hud-red shadow-[0_0_14px_var(--hud-red)]" : "bg-hud-green shadow-[0_0_14px_var(--hud-green)]";

  return (
    <HudPanel tone="cyan" className="w-full">
      <div className="flex items-center justify-between">
        <p className="font-hud-mono text-[11px] uppercase tracking-[0.3em] text-hud-cyan">
          <span className="blink text-hud-red">●</span> Live · incident feed
        </p>
        <p className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">northwind · prod</p>
      </div>

      {/* HP bar */}
      <div className="mt-5">
        <div className="flex items-end justify-between font-hud-mono">
          <span className="text-[10px] uppercase tracking-[0.25em] text-hud-muted">Database HP</span>
          <span className={cn("text-lg tracking-[0.1em]", healed || !damaged ? "text-hud-green glow-green" : "text-hud-red glow-red")}>
            {hp}%
          </span>
        </div>
        <div className="mt-2 h-3 w-full border border-hud-line bg-hud-bg p-[2px]">
          <div
            className={cn("h-full transition-[width] duration-700 ease-out", barTone)}
            style={{ width: `${hp}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-hud-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">
          <span>{damaged ? "status: taking damage" : healed ? "status: healed" : "status: stable"}</span>
          <span>rows 500</span>
        </div>
      </div>

      {/* log */}
      <ol className="mt-5 space-y-1.5 font-hud-mono text-[12px]">
        {FEED.map((line, i) => {
          const visible = phase > i;
          const color = {
            red: "text-hud-red",
            cyan: "text-hud-cyan",
            green: "text-hud-green",
            amber: "text-hud-amber",
            violet: "text-hud-violet",
          }[line.tone];
          return (
            <li
              key={line.tag + i}
              className={cn("flex gap-3 transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")}
            >
              <span className="shrink-0 text-hud-muted">{line.t}</span>
              <span className={cn("w-[74px] shrink-0 font-bold uppercase tracking-[0.15em]", color)}>{line.tag}</span>
              <span className="text-hud-text/90">{line.text}</span>
            </li>
          );
        })}
        {phase < FEED.length && (
          <li className="flex gap-3 text-hud-cyan">
            <span className="text-hud-muted">--:--:--</span>
            <span className="cursor-blink">▮</span>
          </li>
        )}
      </ol>

      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-hud-line pt-4">
        <Readout label="Operator" value={phase >= 5 ? "awake · 1 click" : "asleep"} tone={phase >= 5 ? "green" : "dim"} />
        <Readout label="Pages sent" value="0" tone="green" />
        <Readout label="Mode" value="human-in-loop" tone="cyan" />
      </div>
    </HudPanel>
  );
}

// ── Demo modal ────────────────────────────────────────────────────────────────
function DemoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <div className="chamfer w-full max-w-4xl bg-hud-cyan/60 p-px" onClick={(e) => e.stopPropagation()}>
        <div className="chamfer bg-hud-panel p-3">
          <div className="flex items-center justify-between px-2 pb-3">
            <p className="font-hud-mono text-[11px] uppercase tracking-[0.3em] text-hud-cyan">▶ Mission replay</p>
            <button type="button" onClick={onClose} aria-label="Close" className="text-hud-dim hover:text-hud-cyan">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?autoplay=1&rel=0`}
              title="AxiomDB demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section className="relative overflow-hidden">
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}

      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.14),transparent_60%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <Eyebrow>// mission 001 — keep the database alive</Eyebrow>

          <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[1.05] tracking-[0.04em] text-hud-text sm:text-5xl lg:text-[3.6rem]">
            Autonomous
            <br />
            database
            <br />
            <span className="text-hud-cyan glow-cyan">self-healing.</span>
          </h1>

          <p className="mt-6 max-w-xl text-2xl font-medium text-hud-dim">
            For the 2AM page that shouldn&apos;t have woken you.
          </p>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-hud-text/80">
            AxiomDB watches your data, diagnoses what broke, tests the fix in an ephemeral sandbox and
            queues it for one-click approval. Every decision is written to the audit trail.{" "}
            <span className="text-hud-green">Nobody gets paged.</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <HudButton href="/dashboard">
              <Play className="h-3.5 w-3.5 fill-current" /> Press start
            </HudButton>
            <HudButton variant="ghost" onClick={() => setDemoOpen(true)}>
              Watch demo
            </HudButton>
            <a href="#mission" className="px-2 font-hud-mono text-[11px] uppercase tracking-[0.25em] text-hud-dim hover:text-hud-cyan">
              Mission briefing ↓
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-hud-line pt-6 sm:grid-cols-4">
            <Readout label="Safety" value="sandbox first" tone="cyan" />
            <Readout label="Control" value="human in loop" tone="cyan" />
            <Readout label="Memory" value="full audit" tone="cyan" />
            <Readout label="License" value="open source" tone="green" />
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.12),transparent_65%)]" />
          <div className="relative brackets">
            <LiveFeed />
          </div>
        </div>
      </div>
    </section>
  );
}
