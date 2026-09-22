import { Bell, ShieldCheck } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600 shadow-sm sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Backend-driven workflow</span>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:text-stone-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
