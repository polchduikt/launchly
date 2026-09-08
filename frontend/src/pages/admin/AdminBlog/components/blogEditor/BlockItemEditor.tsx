import React from 'react';
import { ArrowUp, ArrowDown, X, UploadCloud, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../../../i18n/config';
import type { ContentBlock } from './types';

interface BlockItemEditorProps {
  block: ContentBlock;
  index: number;
  totalBlocks: number;
  onUpdate: (updated: ContentBlock) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onImageUpload: (file: File) => void;
  isUploadingImage: boolean;
}

export const BlockItemEditor: React.FC<BlockItemEditorProps> = ({
  block,
  index,
  totalBlocks,
  onUpdate,
  onRemove,
  onMove,
  onImageUpload,
  isUploadingImage,
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-5 bg-slate-50 border-2 border-[#0A0A0A] rounded-2xl space-y-3 relative shadow-[3px_3px_0px_#0A0A0A]">
      <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-slate-200">
        <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[#0A0A0A]">
            #{index + 1}
          </span>
          <span className="text-[#0A0A0A] font-black">
            {block.type === 'paragraph' && t('admin.blog.block_paragraph', 'Абзац тексту')}
            {block.type === 'heading' &&
              t('admin.blog.block_heading', { level: block.level || 2 })}
            {block.type === 'quote' && t('admin.blog.block_quote', 'Цитата')}
            {block.type === 'list' && t('admin.blog.block_list', 'Маркований список')}
            {block.type === 'image' && t('admin.blog.block_image', 'Зображення')}
          </span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove('up')}
            className="w-7 h-7 rounded-xl border-2 border-[#0A0A0A] bg-white flex items-center justify-center text-[#0A0A0A] disabled:opacity-30 cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            disabled={index === totalBlocks - 1}
            onClick={() => onMove('down')}
            className="w-7 h-7 rounded-xl border-2 border-[#0A0A0A] bg-white flex items-center justify-center text-[#0A0A0A] disabled:opacity-30 cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-xl border-2 border-rose-600 bg-rose-50 text-rose-700 flex items-center justify-center cursor-pointer hover:bg-rose-100 shadow-[1px_1px_0px_#0A0A0A]"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {block.type === 'paragraph' && (
        <textarea
          rows={4}
          placeholder={t('admin.blog.placeholder_paragraph', 'Введіть текст абзацу...')}
          value={block.text}
          onChange={(e) => onUpdate({ ...block, text: e.target.value })}
          className="w-full p-3 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none font-['Geist',sans-serif] leading-relaxed"
        />
      )}

      {block.type === 'heading' && (
        <div className="flex gap-2 items-center">
          <select
            value={block.level}
            onChange={(e) => onUpdate({ ...block, level: Number(e.target.value) })}
            className="px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] focus:outline-none shrink-0"
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            type="text"
            placeholder={t('admin.blog.placeholder_heading', 'Текст заголовка...')}
            value={block.text}
            onChange={(e) => onUpdate({ ...block, text: e.target.value })}
            className="flex-1 px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
          />
        </div>
      )}

      {block.type === 'quote' && (
        <div className="space-y-2.5">
          <textarea
            rows={3}
            placeholder={t('admin.blog.placeholder_quote', 'Текст цитати...')}
            value={block.text}
            onChange={(e) => onUpdate({ ...block, text: e.target.value })}
            className="w-full p-3 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium italic text-[#0A0A0A] focus:outline-none font-['Geist',sans-serif]"
          />
          <input
            type="text"
            placeholder={t(
              'admin.blog.placeholder_quote_author',
              'Автор цитати (напр. Стів Джобс або Експерт Launchly)...'
            )}
            value={block.author || ''}
            onChange={(e) => onUpdate({ ...block, author: e.target.value })}
            className="w-full px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
          />
        </div>
      )}

      {block.type === 'list' && (
        <div className="space-y-2.5">
          {block.items.map((item, itemIdx) => (
            <div key={itemIdx} className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400">•</span>
              <input
                type="text"
                placeholder={t('admin.blog.placeholder_list_item', { index: itemIdx + 1 })}
                value={item}
                onChange={(e) => {
                  const newItems = [...block.items];
                  newItems[itemIdx] = e.target.value;
                  onUpdate({ ...block, items: newItems });
                }}
                className="flex-1 px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none font-['Geist',sans-serif]"
              />
              <button
                type="button"
                onClick={() => {
                  const newItems = block.items.filter((_, i) => i !== itemIdx);
                  onUpdate({ ...block, items: newItems });
                }}
                className="w-7 h-7 rounded-lg border border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-600 flex items-center justify-center cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              onUpdate({ ...block, items: [...block.items, ''] });
            }}
            className="px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-slate-800 hover:bg-slate-100 cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
          >
            {t('admin.blog.btn_add_list_item', '+ Додати пункт списку')}
          </button>
        </div>
      )}

      {block.type === 'image' && (
        <div className="space-y-3">
          {block.url ? (
            <div className="relative rounded-2xl border-2 border-[#0A0A0A] overflow-hidden max-w-md aspect-[16/9] shadow-[3px_3px_0px_#0A0A0A] bg-slate-100 group">
              <img
                src={block.url}
                alt={block.caption || 'Block'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="px-3 py-1.5 bg-white text-[#0A0A0A] rounded-xl text-xs font-black uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:bg-slate-100 cursor-pointer">
                  {t('admin.blog.change_image', 'Змінити фото')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageUpload(file);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...block, url: '' })}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:bg-rose-700 cursor-pointer"
                >
                  {t('admin.blog.remove_image', 'Видалити фото')}
                </button>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-[#0A0A0A] rounded-2xl p-6 text-center bg-white hover:bg-slate-100 transition cursor-pointer flex flex-col items-center justify-center gap-2 block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                }}
              />
              {isUploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#0A0A0A]" size={24} />
                  <span className="text-xs font-bold text-slate-600">
                    {t('admin.blog.dropzone_uploading', 'Завантаження фото...')}
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A]">
                    <UploadCloud size={20} />
                  </div>
                  <div className="text-xs font-black uppercase text-[#0A0A0A]">
                    {t('admin.blog.dropzone_title', 'Перетягніть фото сюди або натисніть для вибору')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {t('admin.blog.dropzone_hint', 'PNG, JPG, WEBP або GIF (до 10 МБ)')}
                  </div>
                </>
              )}
            </label>
          )}

          <input
            type="text"
            placeholder={t(
              'admin.blog.placeholder_image_caption',
              "Підпис до зображення (необов'язково)..."
            )}
            value={block.caption || ''}
            onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
            className="w-full px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
