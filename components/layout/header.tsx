"use client";

import { useEffect, useState } from "react";
import { Bell, ShieldCheck } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
}

function useClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Header({ title, description }: HeaderProps) {
  const clock = useClock();

  return (
    <header className="border-b border-hud-line bg-hud-panel/80 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-hud-mono text-[10px] uppercase tracking-[0.3em] text-hud-muted">// console</p>
          <h1 className="mt-1 font-display text-xl font-bold uppercase tracking-[0.08em] text-hud-text glow-cyan">
            {title}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="chamfer-sm hidden items-center gap-2 border border-hud-line bg-hud-panel-2 px-3 py-2 font-hud-mono text-[11px] uppercase tracking-[0.18em] text-hud-green sm:flex">
            <ShieldCheck className="h-4 w-4" />
            <span>All systems nominal</span>
          </div>
          <div className="chamfer-sm hidden border border-hud-line bg-hud-panel-2 px-3 py-2 font-hud-mono text-[11px] tracking-[0.18em] text-hud-dim md:block">
            {clock ?? "--:--:--"}
          </div>
          <button
            type="button"
            className="chamfer-sm inline-flex h-10 w-10 items-center justify-center border border-hud-line bg-hud-panel-2 text-stone-500 transition-colors hover:text-hud-cyan"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
