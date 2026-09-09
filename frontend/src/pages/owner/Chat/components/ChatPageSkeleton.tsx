import React from 'react';
import { DashboardLayout } from '../../../../components/layout/DashboardLayout';
import { ConversationListSkeleton } from '../../../../components/common/Skeleton';
import { useTranslation } from '../../../../i18n/config';
import { Search, Settings2 } from 'lucide-react';

export const ChatPageSkeleton: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col bg-[#F2EBDD] font-['Geist',sans-serif] overflow-hidden w-full max-w-full">
        <header className="h-16 border-b-2 border-[#0A0A0A] flex items-center justify-between px-6 bg-[#F2EBDD] shrink-0">
          <h1 className="font-['Anybody',sans-serif] text-2xl font-black uppercase text-[#0A0A0A] tracking-tight select-none">
            {t('common.nav.chat', 'Чат')}
          </h1>
          <div className="w-[400px] relative opacity-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#0A0A0A]" />
            <div className="w-full h-8 bg-white border-2 border-[#0A0A0A] rounded-xl" />
          </div>
          <div className="p-2 border-2 border-[#0A0A0A] rounded-xl bg-white text-[#0A0A0A] opacity-60">
            <Settings2 size={16} />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden w-full">
          <div className="w-[200px] border-r-2 border-[#0A0A0A] flex flex-col bg-[#F2EBDD] shrink-0 p-3 space-y-2">
            <div className="h-9 w-full rounded-xl bg-[#0A0A0A]/10 animate-pulse" />
            <div className="h-9 w-full rounded-xl bg-[#0A0A0A]/5 animate-pulse" />
            <div className="h-9 w-full rounded-xl bg-[#0A0A0A]/5 animate-pulse" />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-12 border-b-2 border-[#0A0A0A] bg-[#F2EBDD] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-24 h-7 bg-white border-2 border-[#0A0A0A] rounded-lg animate-pulse" />
                <div className="w-24 h-7 bg-white border-2 border-[#0A0A0A] rounded-lg animate-pulse" />
              </div>
              <div className="w-32 h-7 bg-white border-2 border-[#0A0A0A] rounded-lg animate-pulse" />
            </div>

            <div className="flex-1 flex overflow-hidden w-full">
              <div className="w-[320px] border-r-2 border-[#0A0A0A] bg-[#F2EBDD] overflow-hidden flex flex-col">
                <ConversationListSkeleton />
              </div>
              <div className="flex-1 flex flex-col min-w-0 bg-[#F2EBDD] overflow-hidden" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
