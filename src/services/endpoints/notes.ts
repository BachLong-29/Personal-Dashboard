import { apiClient } from '@/libs/axios';
import type { ApiResponse, CreateNotePayload, Note, UpdateNotePayload } from '@/types';

export const noteEndpoints = {
  list: () => apiClient.get<ApiResponse<Note[]>>('/notes'),

  create: (payload: CreateNotePayload) => apiClient.post<ApiResponse<Note>>('/notes', payload),

  update: (id: string, payload: UpdateNotePayload) =>
    apiClient.patch<ApiResponse<Note>>(`/notes/${id}`, payload),
};
