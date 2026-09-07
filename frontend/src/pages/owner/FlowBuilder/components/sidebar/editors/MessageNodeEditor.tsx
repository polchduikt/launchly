import React, { useState, useMemo } from 'react';
import { useClickOutside } from '../../../../../../hooks/useClickOutside';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Smile, 
  Link as LinkIcon, 
  Parentheses, 
  AlignLeft, 
  Clock, 
  Database, 
  ArrowUp, 
  ArrowDown, 
  Copy,
  ArrowRight,
  Paperclip,
  Volume2,
  Video,
  MoreHorizontal,
  Grid,
  HelpCircle,
  X,
  MessageSquare
} from 'lucide-react';
import { useEdges, useReactFlow } from '@xyflow/react';
import type { ButtonData, FlowBlock } from '../../../../../../types/bot';
import { useNodeEditor, getBlocks } from '../../../../../../hooks/bot/useNodeEditor';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useTagsQuery } from '../../../../../../hooks/broadcast/useBroadcastQueries';
import { t } from '../../../../../../i18n/config';
import { FieldVariableSelector } from './FieldVariableSelector';
import { MessageMediaUploader } from './message/MessageMediaUploader';
import { TelegramMenuEditor } from './message/TelegramMenuEditor';
import { BlockActionButtons } from './message/BlockActionButtons';
import { useCustomFieldsQuery } from '../../../../../../hooks/bot/useCustomFieldsQuery';
import emojiData from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { generateId } from '../../../../../../utils/id';
import { FLOW_DEFAULTS, TIMING } from '../../../../../../const/constants';

interface MessageNodeEditorProps {
  nodeId: string;
  editorState: ReturnType<typeof useNodeEditor>;
  onSelectNode?: (nodeId: string | null) => void;
}

