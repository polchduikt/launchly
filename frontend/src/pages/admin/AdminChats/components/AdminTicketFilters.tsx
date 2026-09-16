import React from 'react';
import {
  Filter,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Clock,
  Star,
  Sparkles,
  XCircle,
  CheckCircle2,
  Infinity as InfinityIcon,
  Calendar,
  CalendarDays,
  CalendarRange,
  History,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import { AdminSearchBar } from '../../../../components/admin';

export type TicketTabType = 'all' | 'unread' | 'favorites' | 'active' | 'completed' | 'resolved';
export type TicketPeriodType = 'all' | 'today' | 'yesterday' | 'week' | 'month';
export type TicketSortType = 'desc' | 'asc';

interface AdminTicketFiltersProps {
  isFilterCollapsed: boolean;
  setIsFilterCollapsed: (val: boolean) => void;
  activeTab: TicketTabType;
  setActiveTab: (tab: TicketTabType) => void;
  selectedPeriod: TicketPeriodType;
  setSelectedPeriod: (period: TicketPeriodType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOrder: TicketSortType;
  setSortOrder: (sort: TicketSortType) => void;
  onResetFilters: () => void;
}

export const AdminTicketFilters: React.FC<AdminTicketFiltersProps> = ({
  isFilterCollapsed,
  setIsFilterCollapsed,
  activeTab,
  setActiveTab,
  selectedPeriod,
  setSelectedPeriod,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  onResetFilters,
}) => {
  const { t } = useTranslation();

  if (isFilterCollapsed) {
    return (
      <aside
        onClick={() => setIsFilterCollapsed(false)}
        className="w-14 bg-[#F2EBDD] hover:bg-white border-r-2 border-[#0A0A0A] h-full flex items-center justify-center shrink-0 cursor-pointer transition select-none z-20"
        title="Показати фільтри"
      >
        <PanelLeftOpen size={22} className="text-[#0A0A0A]" />
      </aside>
    );
  }

  const hasActiveFilters =
    activeTab !== 'all' ||
    selectedPeriod !== 'all' ||
    searchQuery.trim() !== '' ||
    sortOrder !== 'desc';

  const tabs = [
    { id: 'all' as const, label: t('admin.tab_all'), icon: Layers },
    { id: 'unread' as const, label: t('admin.tab_unread'), icon: Clock },
    { id: 'favorites' as const, label: t('admin.tab_favorites'), icon: Star },
    { id: 'active' as const, label: t('admin.tab_active'), icon: Sparkles },
    { id: 'completed' as const, label: t('admin.tab_completed'), icon: XCircle },
    { id: 'resolved' as const, label: t('admin.tab_resolved'), icon: CheckCircle2 },
  ];

  const periods = [
    { id: 'all' as const, label: t('admin.period_all'), icon: InfinityIcon },
    { id: 'today' as const, label: t('admin.period_today'), icon: Calendar },
    { id: 'yesterday' as const, label: t('admin.period_yesterday'), icon: History },
    { id: 'week' as const, label: t('admin.period_week'), icon: CalendarDays },
    { id: 'month' as const, label: t('admin.period_month'), icon: CalendarRange },
  ];

  const sorts = [
    { id: 'desc' as const, label: t('admin.sort_newest'), icon: ArrowDownWideNarrow },
    { id: 'asc' as const, label: t('admin.sort_oldest'), icon: ArrowUpNarrowWide },
  ];

  return (
    <aside className="w-64 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] h-full flex flex-col shrink-0 z-20">
      <div className="h-16 px-4 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0">
        <div className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-1.5">
          <Filter size={15} className="text-[#0A0A0A]" />
          <span>{t('admin.filters')}</span>
        </div>
        <div className="flex items-center space-x-1">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="p-1 text-[#0A0A0A] hover:opacity-70 transition cursor-pointer"
              title={t('admin.reset_filters')}
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={() => setIsFilterCollapsed(true)}
            className="p-1 rounded-lg text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] transition cursor-pointer"
            title="Сховати фільтри"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-1 shrink-0">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
            {t('admin.search')}
          </label>
          <AdminSearchBar
            placeholder={t('admin.search_chats_placeholder')}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        <div className="space-y-1 shrink-0">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
            {t('admin.categories_label')}
          </label>
          <div className="space-y-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] ${
                    isActive
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[2px_2px_0px_#0A0A0A]'
                      : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent size={14} className={isActive ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1 shrink-0">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
            {t('admin.period_label')}
          </label>
          <div className="space-y-1">
            {periods.map((p) => {
              const IconComponent = p.icon;
              const isActive = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] ${
                    isActive
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[2px_2px_0px_#0A0A0A]'
                      : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent size={14} className={isActive ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'} />
                    <span>{p.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1 shrink-0">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A]">
            {t('admin.sort_by')}
          </label>
          <div className="space-y-1">
            {sorts.map((s) => {
              const IconComponent = s.icon;
              const isActive = sortOrder === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSortOrder(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] ${
                    isActive
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[2px_2px_0px_#0A0A0A]'
                      : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent size={14} className={isActive ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'} />
                    <span>{s.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
