'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { noteEndpoints } from '@/services/endpoints/notes';
import type { Note } from '@/types';

const NOTES_KEY = ['notes'] as const;

export function useNotes() {
  return useQuery({
    queryKey: NOTES_KEY,
    queryFn: async () => {
      const { data } = await noteEndpoints.list();
      return data.data ?? [];
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await noteEndpoints.create({ content });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}

export function useToggleNoteArchived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data } = await noteEndpoints.update(id, { archived });
      return data.data;
    },
    // Struck through the moment it is tapped: the round trip is not worth
    // watching for a line that only changes style.
    onMutate: async ({ id, archived }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_KEY });
      const previous = queryClient.getQueryData<Note[]>(NOTES_KEY);

      queryClient.setQueryData<Note[]>(NOTES_KEY, (old) =>
        (old ?? []).map((n) =>
          n.id === id ? { ...n, archivedAt: archived ? new Date().toISOString() : undefined } : n,
        ),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(NOTES_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  });
}
