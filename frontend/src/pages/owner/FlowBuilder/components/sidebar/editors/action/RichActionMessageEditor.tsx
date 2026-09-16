import React, { useState, useRef, useEffect } from 'react';
import { Link as LinkIcon, Smile, Parentheses } from 'lucide-react';
import { FieldVariableSelector } from '../FieldVariableSelector';
import { textToHtml, htmlToText } from '../message/contentEditableUtils';
import { EmojiPickerModal } from '../message/EmojiPickerModal';
import { LinkPopoverModal } from '../message/LinkPopoverModal';
import { t } from '../../../../../../../i18n/config';

export interface RichActionMessageEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  customFields?: string[];
  tags?: Array<{ id: number | string; name: string }>;
  nodeVariables?: Array<{ key: string; name: string; val: string; icon?: React.ReactNode }>;
  placeholder?: string;
}

export const RichActionMessageEditor: React.FC<RichActionMessageEditorProps> = ({
  value,
  onChange,
  customFields = [],
  tags = [],
  nodeVariables = [],
  placeholder,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [linkStep, setLinkStep] = useState<'select' | 'form'>('select');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const [emojiCoords, setEmojiCoords] = useState<{ top: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const lastSelectionRangeRef = useRef<Range | null>(null);
  const editingLinkElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (editableRef.current && document.activeElement !== editableRef.current) {
      const currentText = htmlToText(editableRef.current.innerHTML);
      if (currentText !== (value || '')) {
        editableRef.current.innerHTML = textToHtml(value || '');
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const clickedPortal = (e.target as Element).closest('.rounded-2xl.shadow-xl.flex') ||
                              (e.target as Element).closest('[role="dialog"]');
        if (clickedPortal) return;
        setIsActive(false);
        setIsLinkOpen(false);
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const saveSelectionRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editableRef.current && editableRef.current.contains(range.commonAncestorContainer)) {
        lastSelectionRangeRef.current = range.cloneRange();
      }
    }
  };

  const handleInput = () => {
    if (editableRef.current) {
      const text = htmlToText(editableRef.current.innerHTML);
      onChange(text);
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    const el = editableRef.current;
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
        let node;
        let lastNode;
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
    onChange(text);
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

  const handleSelectEmoji = (emoji: string) => {
    insertHtmlAtCursor(emoji);
    setIsEmojiOpen(false);
  };

  const handleSaveLink = () => {
    if (!linkUrl) return;
    const finalUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    const displayText = linkText.trim() || finalUrl;

    if (editingLinkElementRef.current) {
      editingLinkElementRef.current.innerText = displayText;
      editingLinkElementRef.current.setAttribute('data-url', finalUrl);
      if (editableRef.current) {
        onChange(htmlToText(editableRef.current.innerHTML));
      }
    } else {
      const linkHtml = `<span class="text-blue-600 font-bold hover:underline cursor-pointer" contenteditable="false" data-type="link" data-url="${finalUrl}">${displayText}</span>`;
      insertHtmlAtCursor(linkHtml);
    }

    setIsLinkOpen(false);
    editingLinkElementRef.current = null;
  };

  const handleDeleteLink = () => {
    if (editingLinkElementRef.current) {
      const parent = editingLinkElementRef.current.parentNode;
      if (parent) {
        const textNode = document.createTextNode(editingLinkElementRef.current.innerText);
        parent.replaceChild(textNode, editingLinkElementRef.current);
        if (editableRef.current) {
          onChange(htmlToText(editableRef.current.innerHTML));
        }
      }
      editingLinkElementRef.current = null;
    }
    setIsLinkOpen(false);
  };

  const handleContentClick = (e: React.MouseEvent) => {
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

  return (
    <div ref={containerRef} className="w-full relative mt-1 select-none">
      <div
        className={`w-full bg-white border-2 border-[#0A0A0A] rounded-2xl p-3 min-h-[110px] relative transition-all ${
          isActive ? 'ring-2 ring-[#0A0A0A]/20 shadow-md' : 'shadow-sm'
        }`}
        onClick={(e) => {
          setIsActive(true);
          handleContentClick(e);
        }}
        onFocus={() => setIsActive(true)}
      >
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder || t('editor.action.notify_contact_placeholder', 'Введіть текст сповіщення')}
          className="text-xs leading-relaxed focus:outline-none min-h-[64px] pb-7 break-words whitespace-pre-wrap select-text font-sans font-semibold text-[#0A0A0A] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:font-normal empty:before:pointer-events-none"
          onInput={handleInput}
          onBlur={saveSelectionRange}
          onKeyUp={saveSelectionRange}
          onMouseUp={saveSelectionRange}
        />

        {isActive && (
          <div className="absolute bottom-2 right-2 bg-[#0A0A0A] text-[#F2EBDD] px-2.5 py-1 rounded-xl shadow-lg border-2 border-[#0A0A0A] flex items-center gap-2 z-10 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenLinkPopover}
              className="hover:text-amber-300 transition-colors cursor-pointer"
              title="Add Link"
            >
              <LinkIcon size={13} className="stroke-[2.5]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenEmojiPicker}
              className="hover:text-amber-300 transition-colors cursor-pointer"
              title="Add Emoji"
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
                  : val === 'photo' || val === 'found_user.photo' ? 'photo'
                  : val === 'photo_url' || val === 'found_user.photo_url' ? 'photo_url'
                  : val.startsWith('found_user.') ? val.substring('found_user.'.length)
                  : val;
                const html = `<span class="inline-flex items-center bg-[#0A0A0A] text-[#F2EBDD] rounded-lg px-2 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline border border-[#0A0A0A] font-mono" contenteditable="false" data-type="variable" data-val="${val}">${displayName}</span>`;
                insertHtmlAtCursor(html);
              }}
              customFields={customFields}
              tags={tags}
              nodeVariables={nodeVariables}
              nodeCategoryLabel={t('node.title.query', 'Запит даних')}
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
              {Math.max(0, 2000 - (value || '').length)}
            </span>
          </div>
        )}
      </div>

      <EmojiPickerModal
        isOpen={isEmojiOpen}
        coords={emojiCoords}
        onClose={() => setIsEmojiOpen(false)}
        onSelectEmoji={handleSelectEmoji}
      />

      <LinkPopoverModal
        isOpen={isLinkOpen}
        coords={popoverCoords}
        linkStep={linkStep}
        setLinkStep={setLinkStep}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        linkText={linkText}
        setLinkText={setLinkText}
        isEditingExistingLink={Boolean(editingLinkElementRef.current)}
        onClose={() => setIsLinkOpen(false)}
        onDeleteLink={handleDeleteLink}
        onSaveLink={handleSaveLink}
      />
    </div>
  );
};
