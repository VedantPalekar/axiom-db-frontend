import { SectionHeader } from "./hud";

const SLOTS = [
  { slot: "core", name: "FastAPI", note: "Python 3.12 · uvicorn" },
  { slot: "brain", name: "Groq LLM", note: "llama-3.3-70b" },
  { slot: "memory", name: "ChromaDB", note: "rag over past fixes" },
  { slot: "nervous system", name: "Redis Streams", note: "consumer groups · acks" },
  { slot: "sandbox", name: "testcontainers", note: "ephemeral postgres" },
  { slot: "target", name: "PostgreSQL", note: "asyncpg · sqlalchemy" },
  { slot: "catalog", name: "OpenMetadata", note: "tests · lineage · notes" },
  { slot: "comms", name: "Slack", note: "socket mode · threads" },
  { slot: "console", name: "Next.js", note: "react 19 · tanstack query" },
  { slot: "deploy", name: "Docker", note: "compose · railway" },
];

export function Loadout() {
  return (
    <section id="loadout" className="border-y border-hud-line bg-hud-bg-2">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeader code="loadout" title="Equipment" blurb="Boring, proven parts. Nothing exotic to keep alive at 3AM." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SLOTS.map((s) => (
            <div key={s.name} className="chamfer-sm border border-hud-line bg-hud-panel p-4 transition-colors hover:border-hud-cyan/60">
              <p className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">{s.slot}</p>
              <p className="mt-2 font-display text-sm font-bold uppercase tracking-[0.08em] text-hud-text">{s.name}</p>
              <p className="mt-1 font-hud-mono text-[11px] text-hud-cyan">{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
