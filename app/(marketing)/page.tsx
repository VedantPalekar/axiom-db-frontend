import { ConsolePreview } from "../../components/landing/console-preview";
import { Footer } from "../../components/landing/footer";
import { Hero } from "../../components/landing/hero";
import { HowItWorks } from "../../components/landing/how-it-works";
import { IntelligenceSection } from "../../components/landing/intelligence-section";
import { ProblemSection } from "../../components/landing/problem-section";
import { TechStack } from "../../components/landing/tech-stack";
import { ThreeSurfaces } from "../../components/landing/three-surfaces";

export default function LandingPage() {
  return (
    <>
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <ThreeSurfaces />
        <IntelligenceSection />
        <ConsolePreview />
        <TechStack />
      </main>
      <Footer />
    </>
  );
}
