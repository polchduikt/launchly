export interface DailyStatsEntry {
  date: string;
  activeUsers: number;
  clicks: number;
}

export interface ButtonStatsEntry {
  buttonName: string;
  clicks: number;
}

export interface DashboardStatsResponse {
  totalSubscribers: number;
  activeUsers24h: number;
  clicksCount30d: number;
  activeAutomations: number;
  dailyStats: DailyStatsEntry[];
  topButtons: ButtonStatsEntry[];
}
