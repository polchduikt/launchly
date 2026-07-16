import React from 'react';
import { Search, Settings2, X } from 'lucide-react';
import { t } from '../../../i18n';

interface ChatHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <header className="h-[56px] min-h-[56px] border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
      <div className="text-xl font-bold text-slate-800">{t('common.nav.chat')}</div>
      <div className="w-[400px] relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('common.search_placeholder')}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={14} />
          </button>
        )}
      </div>
      <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer">
        <Settings2 size={16} />
      </button>
    </header>
  );
};
