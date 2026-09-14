import { apiClient } from '@/libs/axios';
import type {
  ApiResponse,
  CreateEventPayload,
  EventDTO,
  EventOccurrence,
  EventOverridePayload,
  UpdateEventPayload,
} from '@/types';

export const eventEndpoints = {
  /** Rules, not occurrences — override rows are never returned here. */
  list: () => apiClient.get<ApiResponse<EventDTO[]>>('/events'),

  occurrences: (from: string, to: string) =>
    apiClient.get<ApiResponse<EventOccurrence[]>>(`/events?from=${from}&to=${to}`),

  create: (payload: CreateEventPayload) =>
    apiClient.post<ApiResponse<EventDTO>>('/events', payload),

  update: (id: string, payload: UpdateEventPayload) =>
    apiClient.patch<ApiResponse<EventDTO>>(`/events/${id}`, payload),

  remove: (id: string) => apiClient.delete<ApiResponse<null>>(`/events/${id}`),

  /** Cancel or move a single occurrence of a repeating event. */
  override: (id: string, payload: EventOverridePayload) =>
    apiClient.post<ApiResponse<EventDTO>>(`/events/${id}/override`, payload),
};
