import apiClient from './axios';
import type { DashboardStatsResponse } from '../types/dashboard';

export const getDashboardStatsApi = async (botId: number, days: number = 7): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<DashboardStatsResponse>(`/analytics/bots/${botId}/dashboard`, {
    params: { days },
  });
  return response.data;
};
