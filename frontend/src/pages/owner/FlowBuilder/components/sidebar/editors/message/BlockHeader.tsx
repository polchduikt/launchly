import React from 'react';
import {
  AlignLeft,
  Image as ImageIcon,
  Clock,
  Database,
  Paperclip,
  Volume2,
  Video,
  Grid,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from 'lucide-react';
import type { FlowBlock } from '../../../../../../../types/bot';
import { t } from '../../../../../../../i18n/config';

export interface BlockHeaderProps {
  block: FlowBlock;
  index: number;
  totalBlocks: number;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onDuplicate: (block: FlowBlock) => void;
  onDelete: (id: string) => void;
}

export const BlockHeader: React.FC<BlockHeaderProps> = ({
  block,
  index,
  totalBlocks,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}) => {
  return (
    <div className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] px-4 py-2.5 flex items-center justify-between rounded-t-[22px]">
      <div className="flex items-center gap-2">
        <span className="text-[#0A0A0A] shrink-0">
          {block.type === 'text' && <AlignLeft size={13} />}
          {block.type === 'image' && <ImageIcon size={13} className="text-[#0A0A0A]" />}
          {block.type === 'delay' && <Clock size={13} className="text-[#0A0A0A]" />}
          {block.type === 'data_collection' && <Database size={13} className="text-[#0A0A0A]" />}
          {block.type === 'file' && <Paperclip size={13} className="text-[#0A0A0A]" />}
          {block.type === 'audio' && <Volume2 size={13} className="text-[#0A0A0A]" />}
          {block.type === 'video' && <Video size={13} className="text-[#0A0A0A]" />}
          {block.type === 'telegram_menu' && <Grid size={13} className="text-[#0A0A0A]" />}
        </span>
        <span className="text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
          {block.type === 'text' && t('flow_builder.text_block')}
          {block.type === 'image' && t('flow_builder.image_block')}
          {block.type === 'delay' && t('flow_builder.delay_block')}
          {block.type === 'data_collection' && t('flow_builder.data_collection')}
          {block.type === 'file' && t('flow_builder.file_block')}
          {block.type === 'audio' && t('flow_builder.audio_block')}
          {block.type === 'video' && t('flow_builder.video_block')}
          {block.type === 'telegram_menu' && (
            <span className="inline-flex items-center gap-1 normal-case font-black text-[#0A0A0A]">
              <span>{t('flow_builder.telegram_menu_block')}</span>
              <span title="Group buttons into rows. Buttons in the same row appear side-by-side in Telegram. Drag and drop to reorder.">
                <HelpCircle
                  size={12}
                  className="text-[#0A0A0A]/60 cursor-pointer hover:text-[#0A0A0A] transition-colors ml-0.5"
                />
              </span>
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-70 group-hover/block:opacity-100 transition-opacity">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMoveUp(index)}
          className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded transition-colors text-[#0A0A0A] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <ArrowUp size={12} className="stroke-[2.5]" />
        </button>
        <button
          type="button"
          disabled={index === totalBlocks - 1}
          onClick={() => onMoveDown(index)}
          className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded transition-colors text-[#0A0A0A] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <ArrowDown size={12} className="stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(block)}
          className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded transition-colors text-[#0A0A0A] cursor-pointer"
        >
          <Copy size={12} className="stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(block.id || '')}
          className="p-1 hover:bg-rose-600 hover:text-white rounded transition-colors text-[#0A0A0A] cursor-pointer"
        >
          <Trash2 size={12} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
