'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { eventEndpoints } from '@/services/endpoints/events';
import type { CreateEventPayload, EventOverridePayload, UpdateEventPayload } from '@/types';

/** Every event rule the user owns. */
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.rules(),
    queryFn: async () => (await eventEndpoints.list()).data.data ?? [],
  });
}

/** Expanded occurrences for a date range — what the calendar views render. */
export function useEventOccurrences(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.events.range(from, to),
    enabled,
    queryFn: async () => (await eventEndpoints.occurrences(from, to)).data.data ?? [],
  });
}

/** Events feed the calendar and the day's capacity, so both have to be refreshed. */
function useInvalidateEvents() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.events.all });
    qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
    qc.invalidateQueries({ queryKey: ['tasks', 'suggestions'] });
  };
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (payload: CreateEventPayload) =>
      (await eventEndpoints.create(payload)).data.data,
    onSuccess: invalidate,
  });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateEventPayload & { id: string }) =>
      (await eventEndpoints.update(id, payload)).data.data,
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (id: string) => {
      await eventEndpoints.remove(id);
    },
    onSuccess: invalidate,
  });
}

export function useOverrideEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EventOverridePayload & { id: string }) =>
      (await eventEndpoints.override(id, payload)).data.data,
    onSuccess: invalidate,
  });
}
