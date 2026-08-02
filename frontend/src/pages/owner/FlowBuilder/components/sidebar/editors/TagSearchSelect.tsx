import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { t } from '../../../../../../i18n/config';

type TagOption = { id: number | string; name: string; botId?: number };

export interface TagSearchSelectProps {
  tagName: string;
  tags: TagOption[];
  onChange: (tag: TagOption) => void;
  onCreateTag: () => void;
  assignedTags?: string[];
}

export const TagSearchSelect: React.FC<TagSearchSelectProps> = ({
  tagName,
  tags,
  onChange,
  onCreateTag,
  assignedTags = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const filteredTags = tags.filter(tag => tag.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full font-['JetBrains_Mono',monospace]" ref={dropdownRef}>
      <input
        type="text"
        placeholder={t('crm.tags.placeholder_select_or_search')}
        value={isOpen ? search : (tagName || '')}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] focus:outline-none text-xs font-bold bg-white text-[#0A0A0A] placeholder:text-slate-500"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_0px_#0A0A0A] z-50 p-1.5 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              onCreateTag();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={12} />
            <span>{t('crm.tags.create_new_tag')}</span>
          </button>

          {filteredTags.map((tag) => {
            const isAssigned = assignedTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                disabled={isAssigned}
                onClick={() => {
                  if (!isAssigned) {
                    onChange(tag);
                    setIsOpen(false);
                    setSearch('');
                  }
                }}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-between ${
                  isAssigned
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'hover:bg-[#F2EBDD] text-[#0A0A0A] cursor-pointer'
                }`}
              >
                <span>{tag.name}</span>
                {isAssigned && (
                  <span className="text-[9px] bg-white text-[#0A0A0A] border border-[#0A0A0A] px-1.5 py-0.5 rounded font-black uppercase">
                    {t('crm.tags.added_label')}
                  </span>
                )}
              </button>
            );
          })}
          {filteredTags.length === 0 && search.trim() !== '' && (
            <button
              type="button"
              onClick={() => {
                onCreateTag();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-slate-500 italic text-xs font-bold cursor-pointer"
            >
              {t('crm.tags.no_match_create', { search })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
