import { useQuery } from '@tanstack/react-query';
import { getDashboardStatsApi } from '../api/dashboard';

export const useDashboardStatsQuery = (botId: number, days: number = 7, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard-stats', botId, days],
    queryFn: () => getDashboardStatsApi(botId, days),
    enabled: enabled && botId >= 0,
  });
};
