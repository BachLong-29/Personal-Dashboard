import type { Metadata } from 'next';

import { AssistantPage } from '@/features/assistant/components/AssistantPage';

export const metadata: Metadata = { title: 'Assistant · Aetheria' };

export default function AssistantRoutePage() {
  return <AssistantPage />;
}
