'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { iconLibraryEndpoints } from '@/services/endpoints/icon-library';

const ICON_LIBRARY_KEY = ['icon-library'] as const;

/** Uploaded icon images kept for reuse in the icon picker, newest first. */
export function useIconLibrary(enabled = true) {
  return useQuery({
    queryKey: ICON_LIBRARY_KEY,
    queryFn: async () => {
      const { data } = await iconLibraryEndpoints.list();
      return data.data ?? [];
    },
    enabled,
  });
}

export function useAddToIconLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const { data } = await iconLibraryEndpoints.add(url);
      return data.data ?? [];
    },
    onSuccess: (library) => queryClient.setQueryData(ICON_LIBRARY_KEY, library),
  });
}

export function useRemoveFromIconLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const { data } = await iconLibraryEndpoints.remove(url);
      return data.data ?? [];
    },
    // Gone the moment × is pressed; put back if the server refuses.
    onMutate: async (url) => {
      await queryClient.cancelQueries({ queryKey: ICON_LIBRARY_KEY });
      const previous = queryClient.getQueryData<string[]>(ICON_LIBRARY_KEY);
      queryClient.setQueryData<string[]>(ICON_LIBRARY_KEY, (old) =>
        (old ?? []).filter((entry) => entry !== url),
      );
      return { previous };
    },
    onError: (_error, _url, context) => {
      if (context?.previous) queryClient.setQueryData(ICON_LIBRARY_KEY, context.previous);
    },
    onSuccess: (library) => queryClient.setQueryData(ICON_LIBRARY_KEY, library),
  });
}