export const MessageNodeEditor: React.FC<MessageNodeEditorProps> = ({ 
  nodeId, 
  editorState,
  onSelectNode 
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

  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreContainerRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(moreContainerRef, () => setIsMoreOpen(false), isMoreOpen);

  const { setNodes, fitView } = useReactFlow();
  const edges = useEdges();
  const blocks = getBlocks(data);

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
    const updated = blocks.filter((b) => b.id !== id);
    handleChange('blocks', updated);
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

  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeLinkBlockId, setActiveLinkBlockId] = useState<string | null>(null);
  const [activeEmojiBlockId, setActiveEmojiBlockId] = useState<string | null>(null);
  const [linkStep, setLinkStep] = useState<'select' | 'form'>('select');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  React.useEffect(() => {
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

  React.useEffect(() => {
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

  const { data: customFieldsData } = useCustomFieldsQuery(activeBotId);
  const customFields = useMemo(() => {
    return (customFieldsData?.fields || []).map((f) => f.name);
  }, [customFieldsData]);

  const lastSelectionRangeRef = React.useRef<Range | null>(null);
  const editingLinkElementRef = React.useRef<HTMLElement | null>(null);

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

  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const [emojiCoords, setEmojiCoords] = useState<{ top: number; left: number } | null>(null);

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

  const textToHtml = (text: string) => {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const varRegex = /\{\{\{?(.*?)\}?\}\}/g;
    escaped = escaped.replace(varRegex, (_match, p1) => {
      const rawName = p1.trim();
      let displayName = rawName;
      if (rawName === 'first_name') displayName = 'First Name';
      else if (rawName === 'last_name') displayName = 'Last Name';
      else if (rawName === 'phone') displayName = 'Phone';
      else if (rawName === 'email') displayName = 'Email';
      else if (rawName === 'telegram_username') displayName = 'Telegram Username';
      else if (rawName === 'telegram_user_id') displayName = 'Telegram User ID';
      else if (rawName === 'contact_id') displayName = 'Contact Id';
      else if (rawName === 'subscribed') displayName = 'Subscribed';

      return `<span class="inline-flex items-center bg-blue-600 text-white rounded px-1.5 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline" contenteditable="false" data-type="variable" data-val="${rawName}">${displayName}</span>`;
    });

    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    escaped = escaped.replace(mdLinkRegex, (_match, p1, p2) => {
      return `<span class="text-blue-600 font-bold hover:underline cursor-pointer" contenteditable="false" data-type="link" data-url="${p2}">${p1}</span>`;
    });

    return escaped;
  };

  const htmlToText = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const parseNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue || '';
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.getAttribute('data-type') === 'variable') {
          const val = el.getAttribute('data-val') || '';
          return `{{${val}}}`;
        }
        if (el.getAttribute('data-type') === 'link') {
          const url = el.getAttribute('data-url') || '';
          const text = el.innerText || '';
          return `[${text}](${url})`;
        }
        if (el.tagName === 'BR') {
          return '\n';
        }
        if (el.tagName === 'DIV' || el.tagName === 'P') {
          let childText = '';
          for (let i = 0; i < el.childNodes.length; i++) {
            childText += parseNode(el.childNodes[i]);
          }
          return '\n' + childText;
        }
        
        let childText = '';
        for (let i = 0; i < el.childNodes.length; i++) {
          childText += parseNode(el.childNodes[i]);
        }
        return childText;
      }
      return '';
    };

    let text = '';
    for (let i = 0; i < tempDiv.childNodes.length; i++) {
      text += parseNode(tempDiv.childNodes[i]);
    }
    return text.replace(/^\n/, '');
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
          const blockBtns = (block.buttons || []) as ButtonData[];
          const isUploadingThisBlock = isUploading && uploadingBlockId === block.id;

          return (
            <div 
              key={block.id} 
              id={`block-container-${block.id || ''}`}
              className="border-2 border-ink rounded-3xl bg-white shadow-sm flex flex-col group/block transition-all relative overflow-hidden font-['JetBrains_Mono',monospace]"
            >
              <div className="bg-canvas border-b-2 border-ink px-4 py-2.5 flex items-center justify-between rounded-t-[22px]">
                <div className="flex items-center gap-2">
                  <span className="text-ink shrink-0">
                    {block.type === 'text' && <AlignLeft size={13} />}
                    {block.type === 'image' && <ImageIcon size={13} className="text-ink" />}
                    {block.type === 'delay' && <Clock size={13} className="text-ink" />}
                    {block.type === 'data_collection' && <Database size={13} className="text-ink" />}
                    {block.type === 'file' && <Paperclip size={13} className="text-ink" />}
                    {block.type === 'audio' && <Volume2 size={13} className="text-ink" />}
                    {block.type === 'video' && <Video size={13} className="text-ink" />}
                    {block.type === 'telegram_menu' && <Grid size={13} className="text-ink" />}
                  </span>
                  <span className="text-[10px] font-black text-ink uppercase tracking-wider font-['Anybody',sans-serif]">
                    {block.type === 'text' && t('flow_builder.text_block')}
                    {block.type === 'image' && t('flow_builder.image_block')}
                    {block.type === 'delay' && t('flow_builder.delay_block')}
                    {block.type === 'data_collection' && t('flow_builder.data_collection')}
                    {block.type === 'file' && t('flow_builder.file_block')}
                    {block.type === 'audio' && t('flow_builder.audio_block')}
                    {block.type === 'video' && t('flow_builder.video_block')}
                    {block.type === 'telegram_menu' && (
                      <span className="inline-flex items-center gap-1 normal-case font-black text-ink">
                        <span>{t('flow_builder.telegram_menu_block')}</span>
                        <span title="Group buttons into rows. Buttons in the same row appear side-by-side in Telegram. Drag and drop to reorder.">
                          <HelpCircle 
                            size={12} 
                            className="text-ink/60 cursor-pointer hover:text-ink transition-colors ml-0.5"
                          />
                        </span>
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-70 group-hover/block:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-1 hover:bg-ink hover:text-canvas rounded transition-colors text-ink disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ArrowUp size={12} className="stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === blocks.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-1 hover:bg-ink hover:text-canvas rounded transition-colors text-ink disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ArrowDown size={12} className="stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateBlock(block)}
                    className="p-1 hover:bg-ink hover:text-canvas rounded transition-colors text-ink cursor-pointer"
                  >
                    <Copy size={12} className="stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(block.id || '')}
                    className="p-1 hover:bg-rose-600 hover:text-white rounded transition-colors text-ink cursor-pointer"
                  >
                    <Trash2 size={12} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {block.type === 'text' && (
                <div className="flex flex-col">
                  <div 
                    className="bg-white p-4 pb-2 relative flex flex-col min-h-[110px]"
                    onFocus={() => setActiveBlockId(block.id || '')}
                  >
                    <div
                      id={`contenteditable-block-${block.id || ''}`}
                      contentEditable
                      onInput={() => handleContentEditableInput(block.id || '')}
                      onKeyUp={() => saveSelectionRange(block.id || '')}
                      onMouseUp={() => saveSelectionRange(block.id || '')}
                      onFocus={() => {
                        setActiveBlockId(block.id || '');
                      }}
                      onClick={(e) => handleContentEditableClick(e, block.id || '')}
                      data-placeholder={t('editor.message.text_placeholder')}
                      className="w-full text-xs font-bold text-ink focus:outline-none bg-transparent min-h-[80px] cursor-text break-words outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-ink/40 empty:before:pointer-events-none font-['JetBrains_Mono',monospace]"
                    />
                    
                    {activeBlockId === block.id && (
                      <div className="absolute bottom-2.5 right-3 bg-ink text-canvas border-2 border-ink px-3 py-1.5 rounded-full flex items-center gap-2.5 shadow-md z-30 font-['JetBrains_Mono',monospace]">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => handleOpenLinkPopover(block.id || '', e)}
                          className="hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <LinkIcon size={13} className="stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => handleOpenEmojiPicker(block.id || '', e)}
                          className="hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Smile size={13} className="stroke-[2.5]" />
                        </button>
                        <FieldVariableSelector
                          onSelect={(val) => {
                            const displayName = val === 'first_name' ? 'First Name'
                                              : val === 'last_name' ? 'Last Name'
                                              : val === 'phone' ? 'Phone'
                                              : val === 'email' ? 'Email'
                                              : val === 'telegram_username' ? 'Telegram Username'
                                              : val === 'telegram_user_id' ? 'Telegram User ID'
                                              : val === 'contact_id' ? 'Contact Id'
                                              : val === 'subscribed' ? 'Subscribed'
                                              : val;
                            const html = `<span class="inline-flex items-center bg-ink text-canvas rounded-lg px-2 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline border border-ink" contenteditable="false" data-type="variable" data-val="${val}">${displayName}</span>`;
                            insertHtmlAtCursor(html, block.id || '');
                            setActiveLinkBlockId(null);
                            setActiveEmojiBlockId(null);
                          }}
                          customFields={customFields}
                          tags={tags}
                          mode="variable"
                          position="bottom"
                          trigger={
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setActiveLinkBlockId(null);
                                setActiveEmojiBlockId(null);
                              }}
                              className="hover:text-amber-300 transition-colors cursor-pointer flex items-center"
                              title="Variables"
                            >
                              <Parentheses size={12} className="stroke-[2.5]" />
                            </button>
                          }
                        />
                        <div className="w-[1px] h-3.5 bg-white/30 my-0.5" />
                        <span className="text-[10px] font-extrabold tracking-wider text-canvas/80 font-mono">
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
                              onClick={() => handleOpenEditButton(btn, block.id)}
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
                                    handleJumpToNode(targetNodeId);
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
                      onClick={() => handleAddButton(block.id)}
                      className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-250 hover:border-slate-350 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{t('flow_builder.btn_add_button')}</span>
                    </button>

                    {!blocks.some((b) => b.type === 'telegram_menu') && (
                      <button
                        type="button"
                        onClick={() => addBlock('telegram_menu')}
                        className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1.5"
                      >
                        <Plus size={13} />
                        <span>{t('flow_builder.btn_telegram_menu')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {block.type === 'image' && (
                <div className="p-4 space-y-3">
                  <MessageMediaUploader
                    type="image"
                    url={block.imageUrl}
                    isUploading={isUploadingThisBlock}
                    onUploadClick={() => {
                      setUploadAccept('image/*');
                      setUploadingBlockId(block.id);
                      setTimeout(() => {
                        fileInputRef.current?.click();
                      }, 50);
                    }}
                    onUrlChange={(imageUrl) => updateBlockContent(block.id, { imageUrl })}
                    onDeleteMedia={() => updateBlockContent(block.id, { imageUrl: '' })}
                  />

                  <BlockActionButtons
                    blockId={block.id}
                    buttons={blockBtns}
                    nodeId={nodeId}
                    edges={edges}
                    onOpenEditButton={handleOpenEditButton}
                    onAddButton={handleAddButton}
                    onJumpToNode={handleJumpToNode}
                  />
                </div>
              )}

              {block.type === 'delay' && (
                <div className="p-4 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-600 font-semibold">{t('editor.message.delay_duration')}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={block.delaySeconds || FLOW_DEFAULTS.DELAY_SECONDS}
                      onChange={(e) => updateBlockContent(block.id, { delaySeconds: Math.max(1, parseInt(e.target.value) || FLOW_DEFAULTS.DELAY_SECONDS) })}
                      className="w-16 px-2.5 py-1.5 border border-slate-205 rounded-xl text-xs font-bold text-center bg-slate-50/50 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-500 font-bold">{t('editor.message.seconds')}</span>
                  </div>
                </div>
              )}

              {block.type === 'data_collection' && (
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      {t('editor.message.question_to_ask')}
                    </label>
                    <textarea
                      value={block.text || ''}
                      onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                      placeholder={t('editor.message.question_placeholder')}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20 resize-none"
                    />
                  </div>
                  
                  <div className="pt-1.5 flex flex-col items-center select-none nodrag">
                    <button
                      type="button"
                      onClick={() => {
                        if (editorState.handleOpenEditDataCollection) {
                          editorState.handleOpenEditDataCollection(block);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-50/30 hover:bg-indigo-50 border border-dashed border-indigo-400 text-indigo-700 text-[11px] font-extrabold rounded-2xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Database size={12} />
                      <span>{t('editor.message.contact_reply', { type: typeof block.replyType === 'string' ? block.replyType : 'Text' })}</span>
                    </button>
                    <span className="text-[9px] font-semibold text-slate-400 mt-2 block text-center leading-normal">
                      {t('editor.message.reply_note')}
                    </span>
                  </div>
                </div>
              )}
              {block.type === 'file' && (
                <div className="p-4 space-y-3">
                  <MessageMediaUploader
                    type="file"
                    url={block.fileUrl}
                    fileName={block.fileName}
                    isUploading={isUploadingThisBlock}
                    onUploadClick={() => {
                      setUploadAccept('*/*');
                      setUploadingBlockId(block.id);
                      setTimeout(() => {
                        fileInputRef.current?.click();
                      }, 50);
                    }}
                    onUrlChange={(fileUrl) => updateBlockContent(block.id, { fileUrl })}
                    onDeleteMedia={() => updateBlockContent(block.id, { fileUrl: '', fileName: '' })}
                  />

                  <BlockActionButtons
                    blockId={block.id}
                    buttons={blockBtns}
                    nodeId={nodeId}
                    edges={edges}
                    onOpenEditButton={handleOpenEditButton}
                    onAddButton={handleAddButton}
                    onJumpToNode={handleJumpToNode}
                  />
                </div>
              )}

              {block.type === 'audio' && (
                <div className="p-4 space-y-3">
                  <MessageMediaUploader
                    type="audio"
                    url={block.audioUrl}
                    isUploading={isUploadingThisBlock}
                    onUploadClick={() => {
                      setUploadAccept('audio/*');
                      setUploadingBlockId(block.id);
                      setTimeout(() => {
                        fileInputRef.current?.click();
                      }, 50);
                    }}
                    onUrlChange={(audioUrl) => updateBlockContent(block.id, { audioUrl })}
                    onDeleteMedia={() => updateBlockContent(block.id, { audioUrl: '' })}
                  />

                  <BlockActionButtons
                    blockId={block.id}
                    buttons={blockBtns}
                    nodeId={nodeId}
                    edges={edges}
                    onOpenEditButton={handleOpenEditButton}
                    onAddButton={handleAddButton}
                    onJumpToNode={handleJumpToNode}
                  />
                </div>
              )}

              {block.type === 'video' && (
                <div className="p-4 space-y-3">
                  <MessageMediaUploader
                    type="video"
                    url={block.videoUrl}
                    isUploading={isUploadingThisBlock}
                    onUploadClick={() => {
                      setUploadAccept('video/*');
                      setUploadingBlockId(block.id);
                      setTimeout(() => {
                        fileInputRef.current?.click();
                      }, 50);
                    }}
                    onUrlChange={(videoUrl) => updateBlockContent(block.id, { videoUrl })}
                    onDeleteMedia={() => updateBlockContent(block.id, { videoUrl: '' })}
                  />

                  <BlockActionButtons
                    blockId={block.id}
                    buttons={blockBtns}
                    nodeId={nodeId}
                    edges={edges}
                    onOpenEditButton={handleOpenEditButton}
                    onAddButton={handleAddButton}
                    onJumpToNode={handleJumpToNode}
                  />
                </div>
              )}

              {block.type === 'telegram_menu' && (
                <TelegramMenuEditor
                  blockId={block.id}
                  buttons={blockBtns}
                  nodeId={nodeId}
                  edges={edges}
                  onOpenEditButton={handleOpenEditButton}
                  onJumpToNode={handleJumpToNode}
                  onUpdateButtons={(bId, buttons) => updateBlockContent(bId, { buttons })}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
          {t('ai.builder.add_content_blocks_header')}
        </span>
        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={() => addBlock('text')}
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
            onClick={() => addBlock('image')}
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
            onClick={() => addBlock('delay')}
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
            onClick={() => addBlock('data_collection')}
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
                    addBlock('file');
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
                    addBlock('audio');
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
                    addBlock('video');
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
          onClick={() => setIsNextStepDrawerOpen(true)}
          className="w-full py-2.5 bg-white hover:bg-indigo-50/30 border border-indigo-200 hover:border-indigo-450 text-indigo-650 hover:text-indigo-700 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm select-none"
        >
          {t('ai.builder.choose_next_step')}
        </button>
      </div>

      {activeLinkBlockId && popoverCoords && createPortal(
        <>
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => {
              setActiveLinkBlockId(null);
              setPopoverCoords(null);
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              zIndex: 99999,
            }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
            className="bg-canvas border-2 border-ink rounded-3xl shadow-2xl p-4 w-80 text-ink space-y-3 text-left font-['JetBrains_Mono',monospace] animate-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center pb-1.5 border-b-2 border-ink/20">
              <span className="text-[10px] font-black text-ink uppercase tracking-wider font-['Anybody',sans-serif]">
                {t('editor.message.link_clicked')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveLinkBlockId(null);
                  setPopoverCoords(null);
                }}
                className="p-1 hover:bg-ink hover:text-canvas border-2 border-ink rounded-xl text-ink cursor-pointer transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            {linkStep === 'select' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.stopPropagation(); setLinkStep('form'); }}
                  className="flex items-center gap-2.5 w-full p-3 bg-white hover:bg-ink hover:text-canvas border-2 border-ink rounded-2xl text-xs font-bold text-ink transition-colors text-left cursor-pointer group"
                >
                  <LinkIcon size={14} className="shrink-0" />
                  <span>{t('editor.edit_button.action.open_website')}</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2.5 w-full p-3 border-2 border-ink/30 bg-canvas/50 text-ink/40 rounded-2xl text-xs font-bold text-left cursor-not-allowed"
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span>{t('editor.message.open_messenger')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white border-2 border-ink rounded-2xl px-3 py-2 text-xs text-ink font-bold">
                  <div className="flex items-center gap-2">
                    <LinkIcon size={12} />
                    <span>{t('editor.edit_button.action.open_website')}</span>
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.stopPropagation(); setLinkStep('select'); }}
                    className="p-0.5 hover:bg-ink hover:text-canvas rounded text-ink cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-ink uppercase tracking-wider block font-['Anybody',sans-serif]">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="https://yourwebsite.com"
                    className="w-full border-2 border-ink rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white text-ink placeholder:text-ink/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-ink uppercase tracking-wider block font-['Anybody',sans-serif]">
                    Link text
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Click here"
                    className="w-full border-2 border-ink rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white text-ink placeholder:text-ink/40"
                  />
                </div>

                <div className="flex gap-2 pt-1 font-['JetBrains_Mono',monospace]">
                  {editingLinkElementRef.current && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => {
                        e.stopPropagation();
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
                      }}
                      className="flex-1 py-2 bg-white hover:bg-rose-50 border-2 border-rose-600 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!linkUrl.trim()}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => {
                      e.stopPropagation();
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
                    }}
                    className="flex-1 py-2.5 bg-ink hover:bg-ink/90 disabled:bg-ink/20 text-canvas text-xs font-black rounded-xl border-2 border-ink transition-all cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider font-['Anybody',sans-serif]"
                  >
                    Save link
                  </button>
                </div>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {activeEmojiBlockId && emojiCoords && createPortal(
        <>
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => {
              setActiveEmojiBlockId(null);
              setEmojiCoords(null);
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: `${emojiCoords.top}px`,
              left: `${emojiCoords.left}px`,
              zIndex: 99999,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="shadow-2xl rounded-3xl overflow-hidden border-2 border-ink bg-white animate-in zoom-in-95 duration-150 font-['JetBrains_Mono',monospace]"
          >
            <Picker
              data={emojiData}
              onEmojiSelect={(emoji: { native?: string }) => {
                insertHtmlAtCursor(emoji.native ?? '', activeEmojiBlockId);
                setActiveEmojiBlockId(null);
                setEmojiCoords(null);
              }}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
              perLine={8}
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
