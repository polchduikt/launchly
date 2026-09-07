import React from 'react';
import { X } from 'lucide-react';
import { t } from '../../../../i18n/config';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  folderName: string;
  setFolderName: (name: string) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  folderName,
  setFolderName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer font-['JetBrains_Mono',monospace]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] rounded-3xl max-w-sm w-full border-2 border-[#0A0A0A] shadow-[8px_8px_0px_0px_#0A0A0A] overflow-hidden animate-in fade-in duration-200 cursor-default"
      >
        <div className="p-6 pb-4 border-b-2 border-[#0A0A0A] flex items-center justify-between">
          <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-[#0A0A0A]">
            {t('automations.folder.create_title')}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4 bg-white">
          <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider">
            {t('automations.folder.name_label')}
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A]"
            placeholder={t('automations.folder.placeholder')}
          />
        </div>
        <div className="p-6 pt-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] dark:text-[#E4E4E7] hover:bg-white dark:hover:bg-[#27272A] border-2 border-transparent hover:border-[#0A0A0A] dark:hover:border-[#3F3F46] rounded-xl transition-all cursor-pointer"
          >
            {t('automations.folder.cancel')}
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-[#2A2A2A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
          >
            {t('automations.folder.create')}
          </button>
        </div>
      </div>
    </div>
  );
};
