import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { FieldVariableSelector } from './FieldVariableSelector';
import type { SetUserFieldPopoverProps } from '../../../../../types/bot';

export const SetUserFieldPopover: React.FC<SetUserFieldPopoverProps> = ({
  fieldName,
  fieldValue,
  userFields,
  tags,
  onClose,
  onSave,
  onCreateNewField,
  hideValue = false
}) => {
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [tempValue, setTempValue] = useState(fieldValue);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        if (!hideValue) {
          onSave({ fieldValue: tempValue });
        }
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [tempValue, onSave, onClose, hideValue]);

  const selectedField = userFields.find(f => f.name === fieldName);
  const selectedType = selectedField?.type || 'Text';

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Number': return <span className="text-[10px] font-extrabold text-blue-500 bg-blue-50 px-1 py-0.5 rounded border border-blue-100 shrink-0 select-none">#</span>;
      case 'Boolean': return <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 shrink-0 select-none">Y/N</span>;
      default: return <span className="text-[10px] font-extrabold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 shrink-0 select-none">T</span>;
    }
  };

  const customFieldsNames = userFields.map(f => f.name);

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 mt-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl w-72 flex flex-col gap-3.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800"
    >
      <div className="space-y-1.5 relative">
        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
          User Field
        </label>
        <div
          onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl hover:border-slate-350 bg-white flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            {fieldName ? (
              <>
                {getTypeIcon(selectedType)}
                <span className="text-xs font-bold text-slate-700">{fieldName}</span>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-semibold select-none">Select Field</span>
            )}
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>

        {isFieldDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
          >
            <button
              type="button"
              onClick={() => {
                onCreateNewField();
                setIsFieldDropdownOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus size={12} />
              <span>Create New User Field</span>
            </button>

            {userFields.map((field) => (
              <button
                key={field.name}
                type="button"
                onClick={() => {
                  onSave({ fieldName: field.name });
                  setIsFieldDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
              >
                {getTypeIcon(field.type)}
                <span>{field.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!hideValue && (
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
            Value
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSave({ fieldValue: tempValue });
                  onClose();
                }
              }}
              placeholder="Enter value or variable"
              className="w-full pl-3 pr-10 py-2 border border-slate-200 focus:outline-none focus:border-indigo-400 text-xs font-bold rounded-xl bg-white"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {tempValue && (
                <button
                  type="button"
                  onClick={() => setTempValue('')}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
              <FieldVariableSelector
                mode="variable"
                tags={tags}
                customFields={customFieldsNames}
                onSelect={(selectedVar) => {
                  const currentVal = tempValue || '';
                  const newVal = currentVal.trim() === '' ? selectedVar : `${currentVal} + ${selectedVar}`;
                  setTempValue(newVal);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
