import { apiClient } from '@/libs/axios';
import type {
  ApiResponse,
  ProjectDTO,
  ProjectDetailDTO,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '@/types';

export const projectEndpoints = {
  list: (status?: string) =>
    apiClient.get<ApiResponse<ProjectDTO[]>>(`/projects${status ? `?status=${status}` : ''}`),

  detail: (id: string) => apiClient.get<ApiResponse<ProjectDetailDTO>>(`/projects/${id}`),

  create: (payload: CreateProjectPayload) =>
    apiClient.post<ApiResponse<ProjectDTO>>('/projects', payload),

  update: (id: string, payload: UpdateProjectPayload) =>
    apiClient.put<ApiResponse<ProjectDTO>>(`/projects/${id}`, payload),

  archive: (id: string) => apiClient.patch<ApiResponse<ProjectDTO>>(`/projects/${id}/archive`),

  complete: (id: string) => apiClient.post<ApiResponse<ProjectDTO>>(`/projects/${id}/complete`),

  remove: (id: string) => apiClient.delete<ApiResponse<null>>(`/projects/${id}`),
};
