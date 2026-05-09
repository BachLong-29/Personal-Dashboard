import type { Metadata } from 'next';

import MainDashboard from '@/features/dashboard/components/MainDashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return <MainDashboard />;
}
