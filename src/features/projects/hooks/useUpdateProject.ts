'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { projectEndpoints } from '@/services/endpoints/projects';
import type { UpdateProjectPayload } from '@/types';

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateProjectPayload & { id: string }) => {
      const { data } = await projectEndpoints.update(id, payload);
      return data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', vars.id] });
    },
  });
}
