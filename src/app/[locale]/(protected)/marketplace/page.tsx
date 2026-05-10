import type { Metadata } from 'next';

import { MarketPlace } from '@/features/marketplace/components/MarketPlace';

export const metadata: Metadata = { title: 'Dashboard' };

export default function MarketplacePage() {
  return <MarketPlace />;
}
