'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { CreateTransactionPresetPayload, UpdateTransactionPresetPayload } from '@/types';

const KEY = ['finance', 'presets'];

export function usePresets() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await financeEndpoints.listPresets();
      return data.data ?? [];
    },
  });
}

export function useSavePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: (CreateTransactionPresetPayload | UpdateTransactionPresetPayload) & { id?: string }) => {
      const { data } = id
        ? await financeEndpoints.updatePreset(id, payload)
        : await financeEndpoints.createPreset(payload as CreateTransactionPresetPayload);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await financeEndpoints.removePreset(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
