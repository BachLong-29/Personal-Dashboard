'use client';

import { useQuery } from '@tanstack/react-query';

import { projectEndpoints } from '@/services/endpoints/projects';

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', status ?? 'all'],
    queryFn: async () => {
      const { data } = await projectEndpoints.list(status);
      return data.data ?? [];
    },
  });
}
