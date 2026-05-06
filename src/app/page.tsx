import type { Metadata } from 'next';

import { Footer, Header } from '@/components/layouts/RootLayout';
import { HeroSection } from '@/features/home/components/HeroSection';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </>
  );
}
