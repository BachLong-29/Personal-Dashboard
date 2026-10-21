import type { Metadata } from 'next';

import { TaskManagement } from '@/features/tasks/components/TaskManagement';

export const metadata: Metadata = { title: 'Quest Log' };

/** `?q=` opens the list already searched — the assistant links a task it just saved this way. */
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <TaskManagement initialSearch={typeof q === 'string' ? q : ''} />;
}
