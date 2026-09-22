import { FRONTEND_GITHUB_URL, GITHUB_URL } from "../../lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-hud-line bg-hud-bg-2">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/assets/axiomLogo.png" alt="AxiomDB" className="h-9 w-auto" />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-hud-text">AxiomDB</p>
            <p className="font-hud-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">built so you can sleep</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-hud-mono text-[11px] uppercase tracking-[0.2em] text-hud-dim">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-hud-cyan">Backend</a>
          <a href={FRONTEND_GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-hud-cyan">Frontend</a>
          <a href="#mission" className="hover:text-hud-cyan">Mission</a>
          <a href="/dashboard" className="hover:text-hud-cyan">Console</a>
        </nav>
        <p className="font-hud-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">MIT · v0.4.0 · <span className="text-hud-green">systems nominal</span></p>
      </div>
    </footer>
  );
}
