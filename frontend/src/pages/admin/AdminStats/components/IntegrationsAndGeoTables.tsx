import React from 'react';
import { Workflow, Users } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { AdminStats } from '../../../../api/admin';

interface IntegrationsAndGeoTablesProps {
  stats: AdminStats | undefined;
}

export const IntegrationsAndGeoTables: React.FC<IntegrationsAndGeoTablesProps> = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0A0A0A;
          border-radius: 4px;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                <Workflow size={18} className="text-[#0A0A0A]" />
                <span>{t('admin.integrations_title')}</span>
              </h3>
              <div className="flex items-center space-x-2 text-[#0A0A0A]">
                <button className="px-2.5 py-1 bg-white border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer">
                  <span>{t('admin.explore_more')}</span>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[275px] pr-1.5 custom-scrollbar">
              <table className="w-full text-xs font-bold text-[#0A0A0A]">
                <thead>
                  <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase tracking-wider text-left sticky top-0 bg-[#F2EBDD] z-10">
                    <th className="pb-3 w-1/2 bg-[#F2EBDD] sticky top-0">{t('admin.name_col')}</th>
                    <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.usage_col')}</th>
                    <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.change_pct_col')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/20">
                  {stats?.integrationsPopularity?.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="py-3 flex items-center space-x-2.5">
                          <span className="w-2 h-2 rounded-full border border-[#0A0A0A]" style={{ backgroundColor: idx === 0 ? '#10b981' : idx === 1 ? '#6366f1' : idx === 2 ? '#f59e0b' : idx === 3 ? '#ef4444' : '#64748b' }} />
                          <span className="text-[#0A0A0A] font-black">{item.name}</span>
                        </td>
                        <td className="py-3 text-right text-[#0A0A0A] font-mono font-black">
                          {item.count.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-[#0A0A0A]">
                              {item.change}
                            </span>
                            <span className="text-[9px] font-bold text-slate-700">
                              {item.percentage}% {t('admin.of_total')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col justify-between text-[#0A0A0A]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                <Users size={18} className="text-[#0A0A0A]" />
                <span>{t('admin.client_geo_title')}</span>
              </h3>
              <div className="flex items-center space-x-2 text-[#0A0A0A]">
                <button className="px-2.5 py-1 bg-white border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer">
                  <span>{t('admin.explore_more')}</span>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[275px] pr-1.5 custom-scrollbar">
              <table className="w-full text-xs font-bold text-[#0A0A0A]">
                <thead>
                  <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase tracking-wider text-left sticky top-0 bg-[#F2EBDD] z-10">
                    <th className="pb-3 w-1/2 bg-[#F2EBDD] sticky top-0">{t('admin.country_col')}</th>
                    <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.subscribers_col')}</th>
                    <th className="pb-3 text-right bg-[#F2EBDD] sticky top-0">{t('admin.change_pct_col')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/20">
                  {stats?.geographyAndLanguages?.map((item, idx) => {
                    const countryNameMap: Record<string, string> = {
                      'Ukraine': t('admin.country_ukraine'),
                      'United States': t('admin.country_usa'),
                      'Poland': t('admin.country_poland'),
                      'Germany': t('admin.country_germany'),
                      'Other': t('admin.country_other'),
                    };
                    return (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="py-3 flex items-center space-x-2.5">
                          <span className="w-2 h-2 rounded-full border border-[#0A0A0A]" style={{ backgroundColor: item.name === 'Ukraine' ? '#0284c7' : item.name === 'United States' ? '#ef4444' : item.name === 'Poland' ? '#d946ef' : item.name === 'Germany' ? '#10b981' : '#64748b' }} />
                          <span className="text-[#0A0A0A] font-black">
                            {countryNameMap[item.name] || item.name}
                          </span>
                        </td>
                        <td className="py-3 text-right text-[#0A0A0A] font-mono font-black">
                          {item.count.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-[#0A0A0A]">
                              {item.change}
                            </span>
                            <span className="text-[9px] font-bold text-slate-700">
                              {item.percentage}% {t('admin.of_total')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
