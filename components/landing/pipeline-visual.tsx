const STAGES = [
  {
    num: 1,
    label: "Detect",
    sublabel: "OpenMetadata webhook",
    cardCls:
      "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
    badgeCls: "bg-rose-600",
    labelCls: "text-rose-900 dark:text-rose-300",
    sublabelCls: "text-rose-500 dark:text-rose-600",
  },
  {
    num: 2,
    label: "Diagnose",
    sublabel: "Groq LLaMA + RAG",
    cardCls:
      "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    badgeCls: "bg-amber-500",
    labelCls: "text-amber-900 dark:text-amber-300",
    sublabelCls: "text-amber-500 dark:text-amber-600",
  },
  {
    num: 3,
    label: "Sandbox",
    sublabel: "Ephemeral Postgres",
    cardCls:
      "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40",
    badgeCls: "bg-sky-600",
    labelCls: "text-sky-900 dark:text-sky-300",
    sublabelCls: "text-sky-500 dark:text-sky-600",
  },
  {
    num: 4,
    label: "Propose",
    sublabel: "Human approval gate",
    cardCls:
      "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40",
    badgeCls: "bg-violet-600",
    labelCls: "text-violet-900 dark:text-violet-300",
    sublabelCls: "text-violet-500 dark:text-violet-600",
  },
  {
    num: 5,
    label: "Apply",
    sublabel: "Transaction + rollback",
    cardCls:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    badgeCls: "bg-emerald-600",
    labelCls: "text-emerald-900 dark:text-emerald-300",
    sublabelCls: "text-emerald-500 dark:text-emerald-600",
  },
  {
    num: 6,
    label: "Document",
    sublabel: "OpenMetadata + Slack",
    cardCls:
      "border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800/50",
    badgeCls: "bg-stone-600",
    labelCls: "text-stone-800 dark:text-stone-300",
    sublabelCls: "text-stone-400 dark:text-stone-500",
  },
] as const;

type Stage = (typeof STAGES)[number];

function StageCard({ stage }: { stage: Stage }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-4 py-3 ${stage.cardCls}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${stage.badgeCls}`}
      >
        {stage.num}
      </span>
      <div>
        <p className={`text-sm font-semibold leading-tight ${stage.labelCls}`}>
          {stage.label}
        </p>
        <p className={`mt-0.5 text-[11px] leading-tight ${stage.sublabelCls}`}>
          {stage.sublabel}
        </p>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex shrink-0 items-center">
      <div className="h-px w-5 bg-stone-300 dark:bg-stone-700" />
      {/* CSS arrowhead — right-pointing triangle */}
      <div className="border-y-[4px] border-l-[5px] border-y-transparent border-l-stone-300 dark:border-l-stone-700" />
    </div>
  );
}

export function PipelineVisual() {
  return (
    <>
      {/* Mobile: 2×3 grid, no connectors */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
        {STAGES.map((stage) => (
          <StageCard key={stage.num} stage={stage} />
        ))}
      </div>

      {/* Desktop: single row with connectors */}
      <div className="hidden items-stretch md:flex">
        {STAGES.map((stage, i) => (
          <div key={stage.num} className="flex items-center">
            <StageCard stage={stage} />
            {i < STAGES.length - 1 && <Connector />}
          </div>
        ))}
      </div>
    </>
  );
}
