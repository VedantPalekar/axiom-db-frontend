"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { GITHUB_URL } from "../../lib/constants";
import { HudButton, HudPanel } from "./hud";

const SCRIPT: { cmd: string; out: string[] }[] = [
  { cmd: "axiomdb status", out: ["pipeline  5/5 stages healthy", "mode      dry_run=true · threshold 0.70", "streams   events 41 · repair 23 · apply 22 · escalation 6"] },
  { cmd: "axiomdb sandbox --replay incident-4821", out: ["seeding 500 rows from orders …", "UPDATE \"orders\" SET ship_region = 'Unknown' WHERE ship_region IS NULL;", "✓ fix safe to apply · 301 rows · sandbox passed in 1.2s"] },
  { cmd: "axiomdb approve 279ad73e --by human", out: ["txn open · statement_timeout 30s", "2/2 post-apply assertions passed → COMMIT", "✓ healed · audit written · catalog annotated · slack receipt sent"] },
];

export function ConsoleCta() {
  const [step, setStep] = useState(0);
  const [chars, setChars] = useState(0);
  const [outLines, setOutLines] = useState(0);
  const current = SCRIPT[step];

  useEffect(() => {
    if (chars < current.cmd.length) {
      const id = setTimeout(() => setChars((c) => c + 1), 45);
      return () => clearTimeout(id);
    }
    if (outLines < current.out.length) {
      const id = setTimeout(() => setOutLines((n) => n + 1), 420);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setStep((s) => (s + 1) % SCRIPT.length);
      setChars(0);
      setOutLines(0);
    }, 2600);
    return () => clearTimeout(id);
  }, [chars, outLines, current]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="font-hud-mono text-[11px] uppercase tracking-[0.3em] text-hud-cyan">// ready player one</p>
          <h2 className="mt-4 font-display text-3xl font-black uppercase leading-tight tracking-[0.06em] text-hud-text sm:text-4xl">
            Insert coin.
            <br />
            <span className="text-hud-green glow-green">Go back to sleep.</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg text-hud-dim">
            Point AxiomDB at a Postgres database, connect OpenMetadata or just run the profiler, and let the
            pipeline queue fixes for the morning. It&apos;s open source and runs on your own infrastructure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <HudButton href="/dashboard">
              <Play className="h-3.5 w-3.5 fill-current" /> Launch console
            </HudButton>
            <HudButton href={GITHUB_URL} variant="ghost" external>
              Source on GitHub
            </HudButton>
          </div>
        </div>

        <HudPanel tone="cyan" padded={false}>
          <div className="flex items-center gap-2 border-b border-hud-line px-4 py-2.5">
            <span className="h-2.5 w-2.5 bg-hud-red" />
            <span className="h-2.5 w-2.5 bg-hud-amber" />
            <span className="h-2.5 w-2.5 bg-hud-green" />
            <span className="ml-3 font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">axiomdb — operator terminal</span>
          </div>
          <div className="min-h-[220px] p-4 font-hud-mono text-[13px] leading-relaxed">
            {SCRIPT.slice(0, step).map((s) => (
              <div key={s.cmd} className="mb-3 opacity-50">
                <p className="text-hud-cyan">&gt; {s.cmd}</p>
                {s.out.map((l) => (
                  <p key={l} className="text-hud-dim">{l}</p>
                ))}
              </div>
            ))}
            <p className="text-hud-cyan">
              &gt; {current.cmd.slice(0, chars)}
              {chars < current.cmd.length && <span className="cursor-blink">▮</span>}
            </p>
            {current.out.slice(0, outLines).map((l) => (
              <p key={l} className={l.startsWith("✓") ? "text-hud-green" : "text-hud-text/80"}>{l}</p>
            ))}
            {chars >= current.cmd.length && outLines >= current.out.length && (
              <p className="text-hud-cyan">&gt; <span className="cursor-blink">▮</span></p>
            )}
          </div>
        </HudPanel>
      </div>
    </section>
  );
}
