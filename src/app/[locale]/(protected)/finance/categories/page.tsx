import type { Metadata } from 'next';

import { FinanceCategoriesPage } from '@/features/finance/components/FinanceCategoriesPage';

export const metadata: Metadata = { title: 'Finance Categories' };

export default function Page() {
  return <FinanceCategoriesPage />;
}
