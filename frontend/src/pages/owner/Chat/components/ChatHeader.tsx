import React from 'react';
import { Search, Settings2, X } from 'lucide-react';
import { t } from '../../../../i18n/config';

interface ChatHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenSettings?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ searchQuery, onSearchChange, onOpenSettings }) => {
  return (
    <header className="h-[56px] min-h-[56px] border-b-2 border-[#0A0A0A] flex items-center justify-between px-6 bg-[#F2EBDD] shrink-0 font-['JetBrains_Mono',monospace]">
      <div className="font-['Anybody',sans-serif] text-xl font-black uppercase text-[#0A0A0A] tracking-tight">{t('common.nav.chat')}</div>
      <div className="w-[400px] relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#0A0A0A]" />
        <input
          type="text"
          placeholder={t('common.search_placeholder')}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold focus:outline-none placeholder:text-slate-500 text-[#0A0A0A]"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-2.5 text-[#0A0A0A] hover:opacity-70 cursor-pointer">
            <X size={14} />
          </button>
        )}
      </div>
      <button
        onClick={onOpenSettings}
        title="Notification settings"
        className="p-2 border-2 border-[#0A0A0A] rounded-xl text-[#0A0A0A] hover:bg-white cursor-pointer transition-all bg-white"
      >
        <Settings2 size={16} />
      </button>
    </header>
  );
};
