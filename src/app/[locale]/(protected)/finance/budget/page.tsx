import type { Metadata } from 'next';

import { BudgetPage } from '@/features/finance/components/BudgetPage';

export const metadata: Metadata = { title: 'Budget' };

export default function Page() {
  return <BudgetPage />;
}
