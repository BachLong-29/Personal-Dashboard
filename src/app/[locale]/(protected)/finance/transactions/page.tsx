import type { Metadata } from 'next';

import { TransactionsPage } from '@/features/finance/components/TransactionsPage';

export const metadata: Metadata = { title: 'Transactions' };

export default function Page() {
  return <TransactionsPage />;
}
