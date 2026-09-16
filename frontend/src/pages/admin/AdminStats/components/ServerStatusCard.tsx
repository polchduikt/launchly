import React from 'react';
import { Server, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { AdminStats } from '../../../../api/admin';

interface ServerStatusCardProps {
  stats: AdminStats | undefined;
}

export const ServerStatusCard: React.FC<ServerStatusCardProps> = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
      <div>
        <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] mb-6 flex items-center gap-2">
          <Server size={18} className="text-[#0A0A0A]" />
          <span>{t('admin.server_status')}</span>
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
              <span className={`w-2.5 h-2.5 rounded-full border border-[#0A0A0A] ${stats?.serverHealth?.dbHealthy !== false ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
              <span>PostgreSQL Database</span>
            </div>
            <span className={`text-[11px] font-mono font-black uppercase flex items-center ${stats?.serverHealth?.dbHealthy !== false ? 'text-emerald-700' : 'text-rose-700'}`}>
              <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.dbStatus || 'Connected'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
              <span className={`w-2.5 h-2.5 rounded-full border border-[#0A0A0A] ${stats?.serverHealth?.telegramHealthy !== false ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>Telegram Bot Engine</span>
            </div>
            <span className="text-[11px] font-mono font-black uppercase text-emerald-700 flex items-center">
              <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.telegramStatus || 'Polling Active'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
              <span className="w-2.5 h-2.5 rounded-full border border-[#0A0A0A] bg-emerald-400"></span>
              <span>AI Provider Pipeline</span>
            </div>
            <span className="text-[11px] font-mono font-black uppercase text-emerald-700 flex items-center">
              <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.aiStatus || 'Operational'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0A0A0A]">
              <span className="w-2.5 h-2.5 rounded-full border border-[#0A0A0A] bg-emerald-400"></span>
              <span>Broadcast Engine</span>
            </div>
            <span className="text-[11px] font-mono font-black uppercase text-emerald-700 flex items-center">
              <CheckCircle2 size={13} className="mr-1" /> {stats?.serverHealth?.broadcastStatus || 'Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t-2 border-[#0A0A0A] text-[11px] font-black uppercase text-[#0A0A0A] flex items-center justify-between">
        <span>EU-Central (Frankfurt)</span>
        <span className="font-mono text-[#0A0A0A]">v1.4.0-admin</span>
      </div>
    </div>
  );
};
