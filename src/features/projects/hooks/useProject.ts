'use client';

import { useQuery } from '@tanstack/react-query';

import { projectEndpoints } from '@/services/endpoints/projects';

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await projectEndpoints.detail(id as string);
      return data.data;
    },
  });
}
