import type { ReactNode } from "react";
import { Navbar } from "../../components/landing/navbar";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="hud min-h-screen flicker">
      <div className="hud-scanlines" aria-hidden />
      <div className="hud-vignette" aria-hidden />
      <div className="hud-sweep" aria-hidden />
      <Navbar />
      {children}
    </div>
  );
}
