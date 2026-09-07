import React from 'react';
import { FolderOpen, Folder as FolderIcon, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { Folder } from '../../../../types/bot';

interface AutomationsSidebarProps {
  folders: Folder[];
  selectedFolderId: string | number | null;
  onSelectFolder: (id: string | number | null) => void;
  onDeleteFolder: (id: string | number) => void;
  getFolderBotCount: (folderId: string | number | null) => number;
}

export const AutomationsSidebar: React.FC<AutomationsSidebarProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onDeleteFolder,
  getFolderBotCount,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="w-60 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] p-4 shrink-0 hidden md:block self-stretch">
      <h2 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-4 px-2 font-['Anybody',sans-serif]">
        {t('automations.sidebar.title')}
      </h2>
      <nav className="space-y-1">
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-black uppercase text-left transition-all ${
            selectedFolderId === null
              ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
              : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
          }`}
        >
          {t('automations.sidebar.my_automations')}
        </button>
      </nav>

      <div className="mt-8">
        <div className="flex items-center justify-between px-2 mb-2 text-xs font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
          <span>{t('automations.sidebar.folders')}</span>
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase text-left transition-all ${
              selectedFolderId === null
                ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
            }`}
          >
            <div className="flex items-center">
              <FolderOpen size={14} className="mr-2 shrink-0" />
              <span>{t('automations.sidebar.all_automations')}</span>
            </div>
            <span className="text-[10px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-1.5 py-0.5 rounded-md">
              {getFolderBotCount(null)}
            </span>
          </button>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group flex items-center justify-between w-full rounded-xl transition-all"
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className={`flex-1 flex items-center px-3 py-2.5 rounded-xl text-xs font-black uppercase text-left transition-all truncate ${
                  selectedFolderId === folder.id
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                    : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
                }`}
              >
                <FolderIcon size={14} className="mr-2 shrink-0" />
                <span className="truncate mr-1">{folder.name}</span>
                <span className="ml-auto text-[10px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-1.5 py-0.5 rounded-md">
                  {getFolderBotCount(folder.id)}
                </span>
              </button>
              <button
                onClick={() => onDeleteFolder(folder.id)}
                className="p-2 text-[#0A0A0A] hover:bg-rose-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-lg shrink-0 border border-transparent hover:border-[#0A0A0A]"
                title={t('automations.sidebar.delete_folder')}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
