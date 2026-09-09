import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { t } from '../../../../../i18n/config';
import type { UserField } from '../../../../../types/bot';
import { customFieldSchema } from '../../../../../schemas';
import { CustomSelect } from '../../../../../components/ui/CustomSelect';

interface FieldModalProps {
  isOpen: boolean;
  initialField?: UserField | null;
  activeFolderId?: string | null;
  onClose: () => void;
  onSave: (field: UserField) => void;
}

export const FieldModal: React.FC<FieldModalProps> = ({
  isOpen,
  initialField,
  activeFolderId,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Text');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialField) {
      setName(initialField.name);
      setType(initialField.type || 'Text');
      setValue(initialField.value || '');
      setDescription(initialField.description || '');
    } else {
      setName('');
      setType('Text');
      setValue('');
      setDescription('');
    }
  }, [initialField, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const fieldData: UserField = {
      name: name.trim(),
      type,
      value: value.trim(),
      description: description.trim(),
      folder: initialField ? (initialField.folder ?? activeFolderId) : activeFolderId,
    };

    const validation = customFieldSchema.safeParse(fieldData);
    if (!validation.success) return;

    onSave(fieldData);
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
            {initialField
              ? t('settings.fields.edit_field_title', 'Редагувати поле користувача')
              : t('settings.fields.create_field_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
              {t('settings.fields.name_label')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.fields.placeholder_field_name')}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
              {t('settings.fields.type_label')}
            </label>
            <CustomSelect
              value={type}
              onChange={setType}
              options={[
                { value: 'Text', label: t('settings.fields.type_text') },
                { value: 'Number', label: t('settings.fields.type_number') },
                { value: 'Date', label: t('settings.fields.type_date') },
                { value: 'Boolean', label: t('settings.fields.type_boolean') },
              ]}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
              {t('settings.fields.value_label', "Значення (необов'язково)")}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('settings.fields.placeholder_value', 'Введіть значення поля')}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
              {t('settings.fields.desc_label')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('settings.fields.placeholder_desc')}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
            />
          </div>
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
            {initialField ? t('settings.fields.btn_save') : t('settings.fields.btn_create_field')}
          </button>
        </div>
      </form>
    </div>
  );
};
