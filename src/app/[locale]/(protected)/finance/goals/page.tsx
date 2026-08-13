import type { Metadata } from 'next';

import { GoalsPage } from '@/features/finance/components/GoalsPage';

export const metadata: Metadata = { title: 'Savings Goals' };

export default function Page() {
  return <GoalsPage />;
}
