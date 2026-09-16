import React from 'react';
import { Play, Square, Pencil, Folder as FolderIcon, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { BotResponse } from '../../../../types/bot';

interface AutomationContextMenuProps {
  bot: BotResponse;
  menuCoords: { top: number; left: number };
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onEdit: (bot: BotResponse) => void;
  onMove: (bot: BotResponse) => void;
  onDelete: (id: number) => void;
}

export const AutomationContextMenu: React.FC<AutomationContextMenuProps> = ({
  bot,
  menuCoords,
  onStart,
  onStop,
  onEdit,
  onMove,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: 'fixed',
        top: menuCoords.top,
        left: menuCoords.left,
      }}
      className="w-56 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_0px_#0A0A0A] z-[100] py-1.5 text-left font-['JetBrains_Mono',monospace]"
      onClick={(e) => e.stopPropagation()}
    >
      {!bot.blocked && (
        <>
          {bot.active ? (
            <button
              onClick={() => onStop(bot.id)}
              className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
            >
              <Square size={13} className="fill-current" />
              <span>{t('automations.menu.stop')}</span>
            </button>
          ) : (
            <button
              onClick={() => onStart(bot.id)}
              className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play size={13} className="fill-current" />
              <span>{t('automations.menu.start')}</span>
            </button>
          )}
          <button
            onClick={() => onEdit(bot)}
            className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Pencil size={13} />
            <span>{t('automations.menu.edit')}</span>
          </button>
          <button
            onClick={() => onMove(bot)}
            className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
          >
            <FolderIcon size={13} />
            <span>{t('automations.menu.move')}</span>
          </button>
          <div className="h-0.5 bg-[#0A0A0A] my-1" />
        </>
      )}
      <button
        onClick={() => onDelete(bot.id)}
        className="w-full px-4 py-2 text-xs font-black uppercase text-rose-600 hover:bg-rose-600 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
      >
        <Trash2 size={13} />
        <span>{t('automations.menu.delete')}</span>
      </button>
    </div>
  );
};
