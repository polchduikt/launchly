import React from 'react';
import type { FlowBlock, ButtonData } from '../../../../../../../types/bot';
import { MessageMediaUploader } from './MessageMediaUploader';
import { BlockActionButtons } from './BlockActionButtons';

export interface MessageMediaBlockProps {
  block: FlowBlock;
  type: 'image' | 'file' | 'audio' | 'video';
  nodeId: string;
  edges: Array<{ source: string; sourceHandle?: string | null; target: string }>;
  isUploadingThisBlock: boolean;
  onUploadClick: (accept: string) => void;
  onUpdateBlockContent: (id: string, updates: Record<string, unknown>) => void;
  onOpenEditButton: (btn: ButtonData, blockId: string) => void;
  onAddButton: (blockId: string) => void;
  onJumpToNode: (targetNodeId: string) => void;
}

export const MessageMediaBlock: React.FC<MessageMediaBlockProps> = ({
  block,
  type,
  nodeId,
  edges,
  isUploadingThisBlock,
  onUploadClick,
  onUpdateBlockContent,
  onOpenEditButton,
  onAddButton,
  onJumpToNode,
}) => {
  const blockBtns = (block.buttons || []) as ButtonData[];

  const getMediaUrl = () => {
    switch (type) {
      case 'image': return block.imageUrl;
      case 'file': return block.fileUrl;
      case 'audio': return block.audioUrl;
      case 'video': return block.videoUrl;
    }
  };

  const getAccept = () => {
    switch (type) {
      case 'image': return 'image/*';
      case 'file': return '*/*';
      case 'audio': return 'audio/*';
      case 'video': return 'video/*';
    }
  };

  const handleUrlChange = (url: string) => {
    switch (type) {
      case 'image': onUpdateBlockContent(block.id, { imageUrl: url }); break;
      case 'file': onUpdateBlockContent(block.id, { fileUrl: url }); break;
      case 'audio': onUpdateBlockContent(block.id, { audioUrl: url }); break;
      case 'video': onUpdateBlockContent(block.id, { videoUrl: url }); break;
    }
  };

  const handleDeleteMedia = () => {
    switch (type) {
      case 'image': onUpdateBlockContent(block.id, { imageUrl: '' }); break;
      case 'file': onUpdateBlockContent(block.id, { fileUrl: '', fileName: '' }); break;
      case 'audio': onUpdateBlockContent(block.id, { audioUrl: '' }); break;
      case 'video': onUpdateBlockContent(block.id, { videoUrl: '' }); break;
    }
  };

  return (
    <div className="p-4 space-y-3">
      <MessageMediaUploader
        type={type}
        url={getMediaUrl()}
        fileName={type === 'file' ? block.fileName : undefined}
        isUploading={isUploadingThisBlock}
        onUploadClick={() => onUploadClick(getAccept())}
        onUrlChange={handleUrlChange}
        onDeleteMedia={handleDeleteMedia}
      />

      <BlockActionButtons
        blockId={block.id}
        buttons={blockBtns}
        nodeId={nodeId}
        edges={edges}
        onOpenEditButton={onOpenEditButton}
        onAddButton={onAddButton}
        onJumpToNode={onJumpToNode}
      />
    </div>
  );
};
