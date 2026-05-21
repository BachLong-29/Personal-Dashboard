import type { Metadata } from 'next';

import { ProfilePage } from '@/features/profile/components/ProfilePage';

export const metadata: Metadata = { title: 'Hero Identity' };

export default function HeroIdentityPage() {
  return <ProfilePage />;
}
