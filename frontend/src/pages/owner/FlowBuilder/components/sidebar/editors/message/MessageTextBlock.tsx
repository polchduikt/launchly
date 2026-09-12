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
}) => {
  const blockBtns = (block.buttons || []) as ButtonData[];

  return (
    <div className="flex flex-col">
      <div
        className="bg-white p-4 pb-2 relative flex flex-col min-h-[110px]"
        onFocus={() => setActiveBlockId(block.id || '')}
      >
        <div
          id={`contenteditable-block-${block.id || ''}`}
          contentEditable
          onInput={() => onContentEditableInput(block.id || '')}
          onKeyUp={() => onSaveSelectionRange(block.id || '')}
          onMouseUp={() => onSaveSelectionRange(block.id || '')}
          onFocus={() => setActiveBlockId(block.id || '')}
          onClick={(e) => onContentEditableClick(e, block.id || '')}
          data-placeholder={t('editor.message.text_placeholder')}
          className="w-full text-xs font-bold text-[#0A0A0A] focus:outline-none bg-transparent min-h-[80px] cursor-text break-words outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#0A0A0A]/40 empty:before:pointer-events-none font-['JetBrains_Mono',monospace]"
        />

        {activeBlockId === block.id && (
          <div className="absolute bottom-2.5 right-3 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] px-3 py-1.5 rounded-full flex items-center gap-2.5 shadow-md z-30 font-['JetBrains_Mono',monospace]">
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
                  val === 'first_name' ? 'First Name'
                  : val === 'last_name' ? 'Last Name'
                  : val === 'phone' ? 'Phone'
                  : val === 'email' ? 'Email'
                  : val === 'telegram_username' ? 'Telegram Username'
                  : val === 'telegram_user_id' ? 'Telegram User ID'
                  : val === 'contact_id' ? 'Contact Id'
                  : val === 'subscribed' ? 'Subscribed'
                  : val === 'chat_type' ? 'Chat Type'
                  : val === 'chat_title' ? 'Chat Title'
                  : val === 'chat_id' ? 'Chat ID'
                  : val === 'leaderboard' ? 'Leaderboard (ТОП)'
                  : val === 'user_rank' ? 'User Rank (Місце)'
                  : val === 'user_score' ? 'User Score (Бали)'
                  : val === 'awarded_points' ? 'Awarded Points (+Бали)'
                  : val;
                const html = `<span class="inline-flex items-center bg-[#0A0A0A] text-[#F2EBDD] rounded-lg px-2 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline border border-[#0A0A0A]" contenteditable="false" data-type="variable" data-val="${val}">${displayName}</span>`;
                onInsertHtml(html, block.id || '');
              }}
              customFields={customFields}
              tags={tags}
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
