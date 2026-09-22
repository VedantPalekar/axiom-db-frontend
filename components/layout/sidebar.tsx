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
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/proposals",
    label: "Proposals",
    icon: Wrench,
  },
  {
    href: "/profiling",
    label: "Profiling",
    icon: Search,
  },
  {
    href: "/connections",
    label: "Connections",
    icon: Database,
  },
  {
    href: "/audit",
    label: "Audit Log",
    icon: ClipboardList,
  },
  {
    href: "/incidents",
    label: "Incidents",
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white/90 lg:flex lg:flex-col">
      <div className="border-b border-stone-200 px-6 py-6">
        <div className="flex items-center gap-2">
          <img src="/assets/axiomLogo.png" alt="AxiomDB" className="h-10 w-auto" />
          <div>
            <p className="text-sm font-bold tracking-tight text-stone-900">AxiomDB</p>
            <p className="text-xs text-stone-500">Frontend console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-amber-50 text-stone-900 ring-1 ring-amber-200"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-600"
        >
          <ArrowUpLeft className="h-4 w-4" />
          <span>Back to landing</span>
        </Link>
      </div>
    </aside>
  );
}