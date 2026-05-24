import type { Metadata } from 'next';

import { RewardManagement } from '@/features/rewards/components/RewardManagement';

export const metadata: Metadata = { title: 'Reward Forge · Aetheria' };

export default function RewardsManagePage() {
  return <RewardManagement />;
}
