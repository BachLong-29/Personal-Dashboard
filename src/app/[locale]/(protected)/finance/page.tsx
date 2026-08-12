import type { Metadata } from 'next';

import { FinancePage } from '@/features/finance/components/FinancePage';

export const metadata: Metadata = { title: 'Finance' };

export default function Page() {
  return <FinancePage />;
}
