'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import type { ApiResponse, CombinedProfileResponse, ProfileFormData } from '@/types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: ProfileFormData) => {
      const { data } = await apiClient.put<ApiResponse<CombinedProfileResponse>>('/profile', form);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.me(), data);
    },
  });
}
