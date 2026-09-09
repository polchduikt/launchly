import React from 'react';
import { X } from 'lucide-react';
import { CustomSelect } from '../../../../components/ui/CustomSelect';
import { useTranslation } from '../../../../i18n/config';
import type { Folder } from '../../../../types/bot';

interface MoveAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  folders: Folder[];
  tempFolderId: string;
  setTempFolderId: (id: string) => void;
}

export const MoveAutomationModal: React.FC<MoveAutomationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  folders,
  tempFolderId,
  setTempFolderId,
}) => {
  const { t } = useTranslation();
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
            {t('automations.move_modal.title')}
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
            {t('automations.move_modal.select_folder')}
          </label>
          <CustomSelect
            value={tempFolderId}
            onChange={(val) => setTempFolderId(val)}
            options={[
              { value: '', label: t('automations.move_modal.no_folder') },
              ...folders.map((f) => ({ value: String(f.id), label: f.name })),
            ]}
          />
        </div>
        <div className="p-6 pt-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
          >
            {t('automations.move_modal.cancel')}
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-xs font-black uppercase text-white bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
          >
            {t('automations.move_modal.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
