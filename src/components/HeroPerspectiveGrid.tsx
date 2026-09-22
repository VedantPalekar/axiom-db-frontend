"use client";

const VB_W = 1600;
const VB_H = 500;
const VP_X = VB_W / 2;

const N_RADIAL = 24;
const N_HORIZ = 18;
const SPREAD = 0.92;

const BL_X = VP_X - VB_W * SPREAD;
const BR_X = VP_X + VB_W * SPREAD;

type Line = { x1: number; y1: number; x2: number; y2: number };

const radialLines: Line[] = Array.from({ length: N_RADIAL + 1 }, (_, i) => {
  const t = i / N_RADIAL;
  return { x1: VP_X, y1: 0, x2: BL_X + t * (BR_X - BL_X), y2: VB_H };
});

const horizLines: Line[] = Array.from({ length: N_HORIZ }, (_, i) => {
  const t = Math.pow((i + 1) / N_HORIZ, 2.1);
  const y = t * VB_H;
  const frac = y / VB_H;
  return {
    x1: VP_X + (BL_X - VP_X) * frac,
    y1: y,
    x2: VP_X + (BR_X - VP_X) * frac,
    y2: y,
  };
});

export function HeroPerspectiveGrid() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Sky gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, #9ec8e8 0%, #cce8f8 30%, #e8f8f4 50%, #c8e8d8 100%)",
        }}
      />

      {/* Horizon bloom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 55% at 50% 52%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0.1) 55%, transparent 70%)",
        }}
      />

      {/* Perspective grid — bottom 54% */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "54%",
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <linearGradient id="pgFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="22%" stopColor="white" stopOpacity="0.18" />
              <stop offset="60%" stopColor="white" stopOpacity="0.55" />
              <stop offset="100%" stopColor="white" stopOpacity="0.75" />
            </linearGradient>
            <mask id="pgMask">
              <rect width={VB_W} height={VB_H} fill="url(#pgFade)" />
            </mask>
          </defs>

          <g mask="url(#pgMask)" stroke="white" fill="none">
            {radialLines.map((l, i) => (
              <line
                key={`r${i}`}
                x1={l.x1} y1={l.y1}
                x2={l.x2} y2={l.y2}
                strokeWidth="0.9"
              />
            ))}
            {horizLines.map((l, i) => (
              <line
                key={`h${i}`}
                x1={l.x1} y1={l.y1}
                x2={l.x2} y2={l.y2}
                strokeWidth="0.9"
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Soft feather where grid meets sky */}
      <div
        style={{
          position: "absolute",
          bottom: "48%",
          left: 0,
          right: 0,
          height: "12%",
          background:
            "linear-gradient(to bottom, transparent, rgba(230,245,255,0.0))",
        }}
      />
    </div>
  );
}
