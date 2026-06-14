import type { Metadata } from 'next';

import { AchievementsPage } from '@/features/achievements/components/AchievementsPage';

export const metadata: Metadata = { title: 'Ambitions & Glory' };

export default function AchievementsRoute() {
  return <AchievementsPage />;
}
