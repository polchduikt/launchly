import React, { useState, useRef } from 'react';
import {
  AlignLeft,
  Image as ImageIcon,
  Clock,
  Database,
  Paperclip,
  Volume2,
  Video,
  MoreHorizontal,
} from 'lucide-react';
import { t } from '../../../../../../../i18n/config';
import { useClickOutside } from '../../../../../../../hooks/useClickOutside';

export interface AddBlockPaletteProps {
  onAddBlock: (type: 'text' | 'image' | 'delay' | 'data_collection' | 'file' | 'audio' | 'video' | 'telegram_menu') => void;
  onOpenNextStep: () => void;
}

export const AddBlockPalette: React.FC<AddBlockPaletteProps> = ({
  onAddBlock,
  onOpenNextStep,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreContainerRef = useRef<HTMLDivElement>(null);

  useClickOutside(moreContainerRef, () => setIsMoreOpen(false), isMoreOpen);

  return (
    <>
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
          {t('ai.builder.add_content_blocks_header')}
        </span>
        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={() => onAddBlock('text')}
            className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-500 shrink-0">
                <AlignLeft size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_text_title')}</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_text_desc')}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAddBlock('image')}
            className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-500 shrink-0">
                <ImageIcon size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_image_title')}</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_image_desc')}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAddBlock('delay')}
            className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-500 shrink-0">
                <Clock size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_delay_title')}</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_delay_desc')}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAddBlock('data_collection')}
            className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-500 shrink-0">
                <Database size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_data_collection_title')}</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_data_collection_desc')}</p>
              </div>
            </div>
            <span className="text-[8px] font-extrabold bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider mr-1">
              PRO
            </span>
          </button>

          <div ref={moreContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500 shrink-0">
                  <MoreHorizontal size={16} />
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_more_title')}</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_more_desc')}</p>
                </div>
              </div>
            </button>

            {isMoreOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white border border-slate-200 rounded-3xl shadow-xl z-50 space-y-2 border-dashed animate-in slide-in-from-bottom-2 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    onAddBlock('file');
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-dashed border-slate-150 hover:border-slate-300 rounded-2xl cursor-pointer transition-all text-left"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-slate-500 shrink-0">
                      <Paperclip size={16} />
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_file_title')}</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_file_desc')}</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddBlock('audio');
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-dashed border-slate-150 hover:border-slate-300 rounded-2xl cursor-pointer transition-all text-left"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-slate-500 shrink-0">
                      <Volume2 size={16} />
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_audio_title')}</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_audio_desc')}</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddBlock('video');
                    setIsMoreOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-dashed border-slate-150 hover:border-slate-300 rounded-2xl cursor-pointer transition-all text-left"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-slate-500 shrink-0">
                      <Video size={16} />
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">{t('ai.builder.block_video_title')}</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">{t('ai.builder.block_video_desc')}</p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={onOpenNextStep}
          className="w-full py-2.5 bg-white hover:bg-indigo-50/30 border border-indigo-200 hover:border-indigo-450 text-indigo-650 hover:text-indigo-700 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm select-none"
        >
          {t('ai.builder.choose_next_step')}
        </button>
      </div>
    </>
  );
};
