"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Navbar } from "../../components/landing/navbar";

type LandingTheme = "light" | "dark";

interface LandingThemeContextValue {
  theme: LandingTheme;
  setTheme: (t: LandingTheme) => void;
}

export const LandingThemeContext = createContext<LandingThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function useLandingTheme() {
  return useContext(LandingThemeContext);
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<LandingTheme>("light");

  return (
    <LandingThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`${theme === "dark" ? "dark" : ""} min-h-screen bg-[#FAFAF8] text-stone-900 dark:bg-[#0F0F14] dark:text-[#F0EEE9]`}>
        <Navbar />
        {children}
      </div>
    </LandingThemeContext.Provider>
  );
}
