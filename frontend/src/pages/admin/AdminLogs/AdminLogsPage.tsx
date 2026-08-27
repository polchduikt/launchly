import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminLogsApi } from '../../../api/admin';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useTranslation } from '../../../i18n/config';

import { useAuthStore } from '../../../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../routes/paths';
import { TableSkeleton } from '../../../components/common/Skeleton';

export const AdminLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();

  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<'desc' | 'asc'>('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);

  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const levelDropdownRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setIsLevelDropdownOpen(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: logData, isLoading } = useQuery({
    queryKey: ['adminLogs', levelFilter, serviceFilter, debouncedSearch, startDate, endDate, sortFilter, page],
    queryFn: () => fetchAdminLogsApi(levelFilter, serviceFilter, debouncedSearch, startDate, endDate, sortFilter, page, 100),
  });

  if (currentUser?.role === 'ROLE_MANAGER') {
    return <Navigate to={ROUTES.ADMIN_STATS} replace />;
  }

  const logs = logData?.content || [];
  const totalPages = logData?.totalPages || 1;
  const totalElements = logData?.totalElements || 0;

  const levelOptions = [
    { value: 'all', label: t('admin.all_levels') },
    { value: 'INFO', label: 'INFO' },
    { value: 'WARN', label: 'WARN' },
    { value: 'ERROR', label: 'ERROR' },
  ];

  const serviceOptions = [
    { value: 'all', label: t('admin.all_services') },
    { value: 'AUTH', label: 'AUTH' },
    { value: 'BOT_ENGINE', label: 'BOT_ENGINE' },
    { value: 'BROADCAST', label: 'BROADCAST' },
    { value: 'SYSTEM', label: 'SYSTEM' },
  ];

  const getLevelLabel = (val: string) => {
    const found = levelOptions.find((o) => o.value === val);
    return found ? found.label : t('admin.all_levels');
  };

  const getServiceLabel = (val: string) => {
    const found = serviceOptions.find((o) => o.value === val);
    return found ? found.label : t('admin.all_services');
  };

  const formatEuropeanTimestamp = (ts: string) => {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <AdminLayout noPadding={true}>
      <div className="flex h-full w-full overflow-hidden bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
        
        <aside className="w-56 lg:w-60 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] h-full p-4 space-y-5 overflow-y-auto shrink-0 flex flex-col justify-between z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A]">
              <h3 className="font-['Anybody',sans-serif] text-xs font-black uppercase text-[#0A0A0A] flex items-center gap-1.5">
                <Filter size={14} className="text-[#0A0A0A]" />
                <span>{t('admin.filters_title')}</span>
              </h3>
              {(levelFilter !== 'all' || serviceFilter !== 'all' || startDate !== '' || endDate !== '' || sortFilter !== 'desc') && (
                <button
                  onClick={() => {
                    setLevelFilter('all');
                    setServiceFilter('all');
                    setStartDate('');
                    setEndDate('');
                    setSortFilter('desc');
                    setPage(0);
                  }}
                  className="text-[10px] font-black uppercase text-[#0A0A0A] underline hover:opacity-80 transition cursor-pointer"
                >
                  {t('admin.reset_filters')}
                </button>
              )}
            </div>

            <div className="space-y-1" ref={levelDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">{t('admin.level_col') || 'РІВЕНЬ'}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <span>{getLevelLabel(levelFilter)}</span>
                  <ChevronDown size={14} className={`text-[#0A0A0A] transition-transform duration-200 ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLevelDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 font-['JetBrains_Mono',monospace]">
                    {levelOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setLevelFilter(opt.value);
                          setIsLevelDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-bold uppercase flex items-center justify-between hover:bg-white transition cursor-pointer ${
                          levelFilter === opt.value ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A]'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1" ref={serviceDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">{t('admin.service_col') || 'СЕРВІС'}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <span>{getServiceLabel(serviceFilter)}</span>
                  <ChevronDown size={14} className={`text-[#0A0A0A] transition-transform duration-200 ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isServiceDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 font-['JetBrains_Mono',monospace]">
                    {serviceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setServiceFilter(opt.value);
                          setIsServiceDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-bold uppercase flex items-center justify-between hover:bg-white transition cursor-pointer ${
                          serviceFilter === opt.value ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A]'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">
                {t('admin.date_from')}
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                className="w-full px-2.5 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none transition shadow-[2px_2px_0px_#0A0A0A]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">
                {t('admin.date_to')}
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                className="w-full px-2.5 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none transition shadow-[2px_2px_0px_#0A0A0A]"
              />
            </div>

            <div className="space-y-1" ref={sortDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">{t('admin.sorting_label')}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <span>{sortFilter === 'asc' ? t('admin.sort_oldest') : t('admin.sort_newest')}</span>
                  <ChevronDown size={14} className={`text-[#0A0A0A] transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 font-['JetBrains_Mono',monospace]">
                    {[
                      { value: 'desc', label: t('admin.sort_newest') },
                      { value: 'asc', label: t('admin.sort_oldest') },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortFilter(opt.value as 'desc' | 'asc');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-bold uppercase flex items-center justify-between hover:bg-white transition cursor-pointer ${
                          sortFilter === opt.value ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A]'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0 h-full bg-[#F2EBDD] space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]" size={15} />
                <input
                  type="text"
                  placeholder={t('admin.search_logs')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder-slate-500 focus:outline-none transition-all shadow-[2px_2px_0px_#0A0A0A]"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : (
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-['JetBrains_Mono',monospace]">
                  <thead className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black uppercase text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">{t('admin.time_col') || 'ЧАС'}</th>
                      <th className="py-3.5 px-4 text-center">{t('admin.level_col') || 'РІВЕНЬ'}</th>
                      <th className="py-3.5 px-4">{t('admin.service_col') || 'СЕРВІС'}</th>
                      <th className="py-3.5 px-4">{t('admin.message_col') || 'ПОВІДОМЛЕННЯ'}</th>
                      <th className="py-3.5 px-4">{t('admin.created_by_col') || 'КОРИСТУВАЧ'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A0A0A]/20">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-700 font-bold">
                          {t('admin.no_logs_found') || 'Записи логів не знайдено'}
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white transition">
                          <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-[#0A0A0A] whitespace-nowrap">
                            {formatEuropeanTimestamp(log.timestamp)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {log.level === 'ERROR' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-200 text-rose-950 border-2 border-[#0A0A0A]">
                                ERROR
                              </span>
                            ) : log.level === 'WARN' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-200 text-amber-950 border-2 border-[#0A0A0A]">
                                WARN
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white text-[#0A0A0A] border-2 border-[#0A0A0A]">
                                INFO
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-lg bg-white text-[#0A0A0A] font-mono text-[11px] font-black border-2 border-[#0A0A0A]">
                              [{log.service}]
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#0A0A0A] font-bold text-xs break-words max-w-md">
                            {log.message}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-bold text-xs whitespace-nowrap">
                            {log.userEmail}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] text-xs text-[#0A0A0A] font-bold">
                <div>
                  {t('admin.showing') || 'Показано'}{' '}
                  <span className="font-black text-[#0A0A0A]">{logs.length}</span>{' '}
                  {t('admin.of') || 'з'}{' '}
                  <span className="font-black text-[#0A0A0A]">{totalElements}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className="flex items-center space-x-1 px-3 py-1 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev') || 'Назад'}</span>
                  </button>

                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white border-2 border-[#0A0A0A] text-xs font-black font-mono text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                    <span>{page + 1}</span>
                    <span>/</span>
                    <span>{totalPages}</span>
                  </div>

                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center space-x-1 px-3 py-1 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                  >
                    <span>{t('admin.next') || 'Далі'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminLogsPage;
