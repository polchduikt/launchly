import React from 'react';
import { createPortal } from 'react-dom';
import { X, Link as LinkIcon, MessageSquare } from 'lucide-react';
import { t } from '../../../../../../../i18n/config';

export interface LinkPopoverModalProps {
  isOpen: boolean;
  coords: { top: number; left: number } | null;
  linkStep: 'select' | 'form';
  setLinkStep: (step: 'select' | 'form') => void;
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  linkText: string;
  setLinkText: (text: string) => void;
  isEditingExistingLink: boolean;
  onClose: () => void;
  onDeleteLink: () => void;
  onSaveLink: () => void;
}

export const LinkPopoverModal: React.FC<LinkPopoverModalProps> = ({
  isOpen,
  coords,
  linkStep,
  setLinkStep,
  linkUrl,
  setLinkUrl,
  linkText,
  setLinkText,
  isEditingExistingLink,
  onClose,
  onDeleteLink,
  onSaveLink,
}) => {
  if (!isOpen || !coords) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[99998]"
        onClick={onClose}
      />
      <div
        style={{
          position: 'absolute',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          zIndex: 99999,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-2xl p-4 w-80 text-[#0A0A0A] space-y-3 text-left font-['JetBrains_Mono',monospace] animate-in zoom-in-95 duration-150"
      >
        <div className="flex justify-between items-center pb-1.5 border-b-2 border-[#0A0A0A]/20">
          <span className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
            {t('editor.message.link_clicked')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-[#0A0A0A] cursor-pointer transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        {linkStep === 'select' ? (
          <div className="space-y-2">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                setLinkStep('form');
              }}
              className="flex items-center gap-2.5 w-full p-3 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl text-xs font-bold text-[#0A0A0A] transition-colors text-left cursor-pointer group"
            >
              <LinkIcon size={14} className="shrink-0" />
              <span>{t('editor.edit_button.action.open_website')}</span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-2.5 w-full p-3 border-2 border-[#0A0A0A]/30 bg-[#F2EBDD]/50 text-[#0A0A0A]/40 rounded-2xl text-xs font-bold text-left cursor-not-allowed"
            >
              <MessageSquare size={14} className="shrink-0" />
              <span>{t('editor.message.open_messenger')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white border-2 border-[#0A0A0A] rounded-2xl px-3 py-2 text-xs text-[#0A0A0A] font-bold">
              <div className="flex items-center gap-2">
                <LinkIcon size={12} />
                <span>{t('editor.edit_button.action.open_website')}</span>
              </div>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLinkStep('select');
                }}
                className="p-0.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded text-[#0A0A0A] cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider block font-['Anybody',sans-serif]">
                Website URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="https://yourwebsite.com"
                className="w-full border-2 border-[#0A0A0A] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white text-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider block font-['Anybody',sans-serif]">
                Link text
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Click here"
                className="w-full border-2 border-[#0A0A0A] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white text-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
              />
            </div>

            <div className="flex gap-2 pt-1 font-['JetBrains_Mono',monospace]">
              {isEditingExistingLink && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLink();
                  }}
                  className="flex-1 py-2 bg-white hover:bg-rose-50 border-2 border-rose-600 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                disabled={!linkUrl.trim()}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveLink();
                }}
                className="flex-1 py-2.5 bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 disabled:bg-[#0A0A0A]/20 text-[#F2EBDD] text-xs font-black rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider font-['Anybody',sans-serif]"
              >
                Save link
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};
