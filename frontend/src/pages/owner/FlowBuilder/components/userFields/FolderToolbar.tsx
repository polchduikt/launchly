import React, { useState, useEffect } from 'react';
import { Plus, Folder, ChevronRight, Edit2, MoreVertical } from 'lucide-react';
import { t } from '../../../../../i18n/config';
import type { UserFieldFolder } from '../../../../../types/bot';

interface FolderToolbarProps {
  folders: UserFieldFolder[];
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onOpenNewFieldModal: () => void;
  onOpenNewFolderModal: () => void;
  onStartRenameFolder: (folder: UserFieldFolder) => void;
  onDeleteFolder: (id: string) => void;
}

export const FolderToolbar: React.FC<FolderToolbarProps> = ({
  folders,
  activeFolderId,
  onSelectFolder,
  onOpenNewFieldModal,
  onOpenNewFolderModal,
  onStartRenameFolder,
  onDeleteFolder,
}) => {
  const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);
  const activeFolder = folders.find((f) => f.id === activeFolderId);

  useEffect(() => {
    if (!activeMenuFolder) return;
    const handleClickOutside = () => setActiveMenuFolder(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuFolder]);

  return (
    <>
      <div className="p-5 flex justify-between items-center border-b-2 border-[#0A0A0A]">
        <div className="flex items-center gap-1.5 text-xs font-bold select-none">
          {activeFolderId && activeFolder ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectFolder(null)}
                className="text-slate-600 hover:text-[#0A0A0A] transition-colors cursor-pointer uppercase"
              >
                {t('settings.fields.user_fields_tab')}
              </button>
              <ChevronRight size={14} className="text-[#0A0A0A]" />
              <div className="flex items-center gap-1">
                <span className="text-[#0A0A0A] font-black">{activeFolder.name}</span>
                <button
                  type="button"
                  onClick={() => onStartRenameFolder(activeFolder)}
                  className="p-1 hover:bg-white text-[#0A0A0A] rounded-lg cursor-pointer transition-all border-2 border-transparent hover:border-[#0A0A0A]"
                >
                  <Edit2 size={11} />
                </button>
              </div>
            </div>
          ) : (
            <span className="font-['Anybody',sans-serif] text-[#0A0A0A] font-black text-sm uppercase">
              {t('settings.fields.user_fields_tab')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenNewFieldModal}
          className="px-4 py-2 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all flex items-center gap-1.5 cursor-pointer select-none"
        >
          <Plus size={14} />
          <span>{t('settings.fields.new_field_btn', 'Нове поле користувача')}</span>
        </button>
      </div>

      {!activeFolderId && (
        <div className="p-5 pb-0">
          <div className="flex flex-wrap gap-4 mb-5">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between border-2 border-[#0A0A0A] rounded-xl px-4 py-2.5 bg-white w-48 hover:bg-slate-100 transition-all relative"
              >
                <button
                  type="button"
                  onClick={() => onSelectFolder(folder.id)}
                  className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                >
                  <Folder size={16} className="text-[#0A0A0A] shrink-0" />
                  <span className="text-xs font-bold text-[#0A0A0A] truncate w-28">{folder.name}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuFolder(activeMenuFolder === folder.id ? null : folder.id);
                  }}
                  className={`p-0.5 hover:bg-[#0A0A0A] rounded cursor-pointer transition-colors ${
                    activeMenuFolder === folder.id ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A] hover:text-white'
                  }`}
                >
                  <MoreVertical size={14} />
                </button>

                {activeMenuFolder === folder.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-11 z-[100] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_0px_#0A0A0A] py-1 w-44 text-left animate-in fade-in duration-100 flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onStartRenameFolder(folder);
                        setActiveMenuFolder(null);
                      }}
                      className="w-full px-3.5 py-2 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold text-left cursor-pointer uppercase transition-colors"
                    >
                      {t('settings.fields.action_rename', 'Перейменувати')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteFolder(folder.id);
                        setActiveMenuFolder(null);
                      }}
                      className="w-full px-3.5 py-2 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer border-t-2 border-[#0A0A0A]/15 uppercase transition-colors"
                    >
                      {t('settings.fields.action_delete', 'Видалити')}
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={onOpenNewFolderModal}
              className="px-4 py-2.5 border-2 border-dashed border-[#0A0A0A] text-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white text-xs font-black uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Plus size={14} />
              <span>{t('settings.fields.new_folder_btn', 'Нова папка')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
