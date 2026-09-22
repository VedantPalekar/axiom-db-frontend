import Link from "next/link";
import { GITHUB_URL } from "../../lib/constants";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50/60 dark:border-white/[0.06] dark:bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* Top row — 2/3 identity + 1/3 nav */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[2fr_1fr] sm:items-start">

          {/* Identity */}
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-stone-900 transition-opacity hover:opacity-80 dark:text-white"
            >
              <img src="/assets/axiomLogo.png" alt="AxiomDB" className="h-10 w-auto" />
              <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-white">AxiomDB</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              An autonomous database self-healing agent. Detects, diagnoses,
              sandboxes, proposes, applies, and documents.
            </p>
            <div className="mt-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-900 dark:border-white/[0.10] dark:text-stone-400 dark:hover:border-white/20 dark:hover:text-white"
              >
                <GithubIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav className="flex flex-col gap-2.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600">
              Explore
            </p>
            {[
              { href: "#how-it-works", label: "How it Works" },
              { href: "#features", label: "Intelligence" },
              { href: "#stack", label: "Tech Stack" },
              { href: "/dashboard", label: "View Demo" },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-stone-400 transition-colors hover:text-stone-900 dark:text-stone-500 dark:hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-stone-200/50 opacity-60 dark:border-white/[0.04]" />

        {/* Bottom row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold italic text-stone-600 dark:text-stone-400">
            <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
            "Every fix documented. Every decision auditable."
          </p>

          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400 dark:text-stone-600">
            AxiomDB v0.1 · Built for Hackathon 2026
          </p>
        </div>

      </div>
    </footer>
  );
}
