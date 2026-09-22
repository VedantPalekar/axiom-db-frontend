import type { Metadata } from "next";
import { Orbitron, Rajdhani, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["500", "700", "900"], variable: "--font-orbitron" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-rajdhani" });
const hudMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--font-hud-mono" });

export const metadata: Metadata = {
  title: "AxiomDB — Autonomous database self-healing",
  description:
    "AxiomDB detects data-quality failures, diagnoses them with an LLM, tests the fix in a sandbox and queues it for one-click approval. Nobody gets paged at 2AM.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${rajdhani.variable} ${hudMono.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
