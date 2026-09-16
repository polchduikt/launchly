import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Link as LinkIcon,
  Smile,
  Parentheses,
  Clock
} from 'lucide-react';
import type { CooldownNodeEditorProps } from '../../../../../../types/bot';
import { CustomSelect } from '../../../../../../components/ui/CustomSelect';
import { t } from '../../../../../../i18n/config';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useTagsQuery } from '../../../../../../hooks/broadcast/useBroadcastQueries';
import { useCustomFieldsQuery } from '../../../../../../hooks/bot/useCustomFieldsQuery';
import { FieldVariableSelector } from './FieldVariableSelector';
import {
  LinkPopoverModal,
  EmojiPickerModal,
  textToHtml,
  htmlToText
} from './message';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

export const CooldownNodeEditor: React.FC<CooldownNodeEditorProps> = ({
  data,
  handleChange,
  editorState,
}) => {
  const duration = (data?.duration as number | string | undefined) ?? 1;
  const unit = (data?.unit as string) || 'MINUTES';
  const blockMessage = (data?.blockMessage as string) !== undefined
    ? (data?.blockMessage as string)
    : t('editor.cooldown.default_message', 'Зачекайте ще {remaining} перед повторною спробою!');

  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);
  const { data: customFieldsData } = useCustomFieldsQuery(activeBotId);
  const customFields = useMemo(() => {
    return (customFieldsData?.fields || [])
      .map((f: unknown) => (typeof f === 'string' ? f : (f as { name?: string })?.name || ''))
      .filter((name): name is string => Boolean(name));
  }, [customFieldsData]);

  const [isFocused, setIsFocused] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [linkStep, setLinkStep] = useState<'select' | 'form'>('select');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const [emojiCoords, setEmojiCoords] = useState<{ top: number; left: number } | null>(null);

  const lastSelectionRangeRef = useRef<Range | null>(null);
  const editingLinkElementRef = useRef<HTMLElement | null>(null);
  const contentEditableRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unitOptions = [
    { value: 'SECONDS', label: t('editor.cooldown.unit_seconds', 'Секунди') },
    { value: 'MINUTES', label: t('editor.cooldown.unit_minutes', 'Хвилини') },
    { value: 'HOURS', label: t('editor.cooldown.unit_hours', 'Години') },
    { value: 'DAYS', label: t('editor.cooldown.unit_days', 'Дні') },
  ];

  const saveSelectionRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const el = contentEditableRef.current;
      if (el && el.contains(range.commonAncestorContainer)) {
        lastSelectionRangeRef.current = range.cloneRange();
      }
    }
  };

  const handleContentEditableInput = () => {
    const el = contentEditableRef.current;
    if (el) {
      const text = htmlToText(el.innerHTML);
      handleChange('blockMessage', text);
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    const el = contentEditableRef.current;
    if (!el) return;
    el.focus();

    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      if (lastSelectionRangeRef.current) {
        sel.addRange(lastSelectionRangeRef.current);
      }
    }

    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        range.deleteContents();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node: ChildNode | null;
        let lastNode: ChildNode | null = null;
        while ((node = tempDiv.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);

        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else {
        el.innerHTML += html;
      }
    } else {
      el.innerHTML += html;
    }

    const text = htmlToText(el.innerHTML);
    handleChange('blockMessage', text);
    saveSelectionRange();
  };

  const handleOpenLinkPopover = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverCoords({
      top: rect.bottom + window.scrollY + 6,
      left: Math.max(10, Math.min(window.innerWidth - 340, rect.left + window.scrollX - 140)),
    });
    editingLinkElementRef.current = null;
    setIsLinkOpen(true);
    setIsEmojiOpen(false);
    setLinkUrl('');
    setLinkText('');
    setLinkStep('select');
  };

  const handleOpenEmojiPicker = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setEmojiCoords({
      top: rect.bottom + window.scrollY + 6,
      left: Math.max(10, Math.min(window.innerWidth - 380, rect.right + window.scrollX - 350)),
    });
    setIsEmojiOpen(true);
    setIsLinkOpen(false);
  };

  const handleContentEditableClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.getAttribute('data-type') === 'link') {
      e.preventDefault();
      e.stopPropagation();

      const url = target.getAttribute('data-url') || '';
      const text = target.innerText || '';

      editingLinkElementRef.current = target;
      setLinkText(text);
      setLinkUrl(url);
      setLinkStep('form');
      setIsLinkOpen(true);
      setIsEmojiOpen(false);
    }
  };

  const handleDeleteLink = () => {
    if (editingLinkElementRef.current) {
      const parent = editingLinkElementRef.current.parentNode;
      if (parent) {
        const textNode = document.createTextNode(editingLinkElementRef.current.innerText);
        parent.replaceChild(textNode, editingLinkElementRef.current);
      }
      editingLinkElementRef.current = null;
      handleContentEditableInput();
    }
    setIsLinkOpen(false);
    setPopoverCoords(null);
  };

  const handleSaveLink = () => {
    if (editingLinkElementRef.current) {
      editingLinkElementRef.current.setAttribute('data-url', linkUrl.trim());
      editingLinkElementRef.current.innerText = linkText.trim() || linkUrl.trim();
      editingLinkElementRef.current = null;
      handleContentEditableInput();
    } else {
      const html = `<span class="text-blue-600 font-bold hover:underline cursor-pointer" contenteditable="false" data-type="link" data-url="${linkUrl.trim()}">${linkText.trim() || linkUrl.trim()}</span>`;
      insertHtmlAtCursor(html);
    }
    setIsLinkOpen(false);
    setPopoverCoords(null);
  };

  const handleSelectVariable = (val: string) => {
    const displayName =
      val === 'remaining' ? 'remaining'
      : val === 'first_name' ? 'First Name'
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
      : val;
    const html = `<span class="inline-flex items-center bg-blue-600 text-white rounded px-1.5 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline" contenteditable="false" data-type="variable" data-val="${val}">${displayName}</span>`;
    insertHtmlAtCursor(html);
  };

  useEffect(() => {
    const el = contentEditableRef.current;
    if (el && !isFocused) {
      const currentText = htmlToText(el.innerHTML);
      if (currentText !== blockMessage) {
        el.innerHTML = textToHtml(blockMessage);
      }
    }
  }, [blockMessage, isFocused]);

  useEffect(() => {
    const el = contentEditableRef.current;
    if (el && !el.innerHTML) {
      el.innerHTML = textToHtml(blockMessage);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isFocused) return;
      const container = containerRef.current;
      if (container && !container.contains(e.target as Node)) {
        const clickedPortal = (e.target as Element).closest(
          '.rounded-2xl.shadow-xl.flex, .rounded-3xl.shadow-2xl, [role="dialog"]'
        );
        if (clickedPortal) return;

        setIsFocused(false);
        setIsLinkOpen(false);
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFocused]);

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.cooldown.duration_label', 'Час очікування')}
        </label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => handleChange('duration', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] focus:outline-none"
            />
          </div>
          <div className="w-32">
            <CustomSelect
              value={unit}
              onChange={(val) => handleChange('unit', val)}
              options={unitOptions}
              buttonClassName="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] bg-white flex items-center justify-between transition-all cursor-pointer hover:bg-[#F2EBDD]/30"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
            {t('editor.cooldown.message_label', 'Повідомлення при блокуванні')}
          </label>
        </div>

        <div
          ref={containerRef}
          className="relative w-full bg-white border-2 border-[#0A0A0A] rounded-xl p-3 min-h-[95px] flex flex-col justify-between"
          onClick={() => {
            contentEditableRef.current?.focus();
            setIsFocused(true);
          }}
        >
          <div
            ref={contentEditableRef}
            contentEditable
            onInput={handleContentEditableInput}
            onKeyUp={saveSelectionRange}
            onMouseUp={saveSelectionRange}
            onFocus={() => setIsFocused(true)}
            onClick={handleContentEditableClick}
            data-placeholder={t('editor.cooldown.message_placeholder', 'Зачекайте ще {remaining} перед повторною спробою!')}
            className="w-full text-xs font-bold text-[#0A0A0A] focus:outline-none bg-transparent min-h-[60px] pb-6 cursor-text break-words outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#0A0A0A]/40 empty:before:pointer-events-none font-['JetBrains_Mono',monospace]"
          />

          {isFocused && (
            <div className="absolute bottom-2.5 right-2.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] px-3 py-1.5 rounded-full flex items-center gap-2.5 shadow-md z-30 font-['JetBrains_Mono',monospace]">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleOpenLinkPopover}
                className="hover:text-amber-300 transition-colors cursor-pointer"
                title={t('editor.message.toolbar_link', 'Посилання')}
              >
                <LinkIcon size={13} className="stroke-[2.5]" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleOpenEmojiPicker}
                className="hover:text-amber-300 transition-colors cursor-pointer"
                title={t('editor.message.toolbar_emoji', 'Емодзі')}
              >
                <Smile size={13} className="stroke-[2.5]" />
              </button>
              <FieldVariableSelector
                onSelect={handleSelectVariable}
                customFields={customFields}
                tags={tags}
                nodeVariables={[
                  {
                    key: 'remaining',
                    name: t('editor.cooldown.variable_remaining', 'Час очікування'),
                    val: 'remaining',
                    icon: <Clock size={13} className="text-slate-400" />
                  }
                ]}
                nodeCategoryLabel={t('editor.gs.node_variables', 'Змінні вузла')}
                mode="variable"
                position="bottom"
                trigger={
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    className="hover:text-amber-300 transition-colors cursor-pointer flex items-center"
                    title={t('editor.message.toolbar_variables', 'Змінні')}
                  >
                    <Parentheses size={12} className="stroke-[2.5]" />
                  </button>
                }
              />
              <div className="w-[1px] h-3.5 bg-white/30 my-0.5" />
              <span className="text-[10px] font-extrabold tracking-wider text-[#F2EBDD]/80 font-mono">
                {2000 - (blockMessage || '').length}
              </span>
            </div>
          )}
        </div>

        <LinkPopoverModal
          isOpen={Boolean(isLinkOpen && popoverCoords)}
          coords={popoverCoords}
          linkStep={linkStep}
          setLinkStep={setLinkStep}
          linkUrl={linkUrl}
          setLinkUrl={setLinkUrl}
          linkText={linkText}
          setLinkText={setLinkText}
          isEditingExistingLink={Boolean(editingLinkElementRef.current)}
          onClose={() => {
            setIsLinkOpen(false);
            setPopoverCoords(null);
          }}
          onDeleteLink={handleDeleteLink}
          onSaveLink={handleSaveLink}
        />

        <EmojiPickerModal
          isOpen={Boolean(isEmojiOpen && emojiCoords)}
          coords={emojiCoords}
          onClose={() => {
            setIsEmojiOpen(false);
            setEmojiCoords(null);
          }}
          onSelectEmoji={(emoji) => {
            insertHtmlAtCursor(emoji);
            setIsEmojiOpen(false);
            setEmojiCoords(null);
          }}
        />
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (editorState) {
              (editorState as EditorStateLocal).setNextStepSourceHandle('next');
              (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true);
            }
          }}
          className="w-full py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] border-2 border-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center select-none shadow-[2px_2px_0px_0px_#0A0A0A] hover:shadow-none"
        >
          {t('editor.cooldown.choose_next_step', 'Обрати наступний крок')}
        </button>
      </div>
    </div>
  );
};
