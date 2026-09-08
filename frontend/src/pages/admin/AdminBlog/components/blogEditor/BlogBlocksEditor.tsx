import React from 'react';
import { Type, Heading2, Heading3, Quote, List as ListIcon, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '../../../../../i18n/config';
import type { ContentBlock } from './types';
import { BlockItemEditor } from './BlockItemEditor';

interface BlogBlocksEditorProps {
  formBlocks: ContentBlock[];
  onAddBlock: (type: 'paragraph' | 'h2' | 'h3' | 'quote' | 'list' | 'image') => void;
  onUpdateBlock: (index: number, updated: ContentBlock) => void;
  onRemoveBlock: (index: number) => void;
  onMoveBlock: (index: number, direction: 'up' | 'down') => void;
  onBlockImageUpload: (index: number, file: File) => void;
  uploadingBlockIndex: number | null;
}

export const BlogBlocksEditor: React.FC<BlogBlocksEditorProps> = ({
  formBlocks,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  onBlockImageUpload,
  uploadingBlockIndex,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-100">
        <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('admin.blog.sec_blocks', '2. Блоки статті')} ({formBlocks.length})
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onAddBlock('paragraph')}
            className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
          >
            <Type size={13} />
            <span>{t('admin.blog.btn_add_paragraph', '+ Абзац')}</span>
          </button>
          <button
            type="button"
            onClick={() => onAddBlock('h2')}
            className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
          >
            <Heading2 size={13} />
            <span>{t('admin.blog.btn_add_h2', '+ Заголовок H2')}</span>
          </button>
          <button
            type="button"
            onClick={() => onAddBlock('h3')}
            className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
          >
            <Heading3 size={13} />
            <span>{t('admin.blog.btn_add_h3', '+ H3')}</span>
          </button>
          <button
            type="button"
            onClick={() => onAddBlock('quote')}
            className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
          >
            <Quote size={13} />
            <span>{t('admin.blog.btn_add_quote', '+ Цитата')}</span>
          </button>
          <button
            type="button"
            onClick={() => onAddBlock('list')}
            className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
          >
            <ListIcon size={13} />
            <span>{t('admin.blog.btn_add_list', '+ Список')}</span>
          </button>
          <button
            type="button"
            onClick={() => onAddBlock('image')}
            className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
          >
            <ImageIcon size={13} />
            <span>{t('admin.blog.btn_add_image', '+ Зображення')}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {formBlocks.map((block, idx) => (
          <BlockItemEditor
            key={idx}
            block={block}
            index={idx}
            totalBlocks={formBlocks.length}
            onUpdate={(updated) => onUpdateBlock(idx, updated)}
            onRemove={() => onRemoveBlock(idx)}
            onMove={(dir) => onMoveBlock(idx, dir)}
            onImageUpload={(file) => onBlockImageUpload(idx, file)}
            isUploadingImage={uploadingBlockIndex === idx}
          />
        ))}
      </div>
    </div>
  );
};
