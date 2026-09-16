import React from 'react';
import {
  Users,
  Activity,
  MessageSquare,
  Bot,
  Workflow,
  Send,
  UserCheck,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { AdminStats } from '../../../../api/admin';

interface MetricsOverviewCardsProps {
  stats: AdminStats | undefined;
  isManager: boolean;
}

const formatUptime = (totalSeconds: number = 0) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const MetricsOverviewCards: React.FC<MetricsOverviewCardsProps> = ({ stats, isManager }) => {
  const { t } = useTranslation();

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 ${isManager ? 'xl:grid-cols-7' : 'xl:grid-cols-8'} gap-4`}>
      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.site_owners')}</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <Users size={15} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalOwners ?? stats?.totalUsers ?? 0}</div>
          <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
            {stats?.totalOwnersChange}
          </span>
        </div>
        <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
          <TrendingUp size={11} className="mr-1 shrink-0" />
          <span className="truncate">{t('admin.registered_site_users')}</span>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.active_owners')}</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <Activity size={15} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-[#0A0A0A]">{stats?.activeOwners ?? stats?.totalUsers ?? 0}</div>
          <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
            {stats?.activeOwnersChange}
          </span>
        </div>
        <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
          <span className="truncate">{t('admin.active_site_users')}</span>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.bot_clients')}</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <MessageSquare size={15} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalBotUsers ?? 0}</div>
          <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
            {stats?.totalBotUsersChange}
          </span>
        </div>
        <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
          <span className="truncate">{t('admin.end_telegram_users')}</span>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.active_bots')}</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <Bot size={15} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-[#0A0A0A]">{stats?.activeBots || 0}</div>
          <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
            {stats?.activeBotsChange}
          </span>
        </div>
        <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
          <span className="truncate">{t('admin.connected_telegram')}</span>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.total_automations')}</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <Workflow size={15} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalAutomations || 0}</div>
          <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
            {stats?.totalAutomationsChange}
          </span>
        </div>
        <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
          <span className="truncate">{t('admin.flow_schemas')}</span>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.messages_sent')}</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <Send size={15} />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-[#0A0A0A]">{stats?.totalMessagesSent || 0}</div>
          <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
            {stats?.totalMessagesSentChange}
          </span>
        </div>
        <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
          <span className="truncate">{t('admin.broadcasts_chats')}</span>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.active_managers')}</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <UserCheck size={15} />
          </div>
        </div>
        <div className="text-2xl font-black text-[#0A0A0A]">{stats?.activeManagers || 0}</div>
        <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
          <span className="truncate">{t('admin.support_staff')}</span>
        </div>
      </div>

      {!isManager && (
        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-4 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
          <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">{t('admin.system_uptime')}</span>
            <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
              <Clock size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A0A0A]">{formatUptime(stats?.systemUptimeSeconds)}</div>
          <div className="text-[10px] text-[#0A0A0A] font-bold flex items-center mt-2 truncate">
            <span className="truncate">{t('admin.online_status')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
