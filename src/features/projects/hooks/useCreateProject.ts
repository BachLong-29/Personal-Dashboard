'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { projectEndpoints } from '@/services/endpoints/projects';
import type { CreateProjectPayload } from '@/types';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const { data } = await projectEndpoints.create(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
