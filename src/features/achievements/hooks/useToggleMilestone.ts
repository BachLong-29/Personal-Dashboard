'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { goalEndpoints } from '@/services/endpoints/goals';

export function useToggleMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) => {
      const { data } = await goalEndpoints.toggleMilestone(goalId, milestoneId);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
