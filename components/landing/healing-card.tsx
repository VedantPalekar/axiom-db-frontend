"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Cpu, FlaskConical, Lightbulb, Zap, BookOpen } from "lucide-react";

const steps = [
  {
    icon: Eye,
    label: "Detect",
    description: "Spot anomalies the moment they surface",
  },
  {
    icon: Cpu,
    label: "Diagnose",
    description: "Trace root cause through signals & context",
  },
  {
    icon: FlaskConical,
    label: "Sandbox",
    description: "Replay & validate fixes in isolation",
  },
  {
    icon: Lightbulb,
    label: "Propose",
    description: "Generate a safe, ranked remediation plan",
  },
  {
    icon: Zap,
    label: "Apply",
    description: "Execute the fix with human sign-off",
  },
  {
    icon: BookOpen,
    label: "Document",
    description: "Log every decision to your audit trail",
  },
];

// Each step stays highlighted for STEP_HOLD ms, then the dot travels for TRAVEL ms.
const STEP_HOLD = 1400;
const TRAVEL = 500;
const CYCLE = STEP_HOLD + TRAVEL;

export function HealingCard() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRef = useRef(0);
  const dotRefs = useRef<(HTMLDivElement | null)[]>(Array(steps.length - 1).fill(null));

  useEffect(() => {
    // Respect users who prefer reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let travelTimeout: ReturnType<typeof setTimeout>;

    const id = setInterval(() => {
      const current = stepRef.current;

      // Launch the dot down the connector from current step to the next
      if (current < steps.length - 1) {
        const dot = dotRefs.current[current];
        if (dot) {
          // Reset then restart so the animation replays each cycle
          dot.style.animation = "none";
          void dot.offsetHeight; // force reflow to flush the reset
          dot.style.animation = `healing-dot-travel ${TRAVEL}ms ease-in forwards`;
        }
      }

      // After the dot lands, activate the next step
      travelTimeout = setTimeout(() => {
        const next = (current + 1) % steps.length;
        stepRef.current = next;
        setActiveStep(next);
      }, TRAVEL);
    }, CYCLE);

    return () => {
      clearInterval(id);
      clearTimeout(travelTimeout);
    };
  }, []);

  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-white/80 p-6 backdrop-blur-xl dark:bg-[rgba(10,18,30,0.65)] dark:border-white/[0.07]"
      style={{
        boxShadow:
          "0 0 0 1px rgba(59, 130, 246, 0.2), 0 8px 40px rgba(59, 130, 246, 0.1), 0 1px 6px rgba(0, 0, 0, 0.12)",
        animation: "healing-border-pulse 3s ease-in-out infinite",
      }}
    >
      <div className="mb-5 flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
          Live · How AxiomDB heals
        </p>
      </div>

      <div className="flex flex-col">
        {steps.map(({ icon: Icon, label, description }, i) => {
          const isActive = i === activeStep;

          return (
            <div key={label} className="flex items-start gap-4">
              {/* Left column: icon bubble + connector line */}
              <div className="flex flex-col items-center">
                {/* Icon bubble — glows when active */}
                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                    "transition-all duration-500",
                    isActive
                      ? "border-blue-300 bg-blue-200 dark:border-blue-400/50 dark:bg-blue-500/30"
                      : "border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10",
                  ].join(" ") || ""}
                  style={{
                    boxShadow: isActive
                      ? "0 0 0 4px rgba(59, 130, 246, 0.15), 0 0 18px rgba(59, 130, 246, 0.3)"
                      : "none",
                  }}
                >
                  <Icon
                    className={[
                      "h-4 w-4 transition-colors duration-500",
                      isActive
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-blue-500 dark:text-blue-400",
                    ].join(" ") || ""}
                  />
                </div>

                {/* Connector line + traveling data dot */}
                {i < steps.length - 1 && (
                  <div className="relative my-1 h-6 w-px bg-stone-200 dark:bg-white/10">
                    {/* The dot travels from top (0) to bottom (16px = 24px connector - 8px dot) */}
                    <div
                      ref={(el) => {
                        dotRefs.current[i] = el;
                      }}
                      className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-500 opacity-0"
                      style={{
                        top: 0,
                        boxShadow: "0 0 6px 3px rgba(59, 130, 246, 0.55)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Step label + description */}
              <div className={i < steps.length - 1 ? "pb-4" : ""}>
                <p
                  className={[
                    "text-sm font-semibold transition-colors duration-400",
                    isActive
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-stone-700 dark:text-stone-300",
                  ].join(" ") || ""}
                >
                  {i + 1}. {label}
                </p>
                <p
                  className={[
                    "text-xs leading-relaxed transition-colors duration-400",
                    isActive
                      ? "text-stone-600 dark:text-stone-300"
                      : "text-stone-400 dark:text-stone-500",
                  ].join(" ")}
                >
                  {description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
