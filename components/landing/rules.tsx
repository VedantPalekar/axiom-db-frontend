import { ShieldCheck, UserCheck, Undo2, ScrollText, ToggleLeft } from "lucide-react";
import { HudPanel, SectionHeader } from "./hud";

const RULES = [
  { icon: ShieldCheck, title: "No fix ships untested", text: "Every proposal has already passed in an ephemeral sandbox before a human sees it. Apply re-validates in a fresh one." },
  { icon: UserCheck, title: "No fix ships unapproved", text: "Production is never touched without an explicit human decision. Approve in Slack or the console; reject with a reason the system remembers." },
  { icon: Undo2, title: "Every fix has an undo", text: "Rollback SQL is generated with the fix and stored beside it. Post-apply assertions failing triggers ROLLBACK automatically." },
  { icon: ScrollText, title: "Every move is logged", text: "Applied, dry-run, rolled back, skipped or escalated — the audit log records the SQL, row counts, assertions and confidence." },
  { icon: ToggleLeft, title: "Dry-run is one toggle away", text: "Flip DRY_RUN at runtime. The full pipeline runs — diagnosis, sandbox, proposal, approval — and nothing reaches production. Safe for demos and staging." },
];

export function Rules() {
  return (
    <section id="rules" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <SectionHeader
            code="rules of engagement"
            title="Aggressive on bugs. Paranoid on production."
            blurb="Autonomy is only useful if you can sleep through it. These rules are enforced by the pipeline, not by policy documents."
          />
          <HudPanel tone="green" className="max-w-md">
            <p className="font-hud-mono text-[10px] uppercase tracking-[0.3em] text-hud-muted">default mode</p>
            <p className="mt-2 font-display text-xl font-bold uppercase tracking-[0.1em] text-hud-green glow-green">Dry run: on</p>
            <p className="mt-2 text-[15px] text-hud-dim">
              Out of the box AxiomDB proposes and never applies. You switch to live when you&apos;re ready — from the console, no restart.
            </p>
          </HudPanel>
        </div>

        <ol className="space-y-3">
          {RULES.map((r, i) => (
            <li key={r.title}>
              <HudPanel>
                <div className="flex gap-5">
                  <div className="shrink-0">
                    <span className="chamfer-sm inline-flex h-11 w-11 items-center justify-center border border-hud-line bg-hud-panel-2 text-hud-cyan">
                      <r.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div>
                    <p className="font-hud-mono text-[10px] uppercase tracking-[0.3em] text-hud-muted">rule 0{i + 1}</p>
                    <h3 className="mt-1 font-display text-base font-bold uppercase tracking-[0.08em] text-hud-text">{r.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-hud-dim">{r.text}</p>
                  </div>
                </div>
              </HudPanel>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
