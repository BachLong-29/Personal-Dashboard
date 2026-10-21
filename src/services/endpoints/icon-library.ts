import { apiClient } from '@/libs/axios';
import type { ApiResponse } from '@/types';

/** Uploaded icon images the user can pick again, newest first. Every call returns the list. */
export const iconLibraryEndpoints = {
  list: () => apiClient.get<ApiResponse<string[]>>('/icon-library'),

  add: (url: string) => apiClient.post<ApiResponse<string[]>>('/icon-library', { url }),

  remove: (url: string) =>
    apiClient.delete<ApiResponse<string[]>>('/icon-library', { params: { url } }),
};
