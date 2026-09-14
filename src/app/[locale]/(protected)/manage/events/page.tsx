import type { Metadata } from 'next';

import { EventsPage } from '@/features/events/components/EventsPage';

export const metadata: Metadata = { title: 'Events · Aetheria' };

export default function EventsManagePage() {
  return <EventsPage />;
}
