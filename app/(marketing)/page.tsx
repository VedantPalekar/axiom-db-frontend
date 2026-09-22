import { ConsoleCta } from "../../components/landing/console-cta";
import { Enemies } from "../../components/landing/enemies";
import { Footer } from "../../components/landing/footer";
import { Hero } from "../../components/landing/hero";
import { Loadout } from "../../components/landing/loadout";
import { Mission } from "../../components/landing/mission";
import { Rules } from "../../components/landing/rules";
import { StatsStrip } from "../../components/landing/stats-strip";

export default function LandingPage() {
  return (
    <>
      <main>
        <Hero />
        <StatsStrip />
        <Enemies />
        <Mission />
        <Rules />
        <Loadout />
        <ConsoleCta />
      </main>
      <Footer />
    </>
  );
}
