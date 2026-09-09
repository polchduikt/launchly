import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { t } from '../../../../../i18n/config';

interface FolderModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  placeholder?: string;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  title,
  submitLabel,
  placeholder,
  initialName = '',
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200 cursor-pointer font-['JetBrains_Mono',monospace]"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
      >
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 select-none">
          <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
            {t('settings.fields.folder_name_label')}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder || t('settings.fields.placeholder_folder_name')}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
          />
        </div>

        <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-200 select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
          >
            {t('settings.fields.btn_cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
