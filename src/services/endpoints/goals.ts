import { apiClient } from '@/libs/axios';
import type { ApiResponse, GoalDTO, CreateGoalPayload, UpdateGoalPayload } from '@/types';

export const goalEndpoints = {
  list: (status?: string) =>
    apiClient.get<ApiResponse<GoalDTO[]>>(`/goals${status ? `?status=${status}` : ''}`),

  create: (payload: CreateGoalPayload) =>
    apiClient.post<ApiResponse<GoalDTO>>('/goals', payload),

  update: (id: string, payload: UpdateGoalPayload) =>
    apiClient.put<ApiResponse<GoalDTO>>(`/goals/${id}`, payload),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/goals/${id}`),

  toggleMilestone: (goalId: string, milestoneId: string) =>
    apiClient.patch<ApiResponse<GoalDTO>>(`/goals/${goalId}/milestone`, { milestoneId }),
};
