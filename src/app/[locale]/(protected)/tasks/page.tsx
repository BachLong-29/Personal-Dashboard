import type { Metadata } from 'next';

import { TaskManagement } from '@/features/tasks/components/TaskManagement';

export const metadata: Metadata = { title: 'Quest Log' };

export default function TasksPage() {
  return <TaskManagement />;
}
