import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminLogsApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { t } from '../../../i18n';

export const AdminLogsPage: React.FC = () => {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
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
    setPage(0);
  }, [levelFilter, serviceFilter, sortFilter]);

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
    queryKey: ['adminLogs', levelFilter, serviceFilter, debouncedSearch, sortFilter, page],
    queryFn: () => fetchAdminLogsApi(levelFilter, serviceFilter, debouncedSearch, sortFilter, page, 100),
  });

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
    <AdminLayout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('admin.search_logs')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs transition-all"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-auto flex justify-end" ref={levelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between space-x-2.5 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
              >
                <span>{getLevelLabel(levelFilter)}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isLevelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLevelDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setLevelFilter(opt.value);
                        setIsLevelDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        levelFilter === opt.value ? 'text-indigo-600 bg-indigo-50/50 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative w-full sm:w-auto flex justify-end" ref={serviceDropdownRef}>
              <button
                type="button"
                onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between space-x-2.5 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
              >
                <span>{getServiceLabel(serviceFilter)}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isServiceDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {serviceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setServiceFilter(opt.value);
                        setIsServiceDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        serviceFilter === opt.value ? 'text-indigo-600 bg-indigo-50/50 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative w-full sm:w-auto flex justify-end" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between space-x-2.5 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
              >
                <span>{sortFilter === 'asc' ? (t('admin.sort_oldest') || 'Спочатку старі') : (t('admin.sort_newest') || 'Спочатку нові')}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {[
                    { value: 'desc', label: t('admin.sort_newest') || 'Спочатку нові' },
                    { value: 'asc', label: t('admin.sort_oldest') || 'Спочатку старі' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortFilter(opt.value as 'desc' | 'asc');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        sortFilter === opt.value ? 'text-indigo-600 bg-indigo-50/50 font-bold' : 'text-slate-700'
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

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 flex items-center justify-center shadow-sm">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-5">{t('admin.time_col') || 'ЧАС'}</th>
                    <th className="py-4 px-5 text-center">{t('admin.level_col') || 'РІВЕНЬ'}</th>
                    <th className="py-4 px-5">{t('admin.service_col') || 'СЕРВІС'}</th>
                    <th className="py-4 px-5">{t('admin.message_col') || 'ПОВІДОМЛЕННЯ'}</th>
                    <th className="py-4 px-5">{t('admin.created_by_col') || 'КОРИСТУВАЧ'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                        {t('admin.no_logs_found') || 'Записи логів не знайдено'}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5 font-mono text-[11px] font-medium text-slate-500 whitespace-nowrap">
                          {formatEuropeanTimestamp(log.timestamp)}
                        </td>
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          {log.level === 'ERROR' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              ERROR
                            </span>
                          ) : log.level === 'WARN' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              WARN
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                              INFO
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                            [{log.service}]
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-800 font-medium text-xs break-words max-w-md">
                          {log.message}
                        </td>
                        <td className="py-4 px-5 text-slate-500 font-medium text-xs whitespace-nowrap">
                          {log.userEmail}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 font-medium">
                <div>
                  {t('admin.showing') || 'Показано'}{' '}
                  <span className="font-bold text-slate-900">{logs.length}</span>{' '}
                  {t('admin.of') || 'з'}{' '}
                  <span className="font-bold text-slate-900">{totalElements}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className="flex items-center space-x-1 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev') || 'Назад'}</span>
                  </button>

                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono text-slate-800 shadow-2xs">
                    <span className="text-indigo-600">{page + 1}</span>
                    <span className="text-slate-400">/</span>
                    <span>{totalPages}</span>
                  </div>

                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center space-x-1 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    <span>{t('admin.next') || 'Далі'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogsPage;
