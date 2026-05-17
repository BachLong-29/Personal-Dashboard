import type { Metadata } from 'next';

import { LandingNav } from '@/features/home/components/LandingNav';
import { LandingHero } from '@/features/home/components/LandingHero';
import { DarknessSection } from '@/features/home/components/DarknessSection';
import { AscentSection } from '@/features/home/components/AscentSection';
import { SystemSection } from '@/features/home/components/SystemSection';
import { ArsenalSection } from '@/features/home/components/ArsenalSection';
import { MetricsSection } from '@/features/home/components/MetricsSection';
import { VaultSection } from '@/features/home/components/VaultSection';
import { GuildSection } from '@/features/home/components/GuildSection';
import { CalloutSection } from '@/features/home/components/CalloutSection';
import { LandingFooter } from '@/features/home/components/LandingFooter';
import { LandingScrollReveal } from '@/features/home/components/LandingScrollReveal';

export const metadata: Metadata = {
  title: 'Aetheria — Forge the Hero You Were Meant to Be',
};

export default function HomePage() {
  return (
    <div className="lp-bg">
      <div className="lp-stars" />
      <div className="lp-aurora" />

      <LandingNav />

      <LandingHero />

      <div className="lp-divider">◆ ◆ ◆</div>
      <DarknessSection />

      <div className="lp-divider">◆ ◆ ◆</div>
      <AscentSection />

      <div className="lp-divider">◆ ◆ ◆</div>
      <SystemSection />

      <div className="lp-divider">◆ ◆ ◆</div>
      <ArsenalSection />

      <div className="lp-divider">◆ ◆ ◆</div>
      <MetricsSection />

      <div className="lp-divider">◆ ◆ ◆</div>
      <VaultSection />

      <div className="lp-divider">◆ ◆ ◆</div>
      <GuildSection />

      <CalloutSection />
      <LandingFooter />

      <LandingScrollReveal />
    </div>
  );
}
