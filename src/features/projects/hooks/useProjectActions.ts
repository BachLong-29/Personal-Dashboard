'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { projectEndpoints } from '@/services/endpoints/projects';

/** Archive (cascade-hide tasks) and complete (award XP/coins) mutations. */
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await projectEndpoints.archive(id);
      return data.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useCompleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await projectEndpoints.complete(id);
      return data.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
