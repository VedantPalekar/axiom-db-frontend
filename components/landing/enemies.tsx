import { HudPanel, SectionHeader } from "./hud";
import { cn } from "@/lib/utils";

type Threat = "low" | "warning" | "critical";

const ENEMIES: { name: string; type: string; threat: Threat; intel: string; weakness: string }[] = [
  {
    name: "Null Violation",
    type: "null_violation",
    threat: "low",
    intel: "Required columns quietly filling with NULL. Reports break days later.",
    weakness: "UPDATE … SET col = <default> WHERE col IS NULL",
  },
  {
    name: "Duplicate Key",
    type: "uniqueness_violation",
    threat: "critical",
    intel: "Same id, twice. Joins fan out, totals double, nobody trusts the dashboard.",
    weakness: "Sandbox diff shows exactly which rows survive",
  },
  {
    name: "Range Outlier",
    type: "range_violation",
    threat: "warning",
    intel: "A negative amount or a 900-year-old customer sneaks past validation.",
    weakness: "IQR detection, bounded fix, rollback attached",
  },
  {
    name: "Orphan Row",
    type: "referential_integrity",
    threat: "critical",
    intel: "Child rows pointing at parents that no longer exist.",
    weakness: "Referential scan · proposal needs a human before DELETE",
  },
  {
    name: "Format Error",
    type: "format_violation",
    threat: "low",
    intel: "Emails without an @, phone numbers with letters. Death by a thousand cuts.",
    weakness: "Pattern profiler flags it before the CRM does",
  },
  {
    name: "Schema Drift",
    type: "schema_drift",
    threat: "warning",
    intel: "A column changed type at 1AM and three services didn't get the memo.",
    weakness: "Catalog diff via OpenMetadata · escalated, never auto-applied",
  },
];

const THREAT: Record<Threat, { label: string; cls: string; bar: number }> = {
  low: { label: "Low", cls: "text-hud-green", bar: 1 },
  warning: { label: "Warning", cls: "text-hud-amber", bar: 2 },
  critical: { label: "Critical", cls: "text-hud-red", bar: 3 },
};

export function Enemies() {
  return (
    <section id="enemies" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeader
        code="bestiary"
        title="Known enemies"
        blurb="Production databases don't fail loudly. They accumulate damage. These are the classes AxiomDB is trained to detect, diagnose and fix."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENEMIES.map((e) => {
          const t = THREAT[e.threat];
          return (
            <HudPanel key={e.type} tone={e.threat === "critical" ? "red" : e.threat === "warning" ? "amber" : "line"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">target</p>
                  <h3 className="mt-1 font-display text-base font-bold uppercase tracking-[0.08em] text-hud-text">{e.name}</h3>
                  <p className="mt-1 font-hud-mono text-[11px] text-hud-cyan">{e.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">threat</p>
                  <p className={cn("mt-1 font-display text-[11px] font-bold uppercase tracking-[0.2em]", t.cls)}>{t.label}</p>
                  <div className="mt-1.5 flex justify-end gap-1">
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={cn("h-1.5 w-4", n <= t.bar ? t.cls.replace("text-", "bg-") : "bg-hud-line")}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-hud-dim">{e.intel}</p>
              <div className="mt-4 border-t border-hud-line pt-3">
                <p className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">weakness</p>
                <p className="mt-1 font-hud-mono text-[12px] text-hud-green">{e.weakness}</p>
              </div>
            </HudPanel>
          );
        })}
      </div>
    </section>
  );
}
