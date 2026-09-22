"use client";

const VB_W = 2000;
const VB_H = 1000;
const N_LINES = 50;

type Line = { x1: number; y1: number; x2: number; y2: number };

const leftSet: Line[] = Array.from({ length: N_LINES }, (_, i) => {
  const t = i / (N_LINES - 1);
  return { x1: -VB_W * 0.2, y1: -VB_H * 0.1, x2: VB_W * t * 2.2, y2: VB_H };
});

const rightSet: Line[] = Array.from({ length: N_LINES }, (_, i) => {
  const t = i / (N_LINES - 1);
  return { x1: VB_W * 1.2, y1: -VB_H * 0.1, x2: VB_W * (1 - t * 2.2), y2: VB_H };
});

export function HeroPerspectiveGrid() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}
    >
      {/* Light mode base */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{ background: "linear-gradient(to right, #bae6fd 0%, #f0f9ff 50%, #d1fae5 100%)" }}
      />

      {/* Dark mode base — deep navy */}
      <div className="absolute inset-0 hidden dark:block" style={{ background: "#050B10" }} />

      {/* Dark mode: blue radial glow from top-center */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse 80% 45% at 50% -5%, rgba(59,130,246,0.13) 0%, transparent 70%)",
        }}
      />

      {/* Dark mode: faint teal accent bottom-right */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse 55% 35% at 85% 75%, rgba(16,185,129,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Dark mode: subtle grain texture for depth */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      {/* Light mode: horizon bloom */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 10%, rgba(255,255,255,0.8) 0%, transparent 80%)",
        }}
      />

      {/* Perspective grid lines */}
      <div style={{ position: "absolute", inset: 0, height: "100%" }}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <linearGradient id="pgFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="10%" stopColor="white" stopOpacity="0.2" />
              <stop offset="50%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0.7" />
            </linearGradient>
            <mask id="pgMask">
              <rect width={VB_W} height={VB_H} fill="url(#pgFade)" />
            </mask>
          </defs>
          <g
            mask="url(#pgMask)"
            stroke="currentColor"
            fill="none"
            className="text-blue-400/20 dark:text-blue-400/[0.07]"
          >
            {leftSet.map((l, i) => (
              <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth="1.1" />
            ))}
            {rightSet.map((l, i) => (
              <line key={`r${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth="1.1" />
            ))}
          </g>
        </svg>
      </div>

      {/* Light mode bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 dark:hidden"
        style={{ height: "15%", minHeight: "120px", background: "linear-gradient(to bottom, transparent, #FAFAF8)" }}
      />

      {/* Dark mode bottom fade — matches #050B10 page bg */}
      <div
        className="absolute bottom-0 left-0 right-0 hidden dark:block"
        style={{ height: "15%", minHeight: "120px", background: "linear-gradient(to bottom, transparent, #050B10)" }}
      />
    </div>
  );
}
