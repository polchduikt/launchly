import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminLogsApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { Terminal, Search, Filter, Loader2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { t } from '../../../i18n';

export const AdminLogsPage: React.FC = () => {
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['adminLogs', level, service, search],
    queryFn: () => fetchAdminLogsApi(level, service, search),
    refetchInterval: 5000,
  });

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={t('admin.search_logs')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50/60 border border-emerald-200/60 px-3 py-1.5 rounded-xl shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t('admin.log_streaming')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Filter size={15} className="text-slate-400" />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">{t('admin.all_levels')}</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">{t('admin.all_services')}</option>
              <option value="AUTH">AUTH</option>
              <option value="BOT_ENGINE">BOT_ENGINE</option>
              <option value="BROADCAST">BROADCAST</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden font-mono shadow-xl">
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              </div>
              <span className="font-bold text-slate-300 ml-2">launchly-system-audit.log</span>
            </div>
            <span className="font-bold">{logs.length} entries</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-bold">
              No log entries match your criteria
            </div>
          ) : (
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto text-[11px] leading-relaxed">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition border border-transparent hover:border-slate-800">
                  <span className="text-slate-500 shrink-0 select-none font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>

                  <div className="flex items-center space-x-2 shrink-0">
                    {log.level === 'ERROR' && (
                      <span className="px-2.5 py-0.5 rounded-md bg-red-950/80 border border-red-800 text-red-400 font-bold flex items-center gap-1 text-[10px]">
                        <AlertCircle size={11} /> ERROR
                      </span>
                    )}
                    {log.level === 'WARN' && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-950/80 border border-amber-800 text-amber-300 font-bold flex items-center gap-1 text-[10px]">
                        <AlertTriangle size={11} /> WARN
                      </span>
                    )}
                    {log.level === 'INFO' && (
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-bold flex items-center gap-1 text-[10px]">
                        <Info size={11} /> INFO
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                      [{log.service}]
                    </span>
                  </div>

                  <span className="text-slate-200 flex-1 break-words font-medium">{log.message}</span>

                  <span className="text-slate-500 text-[10px] shrink-0 font-sans font-semibold">
                    {log.userEmail}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogsPage;
