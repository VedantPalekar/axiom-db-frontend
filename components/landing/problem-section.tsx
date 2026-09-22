const PAIN_POINTS = [
  {
    id: 1,
    headline: "Corruption is silent until something breaks.",
    body: "A NULL creeps into a non-nullable column. No alert fires. No pipeline fails. A downstream report returns wrong numbers for three days before anyone notices. By then, tracing the root cause is guesswork.",
    tag: "Detection gap",
    tagCls: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
    borderCls: "border-rose-300 dark:border-rose-700",
  },
  {
    id: 2,
    headline: "The same bug hits again. Nobody remembered the fix.",
    body: "The orders.discount column goes out of range for the fourth time this year. The engineer who patched it first is gone. The fix lived in a Slack thread, now buried under months of scroll. The team debugs from scratch, again.",
    tag: "Institutional amnesia",
    tagCls: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
    borderCls: "border-amber-300 dark:border-amber-700",
  },
  {
    id: 3,
    headline: "Manual patches leave no trail and no guarantee.",
    body: "Someone runs an UPDATE directly on production. It works this time. There is no record of what changed, no assertion that it held, no documentation of why the value was wrong. The next incident starts with the same confusion.",
    tag: "Audit void",
    tagCls: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
    borderCls: "border-blue-300 dark:border-blue-700",
  },
] as const;

export function ProblemSection() {
  return (
    <section
      id="problem"
      className=""
    >
      <div className="mx-auto max-w-7xl px-6 py-24">

        {/* Section header */}
        <div className="mb-16 max-w-2xl">
          <span className="mb-4 inline-block bg-yellow-300 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">
            The problem
          </span>
          <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight md:text-4xl">
            <span className="text-stone-900 dark:text-white">The problem everyone ignores</span>
            <br />
            <span className="text-stone-400 dark:text-stone-500">until it&apos;s too late.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-500 dark:text-stone-400">
            Data quality failures do not announce themselves. They accumulate quietly, and by the time someone notices, the damage is already downstream.
          </p>
        </div>

        {/* Pain points — stacked typographic layout */}
        <div className="flex flex-col gap-0">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.id}
              className={`border-l-2 py-10 pl-8 ${point.borderCls} first:pt-0 last:pb-0`}
            >
              <span
                className={`mb-4 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${point.tagCls}`}
              >
                {point.tag}
              </span>
              <h3 className="mb-3 text-xl font-bold leading-snug text-stone-900 dark:text-white md:text-2xl">
                {point.headline}
              </h3>
              <p className="max-w-2xl text-base leading-relaxed text-stone-500 dark:text-stone-400">
                {point.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
