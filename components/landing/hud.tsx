import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chamfered panel with a 1px neon-ish border. clip-path removes CSS borders,
 *  so the border is an outer clipped layer with the panel inset by 1px. */
export function HudPanel({
  children,
  className,
  tone = "line",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  tone?: "line" | "cyan" | "green" | "red" | "amber";
  padded?: boolean;
}) {
  const border = {
    line: "bg-hud-line-2",
    cyan: "bg-hud-cyan/60",
    green: "bg-hud-green/60",
    red: "bg-hud-red/60",
    amber: "bg-hud-amber/60",
  }[tone];
  return (
    <div className={cn("chamfer p-px", border, className)}>
      <div className={cn("chamfer h-full bg-hud-panel", padded && "p-5 sm:p-6")}>{children}</div>
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-hud-mono text-[11px] uppercase tracking-[0.3em] text-hud-cyan", className)}>
      {children}
    </p>
  );
}

export function SectionHeader({
  code,
  title,
  blurb,
  align = "left",
}: {
  code: string;
  title: string;
  blurb?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-10", align === "center" && "text-center")}>
      <Eyebrow>// {code}</Eyebrow>
      <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-[0.08em] text-hud-text sm:text-3xl">
        {title}
      </h2>
      {blurb && <p className={cn("mt-3 max-w-2xl text-base text-hud-dim", align === "center" && "mx-auto")}>{blurb}</p>}
    </div>
  );
}

export function HudButton({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  external,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  external?: boolean;
}) {
  const base =
    "chamfer-sm inline-flex items-center justify-center gap-2 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] transition-all";
  const styles =
    variant === "primary"
      ? "bg-hud-cyan text-hud-bg shadow-[0_0_24px_rgba(0,229,255,0.35)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] hover:brightness-110"
      : "border border-hud-line-2 bg-hud-panel text-hud-text hover:border-hud-cyan hover:text-hud-cyan";
  const cls = cn(base, styles, className);
  if (href) {
    return (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function Readout({ label, value, tone = "cyan" }: { label: string; value: string; tone?: "cyan" | "green" | "amber" | "red" | "dim" }) {
  const color = { cyan: "text-hud-cyan glow-cyan", green: "text-hud-green glow-green", amber: "text-hud-amber glow-amber", red: "text-hud-red glow-red", dim: "text-hud-dim" }[tone];
  return (
    <div className="font-hud-mono">
      <p className="text-[10px] uppercase tracking-[0.25em] text-hud-muted">{label}</p>
      <p className={cn("mt-1 text-sm uppercase tracking-[0.1em]", color)}>{value}</p>
    </div>
  );
}
