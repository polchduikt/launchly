import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTranslation } from '../../i18n/config';

export interface BulkActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

interface AdminBulkActionsProps {
  selectedCount: number;
  actions: BulkActionItem[];
}

export const AdminBulkActions: React.FC<AdminBulkActionsProps> = React.memo(({
  selectedCount,
  actions,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  if (selectedCount === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 px-5 py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
      >
        <span>{t('admin.bulk_actions')}</span>
        <ChevronDown
          size={14}
          className={`text-current transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1.5 overflow-hidden font-['JetBrains_Mono',monospace]">
          {actions.map((act, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                act.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-bold uppercase flex items-center space-x-2.5 transition cursor-pointer ${
                act.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-[#0A0A0A] hover:bg-white'
              }`}
            >
              {act.icon}
              <span>{act.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
