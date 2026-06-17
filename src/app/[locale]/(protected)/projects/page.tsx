import type { Metadata } from 'next';

import { ProjectsList } from '@/features/projects/components/ProjectsList';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return <ProjectsList />;
}
