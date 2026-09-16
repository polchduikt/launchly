import React from 'react';
import {
  Link as LinkIcon,
  Smile,
  Parentheses,
  ArrowRight,
  Plus
} from 'lucide-react';
import type { FlowBlock, ButtonData } from '../../../../../../../types/bot';
import { t } from '../../../../../../../i18n/config';
import { FieldVariableSelector } from '../FieldVariableSelector';
import { textToHtml, htmlToText } from './contentEditableUtils';

export interface MessageTextBlockProps {
  block: FlowBlock;
  nodeId: string;
  edges: Array<{ source: string; sourceHandle?: string | null; target: string }>;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  onContentEditableInput: (blockId: string) => void;
  onSaveSelectionRange: (blockId: string) => void;
  onContentEditableClick: (e: React.MouseEvent, blockId: string) => void;
  onOpenLinkPopover: (blockId: string, e: React.MouseEvent) => void;
  onOpenEmojiPicker: (blockId: string, e: React.MouseEvent) => void;
  onInsertHtml: (html: string, blockId: string) => void;
  onOpenEditButton: (btn: ButtonData, blockId: string) => void;
  onAddButton: (blockId: string) => void;
  onJumpToNode: (targetNodeId: string) => void;
  onAddTelegramMenu: () => void;
  hasTelegramMenu: boolean;
  customFields: string[];
  tags: Array<{ id: number | string; name: string }>;
  nodeVariables?: Array<{ key: string; name: string; val: string; icon?: React.ReactNode }>;
  nodeCategoryLabel?: string;
}

export const MessageTextBlock: React.FC<MessageTextBlockProps> = ({
  block,
  nodeId,
  edges,
  activeBlockId,
  setActiveBlockId,
  onContentEditableInput,
  onSaveSelectionRange,
  onContentEditableClick,
  onOpenLinkPopover,
  onOpenEmojiPicker,
  onInsertHtml,
  onOpenEditButton,
  onAddButton,
  onJumpToNode,
  onAddTelegramMenu,
  hasTelegramMenu,
  customFields,
  tags,
  nodeVariables,
  nodeCategoryLabel,
}) => {
  const blockBtns = (block.buttons || []) as ButtonData[];
  const editableRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (editableRef.current && document.activeElement !== editableRef.current) {
      const currentText = htmlToText(editableRef.current.innerHTML);
      if (currentText !== (block.text || '')) {
        editableRef.current.innerHTML = textToHtml(block.text || '');
      }
    }
  }, [block.id, block.text]);

  return (
    <div className="flex flex-col">
      <div
        className="bg-white p-4 pb-2 relative flex flex-col min-h-[110px]"
        onFocus={() => setActiveBlockId(block.id || '')}
        onClick={(e) => onContentEditableClick(e, block.id || '')}
      >
        <div
          id={`contenteditable-block-${block.id}`}
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          className="text-xs leading-relaxed focus:outline-none min-h-[60px] pb-6 break-words whitespace-pre-wrap select-text font-sans font-medium"
          onInput={() => onContentEditableInput(block.id || '')}
          onBlur={() => onSaveSelectionRange(block.id || '')}
          onKeyUp={() => onSaveSelectionRange(block.id || '')}
          onMouseUp={() => onSaveSelectionRange(block.id || '')}
        />

        {activeBlockId === block.id && (
          <div className="absolute bottom-2 right-2 bg-[#0A0A0A] text-[#F2EBDD] px-2.5 py-1 rounded-xl shadow-lg border-2 border-[#0A0A0A] flex items-center gap-2 z-10 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => onOpenLinkPopover(block.id || '', e)}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              <LinkIcon size={13} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => onOpenEmojiPicker(block.id || '', e)}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Smile size={13} className="stroke-[2.5]" />
            </button>
            <FieldVariableSelector
              onSelect={(val) => {
                const displayName =
                  val === 'first_name' || val === 'found_user.first_name' ? 'First Name'
                  : val === 'last_name' || val === 'found_user.last_name' ? 'Last Name'
                  : val === 'phone' || val === 'found_user.phone' ? 'Phone'
                  : val === 'email' || val === 'found_user.email' ? 'Email'
                  : val === 'telegram_username' || val === 'found_user.telegram_username' ? 'Telegram Username'
                  : val === 'telegram_user_id' || val === 'found_user.telegram_id' || val === 'found_user.telegram_user_id' ? 'Telegram User ID'
                  : val === 'contact_id' ? 'Contact Id'
                  : val === 'subscribed' ? 'Subscribed'
                  : val === 'chat_type' ? 'Chat Type'
                  : val === 'chat_title' ? 'Chat Title'
                  : val === 'chat_id' ? 'Chat ID'
                  : val === 'leaderboard' ? 'Leaderboard (ТОП)'
                  : val === 'user_rank' ? 'User Rank (Місце)'
                  : val === 'user_score' ? 'User Score (Бали)'
                  : val === 'awarded_points' ? 'Awarded Points (+Бали)'
                  : val === 'photo' || val === 'found_user.photo' ? 'photo'
                  : val === 'photo_url' || val === 'found_user.photo_url' ? 'photo_url'
                  : val.startsWith('found_user.') ? val.substring('found_user.'.length)
                  : val;
                const html = `<span class="inline-flex items-center bg-[#0A0A0A] text-[#F2EBDD] rounded-lg px-2 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline border border-[#0A0A0A] font-mono" contenteditable="false" data-type="variable" data-val="${val}">${displayName}</span>`;
                onInsertHtml(html, block.id || '');
              }}
              customFields={customFields}
              tags={tags}
              nodeVariables={nodeVariables}
              nodeCategoryLabel={nodeCategoryLabel}
              mode="variable"
              position="bottom"
              trigger={
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className="hover:text-amber-300 transition-colors cursor-pointer flex items-center"
                  title="Variables"
                >
                  <Parentheses size={12} className="stroke-[2.5]" />
                </button>
              }
            />
            <div className="w-[1px] h-3.5 bg-white/30 my-0.5" />
            <span className="text-[10px] font-extrabold tracking-wider text-[#F2EBDD]/80 font-mono">
              {2000 - (block.text || '').length}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 bg-white space-y-2 border-t border-slate-100">
        {blockBtns.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {blockBtns.map((btn, bIdx) => {
              const edge = edges.find((e) => e.source === nodeId && e.sourceHandle === btn.value);
              const isConnected = !!edge;
              const targetNodeId = edge?.target;

              return (
                <div
                  key={btn.value + bIdx}
                  onClick={() => onOpenEditButton(btn, block.id)}
                  className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-slate-350 cursor-pointer transition-all animate-in fade-in"
                >
                  <span className="truncate flex-1 pr-4">{btn.label}</span>
                  {btn.actionType === 'BUY' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-250 flex items-center justify-center font-black text-[9px] shrink-0 mr-1.5 select-none leading-none">
                      $
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isConnected && targetNodeId) {
                        onJumpToNode(targetNodeId);
                      }
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isConnected
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-250 cursor-pointer'
                        : 'border border-slate-300 text-slate-300 cursor-default'
                    }`}
                  >
                    {isConnected ? (
                      <ArrowRight size={11} className="stroke-[2.5]" />
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => onAddButton(block.id)}
          className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-250 hover:border-slate-350 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus size={13} />
          <span>{t('flow_builder.btn_add_button')}</span>
        </button>

        {!hasTelegramMenu && (
          <button
            type="button"
            onClick={onAddTelegramMenu}
            className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1.5"
          >
            <Plus size={13} />
            <span>{t('flow_builder.btn_telegram_menu')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
