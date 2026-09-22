import type { ReactNode } from "react";
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";

interface LayoutShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function LayoutShell({ title, description, children }: LayoutShellProps) {
  return (
    <div className="hud flex min-h-screen text-stone-900">
      <div className="hud-scanlines" aria-hidden />
      <div className="hud-vignette" aria-hidden />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} />
        <div className="border-b border-hud-line bg-hud-panel-2/70 px-4 py-1.5 sm:px-6 lg:px-8">
          <p className="font-hud-mono text-[11px] uppercase tracking-[0.18em] text-hud-amber">
            <span className="blink">▲</span> Notice — data on these pages is live from the backend. Backend offline = errors expected.{" "}
            <a
              href="https://www.youtube.com/watch?v=H3tvkptnSZ4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hud-cyan underline decoration-hud-cyan/40 underline-offset-4 hover:decoration-hud-cyan"
            >
              Watch the demo →
            </a>
          </p>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
