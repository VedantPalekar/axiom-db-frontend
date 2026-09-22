import { Eye, Cpu, FlaskConical, Lightbulb, Zap, BookOpen } from "lucide-react";
import { HudPanel, SectionHeader } from "./hud";

const LEVELS = [
  {
    n: "01",
    name: "Detect",
    icon: Eye,
    text: "OpenMetadata fires a webhook when a data-quality test fails — or the built-in profiler catches it directly. Either way, AxiomDB answers 200 in milliseconds and gets to work in the background.",
    readout: "webhook · profiler · redis stream",
  },
  {
    n: "02",
    name: "Diagnose",
    icon: Cpu,
    text: "The failure is classified, the schema pulled, and similar past fixes retrieved from ChromaDB. Groq's LLM returns a root cause in plain English, fix SQL, rollback SQL and a confidence score.",
    readout: "groq llm · rag memory · confidence ≥ 0.70",
  },
  {
    n: "03",
    name: "Sandbox",
    icon: FlaskConical,
    text: "An ephemeral Postgres container spins up, seeds up to 500 rows from the real table and runs the fix. Assertions are checked and a before/after diff captured. Nothing has touched production yet.",
    readout: "testcontainers · before/after diff",
  },
  {
    n: "04",
    name: "Propose",
    icon: Lightbulb,
    text: "A proposal lands in the console and in Slack: root cause, exact SQL, affected rows, confidence, rollback. Ask the bot questions in-thread. Approve or reject with one click — whenever you wake up.",
    readout: "slack card · console · 1 click",
  },
  {
    n: "05",
    name: "Apply",
    icon: Zap,
    text: "On approval the fix is re-validated in a fresh sandbox, then executed in a single transaction with a statement timeout. Post-apply assertions pass → COMMIT. Fail → ROLLBACK and escalate.",
    readout: "txn · 30s timeout · auto-rollback",
  },
  {
    n: "06",
    name: "Document",
    icon: BookOpen,
    text: "Every outcome is written to the audit log with the SQL that ran. The fixed column gets annotated in OpenMetadata and the Slack card updates into a receipt. The table becomes self-documenting.",
    readout: "audit log · catalog note · receipt",
  },
];

export function Mission() {
  return (
    <section id="mission" className="border-y border-hud-line bg-hud-bg-2">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeader
          code="mission briefing"
          title="Six stages. One incident. Zero pages."
          blurb="Every stage talks to the next over Redis Streams with consumer-group acks — no agent calls another agent directly, and nothing is lost if a stage restarts."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lvl) => (
            <HudPanel key={lvl.n} className="group">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-black text-hud-line-2 transition-colors group-hover:text-hud-cyan">
                  {lvl.n}
                </span>
                <span className="chamfer-sm inline-flex h-10 w-10 items-center justify-center border border-hud-line bg-hud-panel-2 text-hud-cyan">
                  <lvl.icon className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-[0.1em] text-hud-text">
                Stage {lvl.n} · {lvl.name}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-hud-dim">{lvl.text}</p>
              <p className="mt-4 border-t border-hud-line pt-3 font-hud-mono text-[11px] uppercase tracking-[0.2em] text-hud-cyan">
                {lvl.readout}
              </p>
            </HudPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
