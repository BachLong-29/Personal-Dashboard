'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import type { ApiResponse, CombinedProfileResponse } from '@/types';

type ThemeSetting = CombinedProfileResponse['settings']['theme'];

/**
 * Saves just the theme. The profile PUT takes partial bodies, so this does not
 * need the whole profile form — and saving it means the choice follows the
 * account instead of being undone by ThemeSync on the next session.
 */
export function useUpdateTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: ThemeSetting) => {
      const { data } = await apiClient.put<ApiResponse<CombinedProfileResponse>>('/profile', {
        theme,
      });
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.me(), data);
    },
  });
}
