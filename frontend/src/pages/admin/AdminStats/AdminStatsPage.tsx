import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchAdminStatsApi } from '../../../api/admin';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  AdminStatsHeader,
  getPeriodDateRange,
  type PeriodType,
} from './components/AdminStatsHeader';
import { MetricsOverviewCards } from './components/MetricsOverviewCards';
import { FinancialSummaryCards } from './components/FinancialSummaryCards';
import { TrendChartWidget } from './components/TrendChartWidget';
import { ServerStatusCard } from './components/ServerStatusCard';
import { IntegrationsAndGeoTables } from './components/IntegrationsAndGeoTables';
import { PerformanceAndLogsSection } from './components/PerformanceAndLogsSection';

export const AdminStatsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isManager = currentUser?.role === 'ROLE_MANAGER';

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [period, setPeriod] = useState<PeriodType>('week');
  const [startDate, setStartDate] = useState<Date>(() => getPeriodDateRange('week').start);
  const [endDate, setEndDate] = useState<Date>(() => getPeriodDateRange('week').end);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    const range = getPeriodDateRange(newPeriod);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const handleCustomDateApply = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setPeriod('custom');
  };

  const toIsoStringLocal = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats', debouncedSearch, period, toIsoStringLocal(startDate), toIsoStringLocal(endDate)],
    queryFn: () => fetchAdminStatsApi(
      debouncedSearch,
      period,
      toIsoStringLocal(startDate),
      toIsoStringLocal(endDate)
    ),
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
  });

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">
        {isLoading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
            Failed to load platform statistics
          </div>
        ) : (
          <>
            <AdminStatsHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              period={period}
              onPeriodChange={handlePeriodChange}
              startDate={startDate}
              endDate={endDate}
              onCustomDateApply={handleCustomDateApply}
            />

            <MetricsOverviewCards stats={stats} isManager={isManager} />

            <FinancialSummaryCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
              <TrendChartWidget userGrowth={stats?.userGrowth} isManager={isManager} />
              {!isManager && <ServerStatusCard stats={stats} />}
            </div>

            <IntegrationsAndGeoTables stats={stats} />

            {!isManager && <PerformanceAndLogsSection stats={stats} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStatsPage;
