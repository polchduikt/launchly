export interface DailyStatsEntry {
  date: string;
  activeUsers: number;
  clicks: number;
}

export interface ButtonStatsEntry {
  buttonName: string;
  clicks: number;
}

export interface TagStatsEntry {
  tagName: string;
  count: number;
}

export interface HeatmapEntry {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface DashboardStatsResponse {
  totalSubscribers: number;
  activeUsers24h: number;
  clicksCount30d: number;
  activeAutomations: number;
  dailyStats: DailyStatsEntry[];
  topButtons: ButtonStatsEntry[];
  aiMessagesProcessed: number;
  aiResolutionRate: number;
  aiTimeSavedHours: number;
  aiResponseTimeSeconds: number;
  topTags: TagStatsEntry[];
  activityHeatmap: HeatmapEntry[];
}
