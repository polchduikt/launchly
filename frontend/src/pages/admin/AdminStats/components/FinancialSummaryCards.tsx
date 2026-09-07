import React from 'react';
import { TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { AdminStats, PlanDistribution } from '../../../../api/admin';

interface FinancialSummaryCardsProps {
  stats: AdminStats | undefined;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({ stats }) => {
  const { t } = useTranslation();

  const renderPlanDoughnut = (distribution: PlanDistribution[] = []) => {
    const total = distribution.reduce((sum, item) => sum + (item.value || 0), 0);
    if (total === 0) {
      return (
        <div className="flex items-center justify-center h-28 text-xs font-bold text-slate-400 w-full">
          Немає активних підписок
        </div>
      );
    }

    let accumulatedPercentage = 0;
    const radius = 38;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="flex items-center justify-between gap-6 w-full h-28">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="9"
            />
            {distribution.map((item, idx) => {
              if (item.value === 0) return null;

              const percentage = item.value / total;
              const strokeLength = percentage * circumference;
              const strokeOffset = -accumulatedPercentage * circumference;
              accumulatedPercentage += percentage;

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="9"
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none leading-none">
            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
              {t('admin.total') || 'Всього'}
            </span>
            <span className="text-sm font-black text-slate-800">
              {total}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-full max-h-24 overflow-y-auto pr-1">
          {distribution.map((item, idx) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-slate-400 shrink-0 ml-1.5 font-mono text-[10px]">
                  {item.value} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-5 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between h-40 text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">MRR</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <TrendingUp size={15} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between leading-none">
            <div className="text-2xl font-black text-[#0A0A0A]">
              ${(stats?.mrr ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
              {stats?.mrrChange}
            </span>
          </div>
          <div className="text-[10px] text-slate-700 font-bold mt-2.5">
            {t('admin.mrr_description')}
          </div>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-5 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between h-40 text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">LTV</span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <DollarSign size={15} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between leading-none">
            <div className="text-2xl font-black text-[#0A0A0A]">
              ${(stats?.ltv ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-2 py-0.5 rounded-lg font-mono shrink-0">
              {stats?.ltvChange}
            </span>
          </div>
          <div className="text-[10px] text-slate-700 font-bold mt-2.5">
            {t('admin.ltv_description')}
          </div>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] p-5 rounded-3xl shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between h-40 text-[#0A0A0A]">
        <div className="flex items-center justify-between text-[#0A0A0A] mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider">
            {t('admin.plan_distribution')}
          </span>
          <div className="p-1.5 rounded-xl bg-white border border-[#0A0A0A] text-[#0A0A0A]">
            <CreditCard size={15} />
          </div>
        </div>
        {renderPlanDoughnut(stats?.planDistribution)}
      </div>
    </div>
  );
};
