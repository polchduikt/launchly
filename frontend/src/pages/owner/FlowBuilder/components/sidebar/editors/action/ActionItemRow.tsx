import React from 'react';
import {
  Plus,
  Trash2,
  Tag,
  User,
  CheckSquare,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { ActionItem } from '../../../../../../../types/bot';
import { t } from '../../../../../../../i18n/config';
import { TagSearchSelect } from '../TagSearchSelect';
import { SetUserFieldPopover } from '../SetUserFieldPopover';

export interface ActionItemRowProps {
  action: ActionItem;
  index: number;
  totalActions: number;
  tags: Array<{ id: number | string; name: string }>;
  userFields: Array<{ name: string; type: string; description: string }>;
  activePopoverIndex: number | null;
  setActivePopoverIndex: (index: number | null) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number, e: React.MouseEvent) => void;
  onModify: (index: number, fields: Partial<ActionItem>) => void;
  onOpenTagModal: (index: number) => void;
  onOpenFieldModal: (index: number) => void;
  onOpenSheetsModal: (index: number) => void;
}

export const ActionItemRow: React.FC<ActionItemRowProps> = ({
  action: act,
  index,
  totalActions,
  tags,
  userFields,
  activePopoverIndex,
  setActivePopoverIndex,
  onMoveUp,
  onMoveDown,
  onRemove,
  onModify,
  onOpenTagModal,
  onOpenFieldModal,
  onOpenSheetsModal
}) => {
  const getActionName = (type: string) => {
    return t(`action.name.${type}`) !== `action.name.${type}`
      ? t(`action.name.${type}`)
      : t('action.name.DEFAULT');
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'ADD_TAG':
      case 'REMOVE_TAG':
        return <Tag size={14} className="text-amber-500" />;
      case 'SET_USER_FIELD':
      case 'CLEAR_USER_FIELD':
        return <User size={14} className="text-sky-500" />;
      case 'TELEGRAM_SUBSCRIBE':
      case 'TELEGRAM_UNSUBSCRIBE':
        return <CheckSquare size={14} className="text-indigo-500" />;
      case 'GS_INSERT_ROW':
      case 'GS_GET_ROW':
      case 'GS_UPDATE_ROW':
        return <FileSpreadsheet size={14} className="text-emerald-500" />;
      case 'MARK_DONE':
        return <CheckSquare size={14} className="text-emerald-500" />;
      case 'ASSIGN_AGENT':
        return <User size={14} className="text-blue-500" />;
      default:
        return <Plus size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-1.5 pb-3 border-b border-slate-100/70 last:border-b-0 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="shrink-0">{getActionIcon(act.type)}</span>
          <span className="text-xs font-bold text-slate-800">
            {getActionName(act.type)}
          </span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 absolute right-0 top-0 z-10">
          {index > 0 && (
            <button
              type="button"
              onClick={() => onMoveUp(index)}
              className="p-1 text-slate-450 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowUp size={13} />
            </button>
          )}
          {index < totalActions - 1 && (
            <button
              type="button"
              onClick={() => onMoveDown(index)}
              className="p-1 text-slate-450 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowDown size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => onRemove(index, e)}
            className="p-1 text-slate-450 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="pl-6 select-none">
        {(act.type === 'ADD_TAG' || act.type === 'REMOVE_TAG') && (
          <div className="max-w-xs">
            <TagSearchSelect
              tagName={act.tagName || ''}
              tags={tags}
              onChange={(selectedTag) => {
                onModify(index, {
                  tagId: selectedTag ? String(selectedTag.id) : '',
                  tagName: selectedTag ? selectedTag.name : ''
                });
              }}
              onCreateTag={() => onOpenTagModal(index)}
            />
          </div>
        )}

        {act.type === 'SET_USER_FIELD' && (
          <div className="text-xs text-slate-650 font-bold leading-relaxed relative">
            <div>
              {t('editor.action.set')} &nbsp;
              <span
                onClick={() => setActivePopoverIndex(activePopoverIndex === index ? null : index)}
                className="underline decoration-dashed decoration-[#407BFF] cursor-pointer text-[#407BFF] font-bold hover:text-blue-700 select-none"
              >
                {act.fieldName || t('editor.action.select_field')}
              </span>
              &nbsp; {t('editor.action.to')} &nbsp;
              <span
                onClick={() => setActivePopoverIndex(activePopoverIndex === index ? null : index)}
                className="underline decoration-dashed decoration-[#407BFF] cursor-pointer text-[#407BFF] font-bold hover:text-blue-700 select-none"
              >
                {act.fieldValue || t('editor.action.enter_value')}
              </span>
            </div>

            {activePopoverIndex === index && (
              <SetUserFieldPopover
                fieldName={act.fieldName || ''}
                fieldValue={act.fieldValue || ''}
                userFields={userFields}
                tags={tags}
                onClose={() => setActivePopoverIndex(null)}
                onSave={(updatedFields) => onModify(index, updatedFields)}
                onCreateNewField={() => onOpenFieldModal(index)}
              />
            )}
          </div>
        )}

        {act.type === 'CLEAR_USER_FIELD' && (
          <div className="text-xs text-slate-650 font-bold leading-relaxed relative">
            <div>
              {t('editor.action.clear')} &nbsp;
              <span
                onClick={() => setActivePopoverIndex(activePopoverIndex === index ? null : index)}
                className="underline decoration-dashed decoration-[#407BFF] cursor-pointer text-[#407BFF] font-bold hover:text-blue-700 select-none"
              >
                {act.fieldName || t('editor.action.select_field')}
              </span>
            </div>

            {activePopoverIndex === index && (
              <SetUserFieldPopover
                fieldName={act.fieldName || ''}
                fieldValue=""
                userFields={userFields}
                tags={tags}
                onClose={() => setActivePopoverIndex(null)}
                onSave={(updatedFields) => onModify(index, { fieldName: updatedFields.fieldName })}
                onCreateNewField={() => onOpenFieldModal(index)}
                hideValue={true}
              />
            )}
          </div>
        )}

        {(act.type === 'GS_INSERT_ROW' || act.type === 'GS_GET_ROW' || act.type === 'GS_UPDATE_ROW') && (
          <div className="text-xs text-slate-650 font-bold leading-relaxed">
            <span
              onClick={() => onOpenSheetsModal(index)}
              className="underline cursor-pointer text-[#407BFF] font-bold hover:text-blue-700"
            >
              {act.type === 'GS_INSERT_ROW'
                ? t('editor.action.insert_row')
                : act.type === 'GS_GET_ROW'
                ? t('editor.action.get_row')
                : t('editor.action.update_row')}
            </span>
            {act.spreadsheetId && (
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {t('editor.action.sheet_prefix')} {act.sheetName || 'Sheet1'}
              </span>
            )}
          </div>
        )}

        {(act.type === 'TELEGRAM_SUBSCRIBE' || act.type === 'TELEGRAM_UNSUBSCRIBE') && (
          <div className="text-[10px] text-slate-400 font-semibold italic">
            {act.type === 'TELEGRAM_SUBSCRIBE'
              ? t('editor.action.tg_sub_desc')
              : t('editor.action.tg_unsub_desc')}
          </div>
        )}

        {act.type === 'MARK_DONE' && (
          <div className="text-[10px] text-slate-400 font-semibold italic">
            {t('editor.action.mark_done_desc')}
          </div>
        )}
        {act.type === 'ASSIGN_AGENT' && (
          <div className="text-[10px] text-slate-400 font-semibold italic">
            {t('editor.action.assign_agent_desc')}
          </div>
        )}
      </div>
    </div>
  );
};
