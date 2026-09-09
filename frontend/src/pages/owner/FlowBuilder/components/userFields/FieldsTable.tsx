import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, MoreVertical } from 'lucide-react';
import { t } from '../../../../../i18n/config';
import type { UserField } from '../../../../../types/bot';

interface FieldsTableProps {
  fields: UserField[];
  isArchived?: boolean;
  onEdit?: (field: UserField) => void;
  onArchive?: (name: string) => void;
  onUnarchive?: (name: string) => void;
  onDelete: (name: string, isArchived: boolean) => void;
}

export const FieldsTable: React.FC<FieldsTableProps> = ({
  fields,
  isArchived = false,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}) => {
  const [activeMenuField, setActiveMenuField] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, fieldName: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setActiveMenuField(activeMenuField === fieldName ? null : fieldName);
  };

  const activeField = fields.find((f) => f.name === activeMenuField);

  return (
    <div className="border-2 border-[#0A0A0A] rounded-2xl bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] uppercase tracking-wider select-none">
            <th className="px-5 py-3 w-10">
              <input
                type="checkbox"
                disabled
                className="w-4 h-4 accent-[#0A0A0A] cursor-not-allowed"
              />
            </th>
            <th className="px-5 py-3">
              <div className="flex items-center gap-1">
                <span>{t('settings.fields.table_name')}</span>
                {!isArchived && <HelpCircle size={12} />}
              </div>
            </th>
            <th className="px-5 py-3">
              <div className="flex items-center gap-1">
                <span>{t('settings.fields.table_type')}</span>
                {!isArchived && <HelpCircle size={12} />}
              </div>
            </th>
            <th className="px-5 py-3">
              <div className="flex items-center gap-1">
                <span>{t('settings.fields.table_value', 'Значення')}</span>
                {!isArchived && <HelpCircle size={12} />}
              </div>
            </th>
            <th className="px-5 py-3">
              <div className="flex items-center gap-1">
                <span>{t('settings.fields.table_desc')}</span>
                {!isArchived && <HelpCircle size={12} />}
              </div>
            </th>
            <th className="px-5 py-3 w-12 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs font-bold text-[#0A0A0A]">
          {fields.map((field) => (
            <tr key={field.name} className="hover:bg-slate-50 bg-white transition-colors">
              <td className="px-5 py-3.5">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                />
              </td>
              <td className="px-5 py-3.5 font-bold text-[#0A0A0A]">{field.name}</td>
              <td className="px-5 py-3.5 text-slate-700 font-medium">{field.type}</td>
              <td className="px-5 py-3.5 text-slate-700 font-medium">{field.value || '-'}</td>
              <td className="px-5 py-3.5 text-slate-700 font-medium">{field.description || '-'}</td>
              <td className="px-5 py-3.5 text-right">
                <button
                  type="button"
                  onClick={(e) => handleOpenMenu(e, field.name)}
                  className="p-1 hover:bg-[#0A0A0A] hover:text-white rounded-lg text-[#0A0A0A] cursor-pointer transition-all"
                >
                  <MoreVertical size={15} />
                </button>
              </td>
            </tr>
          ))}
          {fields.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="text-center py-10 text-slate-700 italic bg-white font-medium select-none"
              >
                {t('settings.fields.empty_state')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {activeMenuField && menuCoords && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-transparent cursor-default"
            onClick={() => setActiveMenuField(null)}
          />
          <div
            style={{ top: menuCoords.top, right: menuCoords.right }}
            className="fixed z-[9999] bg-white border-2 border-[#0A0A0A] rounded-xl shadow-xl py-1 w-32 text-left animate-in fade-in duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {!isArchived ? (
              <>
                {onEdit && activeField && (
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(activeField);
                      setActiveMenuField(null);
                    }}
                    className="w-full px-3 py-1.5 hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] text-xs font-bold text-left cursor-pointer uppercase select-none transition-colors"
                  >
                    {t('settings.fields.action_edit', 'Редагувати')}
                  </button>
                )}
                {onArchive && (
                  <button
                    type="button"
                    onClick={() => {
                      onArchive(activeMenuField);
                      setActiveMenuField(null);
                    }}
                    className="w-full px-3 py-1.5 hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] text-xs font-bold text-left cursor-pointer border-t border-slate-200 uppercase select-none transition-colors"
                  >
                    {t('settings.fields.action_archive')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onDelete(activeMenuField, false);
                    setActiveMenuField(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer border-t border-slate-200 uppercase select-none transition-colors"
                >
                  {t('settings.fields.action_delete')}
                </button>
              </>
            ) : (
              <>
                {onUnarchive && (
                  <button
                    type="button"
                    onClick={() => {
                      onUnarchive(activeMenuField);
                      setActiveMenuField(null);
                    }}
                    className="w-full px-3 py-1.5 hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] text-xs font-bold text-left cursor-pointer uppercase select-none transition-colors"
                  >
                    Unarchive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onDelete(activeMenuField, true);
                    setActiveMenuField(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer border-t border-slate-200 uppercase select-none transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
