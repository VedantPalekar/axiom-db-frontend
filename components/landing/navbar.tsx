"use client";

import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLandingTheme } from "../../app/(marketing)/layout";
import { GITHUB_URL } from "../../lib/constants";

const NAV_LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#surfaces", label: "Surfaces" },
  { href: "#features", label: "Intelligence" },
  { href: "#stack", label: "Stack" },
];

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

export function Navbar() {
  const { theme, setTheme } = useLandingTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide on scroll down, show on scroll up (Industry standard for reading UX)
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform ${visible ? "translate-y-0" : "-translate-y-full"
        } ${scrolled
          ? "border-b border-stone-200/80 bg-[#FAFAF8]/80 backdrop-blur-lg dark:border-white/[0.08] dark:bg-[#0F0F14]/80 py-3"
          : "bg-transparent py-5"
        }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-stone-900 transition-opacity hover:opacity-80 dark:text-white"
        >
          <img src="/assets/axiomLogo.png" alt="AxiomDB" className="h-10 w-auto" />
          <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-white">AxiomDB</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 rounded-full border border-stone-200/50 bg-white/50 px-2 py-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* GitHub Link */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-400 dark:hover:bg-white/10 lg:flex"
            aria-label="GitHub Repository"
          >
            <GithubIcon className="h-4 w-4" />
          </a>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-white/10 dark:bg-white/5 dark:text-stone-400 dark:hover:border-white/20 dark:hover:text-white"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-full bg-[#0F172A] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#1E293B] active:scale-95 sm:inline-flex"
          >
            Launch App
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:text-stone-900 dark:border-white/10 dark:text-stone-400 dark:hover:text-white md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 border-t border-stone-200/80 bg-[#FAFAF8] px-6 py-5 shadow-xl dark:border-white/[0.06] dark:bg-[#0F0F14] md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
              >
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-[#0F172A] py-3 text-center text-sm font-bold text-white hover:bg-[#1E293B]"
              >
                Launch App
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 py-3 text-sm font-medium text-stone-600 dark:border-white/10 dark:text-stone-400"
              >
                <GithubIcon className="h-4 w-4" />
                View GitHub
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
