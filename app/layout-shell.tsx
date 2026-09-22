import type { ReactNode } from "react";
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";

interface LayoutShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function LayoutShell({
  title,
  description,
  children,
}: LayoutShellProps) {
  return (
    <div className="flex min-h-screen bg-[#fdf6ec] text-stone-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} />
        <div className="border-b border-orange-300 bg-orange-100 px-4 py-2 sm:px-6 lg:px-8">
          <p className="text-xs text-orange-900">
            🐳 <span className="font-semibold">Docker not running</span> — all data on these pages is live from the backend, so errors are expected.{" "}
            <a
              href="https://www.youtube.com/watch?v=H3tvkptnSZ4"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2 hover:text-orange-700"
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
