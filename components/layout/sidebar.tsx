"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpLeft,
  ClipboardList,
  Database,
  FileText,
  LayoutDashboard,
  Search,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", code: "01", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", code: "02", icon: Wrench },
  { href: "/profiling", label: "Profiling", code: "03", icon: Search },
  { href: "/connections", label: "Connections", code: "04", icon: Database },
  { href: "/audit", label: "Audit Log", code: "05", icon: ClipboardList },
  { href: "/incidents", label: "Incidents", code: "06", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-hud-line bg-hud-panel/90 lg:flex lg:flex-col">
      <div className="border-b border-hud-line px-6 py-6">
        <div className="flex items-center gap-3">
          <img src="/assets/axiomLogo.png" alt="AxiomDB" className="h-10 w-auto" />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-hud-text glow-cyan">AxiomDB</p>
            <p className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">Night watch</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigationItems.map(({ href, label, code, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "chamfer-sm group flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] transition-colors",
                isActive
                  ? "border-hud-cyan bg-hud-cyan/10 text-hud-cyan"
                  : "border-transparent text-stone-500 hover:bg-hud-panel-2 hover:text-hud-text",
              )}
            >
              <span className="font-hud-mono text-[10px] text-hud-muted group-hover:text-hud-dim">{code}</span>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 bg-hud-cyan shadow-[0_0_8px_var(--hud-cyan)]" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-hud-line px-6 py-4 font-hud-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">
        <p className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-hud-green shadow-[0_0_8px_var(--hud-green)]" />
          Systems nominal
        </p>
        <p className="mt-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-hud-violet shadow-[0_0_8px_var(--hud-violet)]" />
          Operator: asleep
        </p>
        <Link href="/" className="mt-4 flex items-center gap-2 text-stone-500 transition-colors hover:text-hud-cyan">
          <ArrowUpLeft className="h-3.5 w-3.5" />
          Back to landing
        </Link>
      </div>
    </aside>
  );
}
