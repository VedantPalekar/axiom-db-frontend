import { BookOpen, FlaskConical, RefreshCw, Repeat2 } from "lucide-react";
import type { ComponentType } from "react";

type Card = {
  icon: ComponentType<{ className?: string }>;
  iconCls: string;
  iconBgCls: string;
  name: string;
  punch: string;
  mechanism: string;
};

const CARDS: Card[] = [
  {
    icon: BookOpen,
    iconCls: "text-blue-600 dark:text-blue-400",
    iconBgCls: "bg-blue-50 dark:bg-blue-950/50",
    name: "RAG Knowledge Base",
    punch: "Every diagnosis is grounded in what actually worked before.",
    mechanism:
      "Each query embeds the anomaly context with all-MiniLM-L6-v2 and retrieves the top-3 most similar past fixes from ChromaDB via cosine similarity. The LLM never generates cold — it always has precedent.",
  },
  {
    icon: FlaskConical,
    iconCls: "text-sky-600 dark:text-sky-400",
    iconBgCls: "bg-sky-50 dark:bg-sky-950/50",
    name: "Sandbox Safety",
    punch: "No fix touches production before it survives a realistic replica.",
    mechanism:
      "An ephemeral Postgres container spins up via testcontainers, clones the target schema, seeds up to 500 rows from production, and runs the fix SQL. Three retries with adjusted prompts on failure. The container is destroyed immediately after — nothing leaks.",
  },
  {
    icon: Repeat2,
    iconCls: "text-amber-600 dark:text-amber-400",
    iconBgCls: "bg-amber-50 dark:bg-amber-950/50",
    name: "Recurrence Detection",
    punch: "The system knows when a failure isn't new — and escalates accordingly.",
    mechanism:
      "Every anomaly is keyed by the compound (column_fqn × anomaly_type). Each new occurrence increments a counter stored in Postgres. Recurrence count is surfaced on the proposal card and Slack message so operators can see if they're looking at a first-time glitch or a structural problem.",
  },
  {
    icon: RefreshCw,
    iconCls: "text-rose-600 dark:text-rose-400",
    iconBgCls: "bg-rose-50 dark:bg-rose-950/50",
    name: "Learning from Rejections",
    punch: "A rejected fix isn't wasted — it makes the next diagnosis sharper.",
    mechanism:
      "When an operator rejects a proposal, the rejection reason is embedded and written back into ChromaDB alongside the original fix candidate. Future RAG retrievals will surface this pair, steering the LLM away from approaches that a human already ruled out.",
  },
];

export function IntelligenceSection() {
  return (
    <section
      id="features"
      className=""
    >
      <div className="mx-auto max-w-7xl px-6 py-24">

        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <span className="mb-4 inline-block bg-yellow-300 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">
            The intelligence
          </span>
          <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight md:text-4xl">
            <span className="text-stone-900 dark:text-white">Not just automation.</span>
            <br />
            <span className="text-stone-400 dark:text-stone-500">A system that learns.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-500 dark:text-stone-400">
            The pipeline gets better with every fix applied and every proposal
            rejected. Context accumulates. Mistakes don't repeat.
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {CARDS.map(
            ({ icon: Icon, iconCls, iconBgCls, name, punch, mechanism }) => (
              <div
                key={name}
                className="rounded-xl border border-stone-100 bg-white p-7 dark:border-white/[0.06] dark:bg-[#16161F]"
              >
                {/* Icon */}
                <div
                  className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBgCls}`}
                >
                  <Icon className={`h-5 w-5 ${iconCls}`} />
                </div>

                {/* Name */}
                <h3 className="mb-2 text-base font-bold text-stone-900 dark:text-white">
                  {name}
                </h3>

                {/* Punchy sentence */}
                <p className="mb-3 text-sm font-medium leading-relaxed text-stone-700 dark:text-stone-300">
                  {punch}
                </p>

                {/* Mechanism — muted, technical */}
                <p className="text-sm leading-relaxed text-stone-400 dark:text-stone-500">
                  {mechanism}
                </p>
              </div>
            )
          )}
        </div>

      </div>
    </section>
  );
}
