const STATS = [
  { value: "6", label: "Pipeline stages", sub: "detect → document" },
  { value: "1", label: "Click to approve", sub: "Slack or console" },
  { value: "0", label: "Pages at 2AM", sub: "queued, not escalated" },
  { value: "100%", label: "Moves logged", sub: "sql · rows · assertions" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-hud-line bg-hud-panel/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-hud-line px-4 sm:px-6 md:grid-cols-4 md:divide-x lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="px-4 py-6 md:px-8">
            <p className="font-display text-3xl font-black text-hud-cyan glow-cyan">{s.value}</p>
            <p className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-hud-text">{s.label}</p>
            <p className="mt-1 font-hud-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
