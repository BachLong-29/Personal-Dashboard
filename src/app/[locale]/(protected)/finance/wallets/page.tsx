import type { Metadata } from 'next';

import { WalletsPage } from '@/features/finance/components/WalletsPage';

export const metadata: Metadata = { title: 'Wallets' };

export default function Page() {
  return <WalletsPage />;
}
