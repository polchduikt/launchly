import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useEdges, useReactFlow } from '@xyflow/react';
import type { ButtonData, FlowBlock } from '../../../../../../types/bot';
import { useNodeEditor, getBlocks } from '../../../../../../hooks/bot/useNodeEditor';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useTagsQuery } from '../../../../../../hooks/broadcast/useBroadcastQueries';
import { useCustomFieldsQuery } from '../../../../../../hooks/bot/useCustomFieldsQuery';
import { generateId } from '../../../../../../utils/id';
import { FLOW_DEFAULTS, TIMING } from '../../../../../../const/constants';
import {
  BlockHeader,
  AddBlockPalette,
  MessageTextBlock,
  MessageDelayBlock,
  MessageDataCollectionBlock,
  MessageMediaBlock,
  TelegramMenuEditor,
  LinkPopoverModal,
  EmojiPickerModal,
  textToHtml,
  htmlToText,
} from './message';

interface MessageNodeEditorProps {
  nodeId: string;
  editorState: ReturnType<typeof useNodeEditor>;
  onSelectNode?: (nodeId: string | null) => void;
}

export const MessageNodeEditor: React.FC<MessageNodeEditorProps> = React.memo(({
  nodeId,
  editorState,
  onSelectNode,
}) => {
  const {
    data,
    isUploading,
    fileInputRef,
    handleChange,
    handleAddButton,
    handleOpenEditButton,
    handleFileUpload,
    uploadingBlockId,
    setUploadingBlockId,
    uploadAccept,
    setUploadAccept,
    setIsNextStepDrawerOpen,
  } = editorState;

  const { setNodes, fitView } = useReactFlow();
  const edges = useEdges();
  const blocks = getBlocks(data);

  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);
  const { data: customFieldsData } = useCustomFieldsQuery(activeBotId);
  const customFields = useMemo(() => {
    return (customFieldsData?.fields || [])
      .map((f: unknown) => (typeof f === 'string' ? f : (f as { name?: string })?.name || ''))
      .filter((name): name is string => Boolean(name));
  }, [customFieldsData]);

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeLinkBlockId, setActiveLinkBlockId] = useState<string | null>(null);
  const [activeEmojiBlockId, setActiveEmojiBlockId] = useState<string | null>(null);
  const [linkStep, setLinkStep] = useState<'select' | 'form'>('select');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const [emojiCoords, setEmojiCoords] = useState<{ top: number; left: number } | null>(null);

  const lastSelectionRangeRef = useRef<Range | null>(null);
  const editingLinkElementRef = useRef<HTMLElement | null>(null);

  const handleJumpToNode = (targetId: string) => {
    if (onSelectNode) {
      onSelectNode(targetId);
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === targetId,
        }))
      );
      setTimeout(() => {
        fitView({
          nodes: [{ id: targetId }],
          duration: FLOW_DEFAULTS.FIT_VIEW_DURATION_MS,
          padding: FLOW_DEFAULTS.FIT_VIEW_PADDING,
        });
      }, TIMING.FOCUS_DELAY_MS);
    }
  };

  const addBlock = (type: 'text' | 'image' | 'delay' | 'data_collection' | 'file' | 'audio' | 'video' | 'telegram_menu') => {
    const newBlock: Record<string, unknown> = {
      id: generateId('block'),
      type,
    };
    if (type === 'text') {
      newBlock.text = '';
      newBlock.buttons = [];
    } else if (type === 'image') {
      newBlock.imageUrl = '';
      newBlock.buttons = [];
    } else if (type === 'delay') {
      newBlock.delaySeconds = FLOW_DEFAULTS.DELAY_SECONDS;
    } else if (type === 'data_collection') {
      newBlock.text = '';
      newBlock.variableName = '';
    } else if (type === 'file') {
      newBlock.fileUrl = '';
      newBlock.fileName = '';
      newBlock.buttons = [];
    } else if (type === 'audio') {
      newBlock.audioUrl = '';
      newBlock.buttons = [];
    } else if (type === 'video') {
      newBlock.videoUrl = '';
      newBlock.buttons = [];
    } else if (type === 'telegram_menu') {
      newBlock.buttons = [
        { label: 'Button 1', value: `btn_${Date.now()}_1`, row: '0' }
      ];
    }
    handleChange('blocks', [...blocks, newBlock]);
  };

  const duplicateBlock = (block: FlowBlock) => {
    const index = blocks.findIndex((b) => b.id === block.id);
    if (index === -1) return;

    const clonedBlock = {
      ...block,
      id: generateId('block'),
    };
    if (Array.isArray(clonedBlock.buttons)) {
      clonedBlock.buttons = clonedBlock.buttons.map((btn: ButtonData) => ({
        ...btn,
        value: generateId('btn'),
      }));
    }

    const updated = [...blocks];
    updated.splice(index + 1, 0, clonedBlock);
    handleChange('blocks', updated);
  };

  const deleteBlock = (id: string) => {
    handleChange('blocks', blocks.filter((b) => b.id !== id));
  };

  const moveBlockUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...blocks];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    handleChange('blocks', updated);
  };

  const moveBlockDown = (idx: number) => {
    if (idx === blocks.length - 1) return;
    const updated = [...blocks];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    handleChange('blocks', updated);
  };

  const updateBlockContent = (id: string, updates: Record<string, unknown>) => {
    const updated = blocks.map((b) => {
      if (b.id === id) {
        return { ...b, ...updates };
      }
      return b;
    });
    handleChange('blocks', updated);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!activeBlockId) return;
      const activeEl = document.getElementById(`block-container-${activeBlockId}`);
      if (activeEl && !activeEl.contains(e.target as Node)) {
        const clickedPortal = (e.target as Element).closest('.rounded-2xl.shadow-xl.flex');
        if (clickedPortal) return;

        setActiveBlockId(null);
        setActiveLinkBlockId(null);
        setActiveEmojiBlockId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeBlockId]);

  useEffect(() => {
    blocks.forEach((block) => {
      if (block.type === 'text') {
        const el = document.getElementById(`contenteditable-block-${block.id}`);
        if (el && activeBlockId !== block.id) {
          const currentText = htmlToText(el.innerHTML);
          if (currentText !== (block.text || '')) {
            el.innerHTML = textToHtml(block.text || '');
          }
        }
      }
    });
  }, [blocks, activeBlockId]);

  const saveSelectionRange = (blockId: string) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const el = document.getElementById(`contenteditable-block-${blockId}`);
      if (el && el.contains(range.commonAncestorContainer)) {
        lastSelectionRangeRef.current = range.cloneRange();
      }
    }
  };

  const handleContentEditableClick = (e: React.MouseEvent, blockId: string) => {
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
      setActiveLinkBlockId(blockId);
      setActiveEmojiBlockId(null);
    }
  };

  const handleOpenLinkPopover = (blockId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverCoords({
      top: rect.bottom + window.scrollY + 6,
      left: Math.max(10, Math.min(window.innerWidth - 340, rect.left + window.scrollX - 140)),
    });
    editingLinkElementRef.current = null;
    setActiveLinkBlockId(blockId);
    setActiveEmojiBlockId(null);
    setLinkUrl('');
    setLinkText('');
    setLinkStep('select');
  };

  const handleOpenEmojiPicker = (blockId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setEmojiCoords({
      top: rect.bottom + window.scrollY + 6,
      left: Math.max(10, Math.min(window.innerWidth - 380, rect.right + window.scrollX - 350)),
    });
    setActiveEmojiBlockId(blockId);
    setActiveLinkBlockId(null);
  };

  const handleContentEditableInput = (blockId: string) => {
    const el = document.getElementById(`contenteditable-block-${blockId}`);
    if (el) {
      const text = htmlToText(el.innerHTML);
      updateBlockContent(blockId, { text });
    }
  };

  const insertHtmlAtCursor = (html: string, blockId: string) => {
    const el = document.getElementById(`contenteditable-block-${blockId}`);
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
    updateBlockContent(blockId, { text });
    saveSelectionRange(blockId);
  };

  const handleDeleteLink = () => {
    if (editingLinkElementRef.current) {
      const parent = editingLinkElementRef.current.parentNode;
      if (parent) {
        const textNode = document.createTextNode(editingLinkElementRef.current.innerText);
        parent.replaceChild(textNode, editingLinkElementRef.current);
      }
      editingLinkElementRef.current = null;
      handleContentEditableInput(activeLinkBlockId || '');
    }
    setActiveLinkBlockId(null);
    setPopoverCoords(null);
  };

  const handleSaveLink = () => {
    if (editingLinkElementRef.current) {
      editingLinkElementRef.current.setAttribute('data-url', linkUrl.trim());
      editingLinkElementRef.current.innerText = linkText.trim() || linkUrl.trim();
      editingLinkElementRef.current = null;
      handleContentEditableInput(activeLinkBlockId || '');
    } else {
      const html = `<span class="text-blue-600 font-bold hover:underline cursor-pointer" contenteditable="false" data-type="link" data-url="${linkUrl.trim()}">${linkText.trim() || linkUrl.trim()}</span>`;
      insertHtmlAtCursor(html, activeLinkBlockId || '');
    }
    setActiveLinkBlockId(null);
    setPopoverCoords(null);
  };

  const handleTriggerUpload = (blockId: string, accept: string) => {
    setUploadAccept(accept);
    setUploadingBlockId(blockId);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  return (
    <div className="space-y-4 select-none">
      <input
        type="file"
        ref={fileInputRef}
        accept={uploadAccept}
        onChange={handleFileUpload}
        className="hidden"
      />
      <div className="space-y-3.5">
        {blocks.map((block, idx) => {
          const isUploadingThisBlock = isUploading && uploadingBlockId === block.id;

          return (
            <div
              key={block.id}
              id={`block-container-${block.id || ''}`}
              className="border-2 border-[#0A0A0A] rounded-3xl bg-white shadow-sm flex flex-col group/block transition-all relative overflow-hidden font-['JetBrains_Mono',monospace]"
            >
              <BlockHeader
                block={block}
                index={idx}
                totalBlocks={blocks.length}
                onMoveUp={moveBlockUp}
                onMoveDown={moveBlockDown}
                onDuplicate={duplicateBlock}
                onDelete={deleteBlock}
              />

              {block.type === 'text' && (
                <MessageTextBlock
                  block={block}
                  nodeId={nodeId}
                  edges={edges}
                  activeBlockId={activeBlockId}
                  setActiveBlockId={setActiveBlockId}
                  onContentEditableInput={handleContentEditableInput}
                  onSaveSelectionRange={saveSelectionRange}
                  onContentEditableClick={handleContentEditableClick}
                  onOpenLinkPopover={handleOpenLinkPopover}
                  onOpenEmojiPicker={handleOpenEmojiPicker}
                  onInsertHtml={insertHtmlAtCursor}
                  onOpenEditButton={handleOpenEditButton}
                  onAddButton={handleAddButton}
                  onJumpToNode={handleJumpToNode}
                  onAddTelegramMenu={() => addBlock('telegram_menu')}
                  hasTelegramMenu={blocks.some((b) => b.type === 'telegram_menu')}
                  customFields={customFields}
                  tags={tags}
                />
              )}

              {block.type === 'image' && (
                <MessageMediaBlock
                  block={block}
                  type="image"
                  nodeId={nodeId}
                  edges={edges}
                  isUploadingThisBlock={isUploadingThisBlock}
                  onUploadClick={(accept) => handleTriggerUpload(block.id, accept)}
                  onUpdateBlockContent={updateBlockContent}
                  onOpenEditButton={handleOpenEditButton}
                  onAddButton={handleAddButton}
                  onJumpToNode={handleJumpToNode}
                />
              )}

              {block.type === 'delay' && (
                <MessageDelayBlock
                  block={block}
                  onUpdateDelay={(delaySeconds) => updateBlockContent(block.id, { delaySeconds })}
                />
              )}

              {block.type === 'data_collection' && (
                <MessageDataCollectionBlock
                  block={block}
                  onUpdateText={(text) => updateBlockContent(block.id, { text })}
                  onOpenEditDataCollection={editorState.handleOpenEditDataCollection}
                />
              )}

              {block.type === 'file' && (
                <MessageMediaBlock
                  block={block}
                  type="file"
                  nodeId={nodeId}
                  edges={edges}
                  isUploadingThisBlock={isUploadingThisBlock}
                  onUploadClick={(accept) => handleTriggerUpload(block.id, accept)}
                  onUpdateBlockContent={updateBlockContent}
                  onOpenEditButton={handleOpenEditButton}
                  onAddButton={handleAddButton}
                  onJumpToNode={handleJumpToNode}
                />
              )}

              {block.type === 'audio' && (
                <MessageMediaBlock
                  block={block}
                  type="audio"
                  nodeId={nodeId}
                  edges={edges}
                  isUploadingThisBlock={isUploadingThisBlock}
                  onUploadClick={(accept) => handleTriggerUpload(block.id, accept)}
                  onUpdateBlockContent={updateBlockContent}
                  onOpenEditButton={handleOpenEditButton}
                  onAddButton={handleAddButton}
                  onJumpToNode={handleJumpToNode}
                />
              )}

              {block.type === 'video' && (
                <MessageMediaBlock
                  block={block}
                  type="video"
                  nodeId={nodeId}
                  edges={edges}
                  isUploadingThisBlock={isUploadingThisBlock}
                  onUploadClick={(accept) => handleTriggerUpload(block.id, accept)}
                  onUpdateBlockContent={updateBlockContent}
                  onOpenEditButton={handleOpenEditButton}
                  onAddButton={handleAddButton}
                  onJumpToNode={handleJumpToNode}
                />
              )}

              {block.type === 'telegram_menu' && (
                <TelegramMenuEditor
                  blockId={block.id}
                  buttons={(block.buttons || []) as ButtonData[]}
                  nodeId={nodeId}
                  edges={edges}
                  onOpenEditButton={handleOpenEditButton}
                  onJumpToNode={handleJumpToNode}
                  onUpdateButtons={(bId, btns) => updateBlockContent(bId, { buttons: btns })}
                />
              )}
            </div>
          );
        })}
      </div>

      <AddBlockPalette
        onAddBlock={addBlock}
        onOpenNextStep={() => setIsNextStepDrawerOpen(true)}
      />

      <LinkPopoverModal
        isOpen={Boolean(activeLinkBlockId && popoverCoords)}
        coords={popoverCoords}
        linkStep={linkStep}
        setLinkStep={setLinkStep}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        linkText={linkText}
        setLinkText={setLinkText}
        isEditingExistingLink={Boolean(editingLinkElementRef.current)}
        onClose={() => {
          setActiveLinkBlockId(null);
          setPopoverCoords(null);
        }}
        onDeleteLink={handleDeleteLink}
        onSaveLink={handleSaveLink}
      />

      <EmojiPickerModal
        isOpen={Boolean(activeEmojiBlockId && emojiCoords)}
        coords={emojiCoords}
        onClose={() => {
          setActiveEmojiBlockId(null);
          setEmojiCoords(null);
        }}
        onSelectEmoji={(emoji) => {
          if (activeEmojiBlockId) {
            insertHtmlAtCursor(emoji, activeEmojiBlockId);
            setActiveEmojiBlockId(null);
            setEmojiCoords(null);
          }
        }}
      />
    </div>
  );
});
