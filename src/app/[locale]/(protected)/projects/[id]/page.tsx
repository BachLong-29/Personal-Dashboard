import type { Metadata } from 'next';

import { ProjectDetail } from '@/features/projects/components/ProjectDetail';

export const metadata: Metadata = { title: 'Project' };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
