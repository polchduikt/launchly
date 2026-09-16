import React, { useRef, useState } from 'react';
import { Search, ChevronDown, CalendarDays } from 'lucide-react';
import { useTranslation, getLanguage } from '../../../../i18n/config';
import { useClickOutside } from '../../../../hooks/useClickOutside';

export type PeriodType = 'day' | 'week' | '2weeks' | 'month' | '2months' | '3months' | 'all' | 'custom';

export const getPeriodDateRange = (p: PeriodType): { start: Date; end: Date } => {
  const now = new Date();
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
  if (currentEnd > now) {
    currentEnd.setDate(currentEnd.getDate() - 1);
  }
  const end = now;
  const start = new Date(currentEnd);
  if (p === 'day') {
    start.setDate(start.getDate() - 1);
  } else if (p === 'week') {
    start.setDate(start.getDate() - 7);
  } else if (p === '2weeks') {
    start.setDate(start.getDate() - 14);
  } else if (p === 'month') {
    start.setMonth(start.getMonth() - 1);
  } else if (p === '2months') {
    start.setMonth(start.getMonth() - 2);
  } else if (p === '3months') {
    start.setMonth(start.getMonth() - 3);
  } else if (p === 'all') {
    start.setFullYear(start.getFullYear() - 1);
  }
  return { start, end };
};

interface AdminStatsHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  startDate: Date;
  endDate: Date;
  onCustomDateApply: (start: Date, end: Date) => void;
}

export const AdminStatsHeader: React.FC<AdminStatsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  period,
  onPeriodChange,
  startDate,
  endDate,
  onCustomDateApply,
}) => {
  const { t } = useTranslation();
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsPeriodOpen(false), isPeriodOpen);
  useClickOutside(pickerRef, () => setIsPickerOpen(false), isPickerOpen);

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case 'day': return t('admin.period_day');
      case 'week': return t('admin.7_days');
      case '2weeks': return t('admin.period_2weeks');
      case 'month': return t('admin.30_days');
      case '2months': return t('admin.period_2months');
      case '3months': return t('admin.90_days');
      case 'all': return t('admin.all_time');
      case 'custom': return t('admin.period_custom');
      default: return p;
    }
  };

  const periodOptions: PeriodType[] = [
    'day', 'week', '2weeks', 'month', '2months', '3months', 'all', 'custom'
  ];

  const handleSelectPeriod = (opt: PeriodType) => {
    setIsPeriodOpen(false);
    if (opt === 'custom') {
      setTempStart(startDate.toISOString().slice(0, 16));
      setTempEnd(endDate.toISOString().slice(0, 16));
      setIsPickerOpen(true);
    } else {
      onPeriodChange(opt);
    }
  };

  const formatDateRangeDisplay = () => {
    const locale = getLanguage() === 'uk' ? 'uk-UA' : 'en-US';
    const opt: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: getLanguage() !== 'uk'
    };
    return startDate.toLocaleString(locale, opt) + ' - ' + endDate.toLocaleString(locale, opt);
  };

  const handleApplyCustomDates = () => {
    if (tempStart && tempEnd) {
      onCustomDateApply(new Date(tempStart), new Date(tempEnd));
      setIsPickerOpen(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between w-full mb-10">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]" size={16} />
        <input
          type="text"
          placeholder={t('admin.search_placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder-slate-400 focus:outline-none shadow-[2px_2px_0px_#0A0A0A]"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end relative">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className="flex items-center justify-between gap-2.5 px-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all shadow-[2px_2px_0px_#0A0A0A] min-w-[150px] cursor-pointer"
          >
            <span>{getPeriodLabel(period)}</span>
            <ChevronDown size={14} className={'text-current transition-transform duration-200 ' + (isPeriodOpen ? 'rotate-180' : '')} />
          </button>

          {isPeriodOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 overflow-hidden animate-in fade-in-50 duration-150">
              {periodOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectPeriod(opt)}
                  className={'w-full text-left px-4 py-2 text-xs font-bold uppercase transition-colors cursor-pointer ' + (period === opt ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-white')}
                >
                  {getPeriodLabel(opt)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => {
              setTempStart(startDate.toISOString().slice(0, 16));
              setTempEnd(endDate.toISOString().slice(0, 16));
              setIsPickerOpen(!isPickerOpen);
            }}
            className="flex items-center space-x-2.5 px-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all shadow-[2px_2px_0px_#0A0A0A] cursor-pointer select-none"
          >
            <CalendarDays size={15} className="text-current shrink-0" />
            <span className="font-mono">{formatDateRangeDisplay()}</span>
          </button>

          {isPickerOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] z-50 p-4 flex flex-col gap-3.5 animate-in fade-in-50 duration-150">
              <div className="font-['Anybody',sans-serif] text-[11px] font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                {t('admin.period_custom')}
              </div>
              <div className="flex flex-col gap-3 text-left">
                <label className="flex flex-col gap-1 text-[11px] font-bold text-[#0A0A0A]">
                  {t('admin.start')}
                  <input
                    type="datetime-local"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-[#0A0A0A]">
                  {t('admin.end')}
                  <input
                    type="datetime-local"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t-2 border-[#0A0A0A] pt-3">
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] rounded-lg transition-all cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleApplyCustomDates}
                  className="px-3 py-1.5 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] rounded-lg shadow-[2px_2px_0px_#0A0A0A] transition-all cursor-pointer"
                >
                  {t('admin.apply')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
