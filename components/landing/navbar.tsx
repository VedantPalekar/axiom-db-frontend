"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { GITHUB_URL } from "../../lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#enemies", label: "Enemies" },
  { href: "#mission", label: "Mission" },
  { href: "#rules", label: "Rules" },
  { href: "#loadout", label: "Loadout" },
];

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled ? "border-hud-line bg-hud-bg/90 backdrop-blur" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img src="/assets/axiomLogo.png" alt="AxiomDB" className="h-9 w-auto" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.25em] text-hud-text glow-cyan">
            AxiomDB
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-hud-dim transition-colors hover:text-hud-cyan"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-green">
            <span className="blink">●</span> Systems nominal
          </span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="chamfer-sm inline-flex h-9 w-9 items-center justify-center border border-hud-line bg-hud-panel text-hud-dim transition-colors hover:border-hud-cyan hover:text-hud-cyan"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <Link
            href="/dashboard"
            className="chamfer-sm inline-flex items-center gap-2 bg-hud-cyan px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-hud-bg shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all hover:shadow-[0_0_32px_rgba(0,229,255,0.6)]"
          >
            Launch console
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center border border-hud-line text-hud-dim md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-hud-line bg-hud-bg px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="px-2 py-2 font-display text-xs uppercase tracking-[0.2em] text-hud-dim">
                {label}
              </a>
            ))}
            <Link href="/dashboard" className="mt-2 chamfer-sm bg-hud-cyan px-4 py-2 text-center font-display text-xs font-bold uppercase tracking-[0.2em] text-hud-bg">
              Launch console
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 px-2 py-2 font-display text-xs uppercase tracking-[0.2em] text-hud-dim">
              <GithubIcon className="h-4 w-4" /> View GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
