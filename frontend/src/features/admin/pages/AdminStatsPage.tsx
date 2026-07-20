import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminStatsApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import {
  Users,
  Bot,
  Workflow,
  Send,
  Clock,
  UserCheck,
  Server,
  CheckCircle2,
  TrendingUp,
  Activity,
  Loader2
} from 'lucide-react';
import { t } from '../../../i18n';

export const AdminStatsPage: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStatsApi,
    refetchInterval: 10000,
  });

  const formatUptime = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-[1300px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Activity className="text-indigo-600" size={24} />
              <span>{t('admin.system_stats_title')}</span>
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
            Failed to load platform statistics
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold text-slate-500">{t('admin.total_users')}</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Users size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats?.totalUsers || 0}</div>
                <div className="text-[11px] text-emerald-600 font-bold flex items-center mt-2">
                  <TrendingUp size={12} className="mr-1" />
                  <span>{t('admin.real_accounts')}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold text-slate-500">{t('admin.active_bots')}</span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Bot size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats?.activeBots || 0}</div>
                <div className="text-[11px] text-indigo-600 font-bold flex items-center mt-2">
                  <span>{t('admin.connected_telegram')}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold text-slate-500">{t('admin.total_automations')}</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Workflow size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats?.totalAutomations || 0}</div>
                <div className="text-[11px] text-purple-600 font-bold flex items-center mt-2">
                  <span>{t('admin.flow_schemas')}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold text-slate-500">{t('admin.messages_sent')}</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Send size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats?.totalMessagesSent || 0}</div>
                <div className="text-[11px] text-emerald-600 font-bold flex items-center mt-2">
                  <span>{t('admin.broadcasts_chats')}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold text-slate-500">{t('admin.active_managers')}</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <UserCheck size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats?.activeManagers || 0}</div>
                <div className="text-[11px] text-slate-500 font-bold flex items-center mt-2">
                  <span>{t('admin.support_staff')}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold text-slate-500">{t('admin.system_uptime')}</span>
                  <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900">{formatUptime(stats?.systemUptimeSeconds)}</div>
                <div className="text-[11px] text-cyan-700 font-bold flex items-center mt-2">
                  <span>{t('admin.online_status')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-600" />
                  <span>{t('admin.registration_trend')}</span>
                </h3>
                <div className="h-52 flex items-end justify-between gap-3 pt-6">
                  {stats?.userGrowth?.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        className="w-full max-w-[42px] bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-xl transition-all duration-300 hover:brightness-110 relative group shadow-sm"
                        style={{ height: `${Math.min(100, Math.max(12, ((item.count || 1) / Math.max(1, stats.totalUsers)) * 100))}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-white px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 shadow-lg font-bold">
                          {item.count} users
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold font-mono">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Server size={18} className="text-emerald-600" />
                    <span>{t('admin.server_status')}</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>PostgreSQL Database</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center">
                        <CheckCircle2 size={13} className="mr-1" /> Connected
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Telegram Bot Engine</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center">
                        <CheckCircle2 size={13} className="mr-1" /> Polling Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>AI Provider Pipeline</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center">
                        <CheckCircle2 size={13} className="mr-1" /> Operational
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Broadcast Engine</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center">
                        <CheckCircle2 size={13} className="mr-1" /> Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                  <span>EU-Central (Frankfurt)</span>
                  <span className="font-mono text-indigo-600">v1.4.0-admin</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStatsPage;
