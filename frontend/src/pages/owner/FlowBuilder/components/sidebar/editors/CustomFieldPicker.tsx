import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useCustomFieldsQuery, useSaveCustomFieldsMutation } from '../../../../../../hooks/bot/useCustomFieldsQuery';
import { CreateFieldModal } from './action/CreateFieldModal';
import { t } from '../../../../../../i18n/config';

export interface UserFieldItem {
  name: string;
  type: string;
  description?: string;
  folder?: string;
}

export interface CustomFieldPickerProps {
  value: string;
  onChange: (fieldName: string) => void;
  placeholder?: string;
  accentColor?: 'cyan' | 'fuchsia' | 'emerald' | 'indigo' | 'amber';
}

export const CustomFieldPicker: React.FC<CustomFieldPickerProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: customFieldsData } = useCustomFieldsQuery(activeBotId);
  const saveCustomFieldsMutation = useSaveCustomFieldsMutation(activeBotId);

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFields, setUserFields] = useState<UserFieldItem[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customFieldsData && typeof customFieldsData === 'object') {
      const list = Array.isArray(customFieldsData.fields)
        ? customFieldsData.fields
        : Array.isArray(customFieldsData)
          ? customFieldsData
          : [];
      setUserFields(
        list.map((f: unknown) => {
          const item = f as { name?: string; type?: string; description?: string; folder?: string } | string;
          return {
            name: typeof item === 'string' ? item : item?.name || '',
            type: typeof item === 'string' ? 'Text' : item?.type || 'Text',
            description: typeof item === 'string' ? '' : item?.description || '',
            folder: typeof item === 'string' ? 'User Fields' : item?.folder || 'User Fields',
          };
        }).filter((f: UserFieldItem) => Boolean(f.name) && !f.name.toLowerCase().includes('cooldown'))
      );
    }
  }, [customFieldsData]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCreateField = (newField: { name: string; type: string; description: string; folder?: string }) => {
    if (!activeBotId) return;
    const updated = [...userFields.filter((f) => f.name !== newField.name), newField];
    setUserFields(updated);
    saveCustomFieldsMutation.mutate({ fields: updated });
    onChange(newField.name);
    setIsModalOpen(false);
    setIsOpen(false);
  };

  const filteredFields = useMemo(() => {
    if (!searchTerm.trim()) return userFields;
    const q = searchTerm.toLowerCase().trim();
    return userFields.filter((f) => f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q)));
  }, [userFields, searchTerm]);

  return (
    <div ref={containerRef} className="relative w-full font-['JetBrains_Mono',monospace]">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-[#F2EBDD]/30"
      >
        <div className="flex items-center gap-2 min-w-0">
          {value ? (
            <span className="text-xs font-black text-[#0A0A0A] truncate">{value}</span>
          ) : (
            <span className="text-xs font-bold text-[#0A0A0A]/40 select-none">
              {placeholder || t('node.field_picker.placeholder', 'Оберіть поле користувача...')}
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`text-[#0A0A0A] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_0px_#0A0A0A] z-50 p-2.5 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setIsOpen(false);
            }}
            className="w-full py-2 px-3 rounded-xl border-2 border-[#0A0A0A] bg-[#0A0A0A] text-[#F2EBDD] hover:bg-white hover:text-[#0A0A0A] text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
          >
            <Plus size={13} />
            <span>{t('node.field_picker.create_new', 'Створити нове поле користувача')}</span>
          </button>

          {userFields.length > 5 && (
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('node.field_picker.search', 'Пошук полів...')}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold text-[#0A0A0A] bg-white focus:outline-none"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-[#0A0A0A]/60" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-[#0A0A0A]/60 hover:text-[#0A0A0A] cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-0.5">
            {filteredFields.length === 0 ? (
              <div className="py-3 text-center text-xs font-bold text-[#0A0A0A]/50 select-none">
                {userFields.length === 0
                  ? t('node.field_picker.empty', 'Немає створених полів')
                  : t('node.field_picker.not_found', 'Полів не знайдено')}
              </div>
            ) : (
              filteredFields.map((field) => {
                const isSelected = field.name === value;
                return (
                  <button
                    key={field.name}
                    type="button"
                    onClick={() => {
                      onChange(field.name);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between transition-all cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] font-black'
                        : 'bg-white hover:bg-[#F2EBDD] text-[#0A0A0A] border-transparent hover:border-[#0A0A0A] font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs truncate">{field.name}</span>
                      {field.description && (
                        <span className="text-[10px] opacity-60 truncate">({field.description})</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <CreateFieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateField={handleCreateField}
      />
    </div>
  );
};