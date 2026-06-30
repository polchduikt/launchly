import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Smile, 
  Link as LinkIcon, 
  Parentheses, 
  Loader2, 
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
import type { ButtonData } from '../../../../../types/bot';
import { useNodeEditor, getBlocks } from '../../../hooks/useNodeEditor';
import { useBotStore } from '../../../../../store/useBotStore';
import { useTagsQuery } from '../../../../broadcast/hooks/useBroadcastQueries';
import { FieldVariableSelector } from './FieldVariableSelector';
import emojiData from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

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
  const [draggedBtnValue, setDraggedBtnValue] = React.useState<string | null>(null);

  const handleDropBtn = (e: React.DragEvent, targetBtnValue: string, blockId: string) => {
    const sourceBtnValue = e.dataTransfer.getData('text/plain');
    if (!sourceBtnValue || sourceBtnValue === targetBtnValue) return;

    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentBtns = [...((block.buttons || []) as ButtonData[])];
    const sourceIdx = currentBtns.findIndex((b) => b.value === sourceBtnValue);
    const targetIdx = currentBtns.findIndex((b) => b.value === targetBtnValue);

    if (sourceIdx === -1 || targetIdx === -1) return;

    const sourceBtn = currentBtns[sourceIdx];
    const targetBtn = currentBtns[targetIdx];

    const updatedSourceBtn = { ...sourceBtn, row: targetBtn.row };

    currentBtns.splice(sourceIdx, 1);
    let insertIdx = targetIdx;
    currentBtns.splice(insertIdx, 0, updatedSourceBtn);

    updateBlockContent(blockId, { buttons: currentBtns });
  };

  const handleDropOnRow = (e: React.DragEvent, targetRowKey: string, blockId: string) => {
    const sourceBtnValue = e.dataTransfer.getData('text/plain');
    if (!sourceBtnValue) return;

    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentBtns = [...((block.buttons || []) as ButtonData[])];
    const sourceIdx = currentBtns.findIndex((b) => b.value === sourceBtnValue);

    if (sourceIdx === -1) return;

    const sourceBtn = currentBtns[sourceIdx];
    if (sourceBtn.row === targetRowKey) return;

    const updatedSourceBtn = { ...sourceBtn, row: targetRowKey };
    currentBtns.splice(sourceIdx, 1);

    let lastIdx = -1;
    for (let i = currentBtns.length - 1; i >= 0; i--) {
      if ((currentBtns[i].row ?? '0') === targetRowKey) {
        lastIdx = i;
        break;
      }
    }

    if (lastIdx !== -1) {
      currentBtns.splice(lastIdx + 1, 0, updatedSourceBtn);
    } else {
      currentBtns.push(updatedSourceBtn);
    }

    updateBlockContent(blockId, { buttons: currentBtns });
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreContainerRef.current && !moreContainerRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        fitView({ nodes: [{ id: targetId }], duration: 300, padding: 0.5 });
      }, 50);
    }
  };

  const groupButtonsByRow = (buttons: ButtonData[]) => {
    const groups: Record<string, ButtonData[]> = {};
    buttons.forEach((btn) => {
      const r = btn.row ?? '0';
      if (!groups[r]) groups[r] = [];
      groups[r].push(btn);
    });
    return groups;
  };

  const handleAddButtonToRow = (blockId: string, rowKey: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentBtns = (block.buttons || []) as ButtonData[];
    const newBtn: ButtonData = {
      label: `Button ${currentBtns.length + 1}`,
      value: `btn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      row: rowKey,
    };
    updateBlockContent(blockId, {
      buttons: [...currentBtns, newBtn],
    });
  };

  const handleAddButtonRow = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const currentBtns = (block.buttons || []) as ButtonData[];
    const rows = currentBtns.map((b) => parseInt(b.row || '0', 10));
    const nextRow = rows.length > 0 ? Math.max(...rows) + 1 : 0;
    const newBtn: ButtonData = {
      label: `Button ${currentBtns.length + 1}`,
      value: `btn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      row: String(nextRow),
    };
    updateBlockContent(blockId, {
      buttons: [...currentBtns, newBtn],
    });
  };

  const addBlock = (type: 'text' | 'image' | 'delay' | 'data_collection' | 'file' | 'audio' | 'video' | 'telegram_menu') => {
    const newBlock: any = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
    };
    if (type === 'text') {
      newBlock.text = '';
      newBlock.buttons = [];
    } else if (type === 'image') {
      newBlock.imageUrl = '';
      newBlock.buttons = [];
    } else if (type === 'delay') {
      newBlock.delaySeconds = 3;
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

  const duplicateBlock = (block: any) => {
    const index = blocks.findIndex((b) => b.id === block.id);
    if (index === -1) return;

    const clonedBlock = {
      ...block,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    if (Array.isArray(clonedBlock.buttons)) {
      clonedBlock.buttons = clonedBlock.buttons.map((btn: ButtonData) => ({
        ...btn,
        value: `btn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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

  const updateBlockContent = (id: string, updates: Record<string, any>) => {
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
  const [linkHasActions, setLinkHasActions] = useState(false);

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

  const customFields = useMemo(() => {
    if (!activeBotId) return ['last_order_product', 'last_order_price', 'phone', 'email'];
    const stored = localStorage.getItem(`launchly_custom_fields_${activeBotId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((f: any) => f.name);
        }
      } catch (e) {
        console.error('Failed to parse custom fields', e);
      }
    }
    return ['last_order_product', 'last_order_price', 'phone', 'email'];
  }, [activeBotId]);

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

  const handleOpenLinkPopover = (blockId: string) => {
    editingLinkElementRef.current = null;
    setActiveLinkBlockId(blockId);
    setActiveEmojiBlockId(null);
    setLinkUrl('');
    setLinkText('');
    setLinkHasActions(false);
    setLinkStep('select');
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
              className={`border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm flex flex-col group/block transition-all hover:border-slate-350 hover:shadow-md relative ${
                activeBlockId === block.id ? 'z-40' : 'overflow-hidden'
              }`}
            >
              <div className="bg-slate-50/70 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 shrink-0">
                    {block.type === 'text' && <AlignLeft size={13} />}
                    {block.type === 'image' && <ImageIcon size={13} className="text-indigo-500" />}
                    {block.type === 'delay' && <Clock size={13} className="text-cyan-500" />}
                    {block.type === 'data_collection' && <Database size={13} className="text-blue-500" />}
                    {block.type === 'file' && <Paperclip size={13} className="text-slate-500" />}
                    {block.type === 'audio' && <Volume2 size={13} className="text-violet-500" />}
                    {block.type === 'video' && <Video size={13} className="text-rose-500" />}
                    {block.type === 'telegram_menu' && <Grid size={13} className="text-slate-400" />}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {block.type === 'text' && 'Text block'}
                    {block.type === 'image' && 'Image block'}
                    {block.type === 'delay' && 'Delay block'}
                    {block.type === 'data_collection' && 'Data collection'}
                    {block.type === 'file' && 'File block'}
                    {block.type === 'audio' && 'Audio block'}
                    {block.type === 'video' && 'Video block'}
                    {block.type === 'telegram_menu' && (
                      <span className="inline-flex items-center gap-1 normal-case font-bold text-slate-700">
                        <span>Telegram Menu</span>
                        <span title="Group buttons into rows. Buttons in the same row appear side-by-side in Telegram. Drag and drop to reorder.">
                          <HelpCircle 
                            size={12} 
                            className="text-blue-500 cursor-pointer hover:text-blue-600 transition-colors ml-0.5"
                          />
                        </span>
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover/block:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlockUp(idx)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowUp size={12} className="stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === blocks.length - 1}
                    onClick={() => moveBlockDown(idx)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown size={12} className="stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateBlock(block)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-700"
                  >
                    <Copy size={12} className="stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBlock(block.id || '')}
                    className="p-1 hover:bg-rose-50 rounded transition-colors text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={12} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {block.type === 'text' && (
                <div className="flex flex-col">
                  <div 
                    className="bg-slate-50/20 p-4 pb-2 relative flex flex-col min-h-[110px]"
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
                      data-placeholder="Enter your text..."
                      className="w-full text-xs font-semibold text-slate-800 focus:outline-none bg-transparent min-h-[80px] cursor-text break-words outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
                    />
                    
                    {activeBlockId === block.id && (
                      <div className="absolute bottom-2.5 right-3 bg-slate-900 text-slate-200 px-2.5 py-1.5 rounded-xl flex items-center gap-2 shadow-md z-50">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleOpenLinkPopover(block.id || '')}
                          className="hover:text-white transition-colors cursor-pointer"
                        >
                          <LinkIcon size={12} className="stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setActiveEmojiBlockId(block.id || '');
                            setActiveLinkBlockId(null);
                          }}
                          className="hover:text-white transition-colors cursor-pointer"
                        >
                          <Smile size={12} className="stroke-[2.5]" />
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
                            const html = `<span class="inline-flex items-center bg-blue-600 text-white rounded px-1.5 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline" contenteditable="false" data-type="variable" data-val="${val}">${displayName}</span>`;
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
                              className="hover:text-white transition-colors cursor-pointer flex items-center"
                              title="Variables"
                            >
                              <Parentheses size={12} className="stroke-[2.5]" />
                            </button>
                          }
                        />
                        <div className="w-[1px] h-3.5 bg-slate-700/60 my-0.5" />
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-300">
                          {2000 - (block.text || '').length}
                        </span>
                      </div>
                    )}

                    {activeLinkBlockId === block.id && (
                      <div className="absolute top-full mt-2 left-3 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72 text-slate-800 space-y-3 text-left before:content-[''] before:absolute before:bottom-full before:left-10 before:border-[6px] before:border-transparent before:border-b-white">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                            When This Link is Clicked
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveLinkBlockId(null)}
                            className="text-slate-400 hover:text-slate-655 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {linkStep === 'select' ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setLinkStep('form')}
                              className="flex items-center gap-2.5 w-full p-3 border border-indigo-100 hover:bg-indigo-50/20 rounded-xl text-xs font-bold text-indigo-700 transition-colors text-left cursor-pointer"
                            >
                              <LinkIcon size={14} />
                              <span>Open website</span>
                            </button>
                            <button
                              type="button"
                              disabled
                              className="flex items-center gap-2.5 w-full p-3 border border-slate-100 bg-slate-50/50 text-slate-400 rounded-xl text-xs font-bold text-left cursor-not-allowed opacity-60"
                            >
                              <MessageSquare size={14} />
                              <span>Open Messenger</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-indigo-50/40 border border-indigo-100/60 rounded-xl px-3 py-2 text-xs text-indigo-750 font-bold">
                              <div className="flex items-center gap-2">
                                <LinkIcon size={12} />
                                <span>Open website</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setLinkStep('select')}
                                className="text-indigo-400 hover:text-indigo-650 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Website URL
                              </label>
                              <input
                                type="text"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 bg-white text-slate-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Link text
                              </label>
                              <input
                                type="text"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                                placeholder="Enter link text"
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 bg-white text-slate-800"
                              />
                            </div>

                            <div className="flex items-start justify-between py-1">
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-700 block">
                                  Additional actions
                                </span>
                                <span className="text-[9px] text-slate-400 block leading-tight max-w-[180px]">
                                  E.g. you can add a tag on a button click.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setLinkHasActions(!linkHasActions)}
                                className={`w-8 h-4 rounded-full transition-all relative cursor-pointer ${
                                  linkHasActions ? 'bg-indigo-650' : 'bg-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-all shadow-3xs ${
                                    linkHasActions ? 'right-0.25' : 'left-0.25'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingLinkElementRef.current) {
                                    const parent = editingLinkElementRef.current.parentNode;
                                    if (parent) {
                                      const textNode = document.createTextNode(editingLinkElementRef.current.innerText);
                                      parent.replaceChild(textNode, editingLinkElementRef.current);
                                    }
                                    editingLinkElementRef.current = null;
                                    handleContentEditableInput(block.id || '');
                                  }
                                  setActiveLinkBlockId(null);
                                }}
                                className="flex-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-550 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                disabled={!linkUrl.trim()}
                                onClick={() => {
                                  if (editingLinkElementRef.current) {
                                    editingLinkElementRef.current.setAttribute('data-url', linkUrl.trim());
                                    editingLinkElementRef.current.innerText = linkText.trim() || linkUrl.trim();
                                    editingLinkElementRef.current = null;
                                    handleContentEditableInput(block.id || '');
                                  } else {
                                    const html = `<span class="text-blue-600 font-bold hover:underline cursor-pointer" contenteditable="false" data-type="link" data-url="${linkUrl.trim()}">${linkText.trim() || linkUrl.trim()}</span>`;
                                    insertHtmlAtCursor(html, block.id || '');
                                  }
                                  setActiveLinkBlockId(null);
                                }}
                                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center disabled:cursor-not-allowed"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {activeEmojiBlockId === block.id && (
                      <div 
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute top-full mt-2 right-3 z-50 shadow-xl rounded-2xl overflow-hidden border border-slate-200 bg-white origin-top-right scale-[0.82] before:content-[''] before:absolute before:bottom-full before:right-6 before:border-[6px] before:border-transparent before:border-b-white"
                      >
                        <Picker
                          data={emojiData}
                          onEmojiSelect={(emoji: any) => {
                            insertHtmlAtCursor(emoji.native, block.id || '');
                            setActiveEmojiBlockId(null);
                          }}
                          theme="light"
                          previewPosition="none"
                          skinTonePosition="none"
                          perLine={8}
                        />
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
                      <span>Add Button</span>
                    </button>

                    {!blocks.some((b) => b.type === 'telegram_menu') && (
                      <button
                        type="button"
                        onClick={() => addBlock('telegram_menu')}
                        className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1.5"
                      >
                        <Plus size={13} />
                        <span>Telegram Menu</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {block.type === 'image' && (
                <div className="p-4 space-y-3">
                  {block.imageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 group/image">
                      <img src={block.imageUrl} alt="Preview" className="w-full h-40 object-cover select-none" />
                      <button
                        type="button"
                        onClick={() => updateBlockContent(block.id, { imageUrl: '' })}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer shadow-md border border-slate-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingBlockId(block.id);
                            setTimeout(() => {
                              fileInputRef.current?.click();
                            }, 50);
                          }}
                          disabled={isUploadingThisBlock}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isUploadingThisBlock ? (
                            <Loader2 size={13} className="animate-spin text-slate-400" />
                          ) : (
                            <ImageIcon size={13} className="text-indigo-500" />
                          )}
                          <span>Upload File</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste image URL link..."
                        value={block.imageUrl || ''}
                        onChange={(e) => updateBlockContent(block.id, { imageUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                      />
                    </div>
                  )}

                  <div className="pt-2 bg-white space-y-2 border-t border-slate-100">
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
                              className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-slate-350 cursor-pointer transition-all"
                            >
                              <span className="truncate flex-1 pr-4">{btn.label}</span>
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
                      <span>Add Button</span>
                    </button>
                  </div>
                </div>
              )}

              {block.type === 'delay' && (
                <div className="p-4 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-600 font-semibold">Delay duration:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={block.delaySeconds || 3}
                      onChange={(e) => updateBlockContent(block.id, { delaySeconds: Math.max(1, parseInt(e.target.value) || 3) })}
                      className="w-16 px-2.5 py-1.5 border border-slate-205 rounded-xl text-xs font-bold text-center bg-slate-50/50 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-500 font-bold">seconds</span>
                  </div>
                </div>
              )}

              {block.type === 'data_collection' && (
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Question to ask</label>
                    <textarea
                      value={block.text || ''}
                      onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                      placeholder="e.g. What is your email address?"
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
                      <span>Contact's reply: {block.replyType || 'Text'}</span>
                    </button>
                    <span className="text-[9px] font-semibold text-slate-400 mt-2 block text-center leading-normal">
                      Note: Automation pauses until contact replies
                    </span>
                  </div>
                </div>
              )}
              {block.type === 'file' && (
                <div className="p-4 space-y-3">
                  {block.fileUrl ? (
                    <div className="relative rounded-2xl p-4 border border-slate-200 bg-slate-50 flex items-center justify-between group/file">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Paperclip size={16} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{block.fileName || 'Uploaded file'}</p>
                          <p className="text-[10px] text-slate-400 truncate font-semibold">{block.fileUrl}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateBlockContent(block.id, { fileUrl: '', fileName: '' })}
                        className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer shadow-sm border border-slate-100 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadAccept('*/*');
                            setUploadingBlockId(block.id);
                            setTimeout(() => {
                              fileInputRef.current?.click();
                            }, 50);
                          }}
                          disabled={isUploadingThisBlock}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isUploadingThisBlock ? (
                            <Loader2 size={13} className="animate-spin text-slate-400" />
                          ) : (
                            <Paperclip size={13} className="text-slate-500" />
                          )}
                          <span>Upload File</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste file URL link..."
                        value={block.fileUrl || ''}
                        onChange={(e) => updateBlockContent(block.id, { fileUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                      />
                    </div>
                  )}

                  <div className="pt-2 bg-white space-y-2 border-t border-slate-100">
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
                              className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-slate-350 cursor-pointer transition-all"
                            >
                              <span className="truncate flex-1 pr-4">{btn.label}</span>
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
                      <span>Add Button</span>
                    </button>
                  </div>
                </div>
              )}

              {block.type === 'audio' && (
                <div className="p-4 space-y-3">
                  {block.audioUrl ? (
                    <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audio Preview</span>
                        <button
                          type="button"
                          onClick={() => updateBlockContent(block.id, { audioUrl: '' })}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer shadow-sm border border-slate-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <audio controls className="w-full h-8" src={block.audioUrl} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadAccept('audio/*');
                            setUploadingBlockId(block.id);
                            setTimeout(() => {
                              fileInputRef.current?.click();
                            }, 50);
                          }}
                          disabled={isUploadingThisBlock}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isUploadingThisBlock ? (
                            <Loader2 size={13} className="animate-spin text-slate-400" />
                          ) : (
                            <Volume2 size={13} className="text-violet-500" />
                          )}
                          <span>Upload File</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste audio URL link..."
                        value={block.audioUrl || ''}
                        onChange={(e) => updateBlockContent(block.id, { audioUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                      />
                    </div>
                  )}

                  <div className="pt-2 bg-white space-y-2 border-t border-slate-100">
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
                              className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-slate-350 cursor-pointer transition-all"
                            >
                              <span className="truncate flex-1 pr-4">{btn.label}</span>
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
                      <span>Add Button</span>
                    </button>
                  </div>
                </div>
              )}

              {block.type === 'video' && (
                <div className="p-4 space-y-3">
                  {block.videoUrl ? (
                    <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Video Preview</span>
                        <button
                          type="button"
                          onClick={() => updateBlockContent(block.id, { videoUrl: '' })}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer shadow-sm border border-slate-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <video controls className="w-full max-h-40 rounded-xl bg-black" src={block.videoUrl} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadAccept('video/*');
                            setUploadingBlockId(block.id);
                            setTimeout(() => {
                              fileInputRef.current?.click();
                            }, 50);
                          }}
                          disabled={isUploadingThisBlock}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isUploadingThisBlock ? (
                            <Loader2 size={13} className="animate-spin text-slate-400" />
                          ) : (
                            <Video size={13} className="text-rose-500" />
                          )}
                          <span>Upload File</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste video URL link..."
                        value={block.videoUrl || ''}
                        onChange={(e) => updateBlockContent(block.id, { videoUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                      />
                    </div>
                  )}

                  <div className="pt-2 bg-white space-y-2 border-t border-slate-100">
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
                              className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-slate-350 cursor-pointer transition-all"
                            >
                              <span className="truncate flex-1 pr-4">{btn.label}</span>
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
                      <span>Add Button</span>
                    </button>
                  </div>
                </div>
              )}

              {block.type === 'telegram_menu' && (
                <div className="p-4 space-y-3.5">


                  {(() => {
                    const groups = groupButtonsByRow(blockBtns);
                    const sortedRowKeys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));

                    return (
                      <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/40 space-y-2.5">
                        {sortedRowKeys.map((rowKey) => {
                          const rowBtns = groups[rowKey];
                          return (
                            <div 
                              key={rowKey} 
                              className="flex gap-2 items-stretch w-full"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDropOnRow(e, rowKey, block.id)}
                            >
                              <div className="flex-1 flex flex-wrap gap-2">
                                {rowBtns.map((btn, btnIdx) => {
                                  const edge = edges.find((e) => e.source === nodeId && e.sourceHandle === btn.value);
                                  const isConnected = !!edge;
                                  const targetNodeId = edge?.target;
                                  const isDragging = draggedBtnValue === btn.value;

                                  return (
                                    <div
                                      key={btn.value + btnIdx}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', btn.value);
                                        setDraggedBtnValue(btn.value);
                                      }}
                                      onDragEnd={() => setDraggedBtnValue(null)}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        e.stopPropagation();
                                        handleDropBtn(e, btn.value, block.id);
                                      }}
                                      onClick={() => handleOpenEditButton(btn, block.id)}
                                      className={`flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-slate-350 py-2 px-3 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-grab active:cursor-grabbing shadow-xs transition-all flex-1 min-w-[70px] text-center select-none ${
                                        isDragging ? 'opacity-40 scale-[0.97]' : ''
                                      }`}
                                    >
                                      <span className="truncate max-w-[80px]">{btn.label}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isConnected && targetNodeId) {
                                            handleJumpToNode(targetNodeId);
                                          }
                                        }}
                                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                          isConnected
                                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-250 cursor-pointer'
                                            : 'border border-slate-300 text-slate-300 cursor-default'
                                        }`}
                                      >
                                        {isConnected ? (
                                          <ArrowRight size={9} className="stroke-[2.5]" />
                                        ) : null}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {rowBtns.length < 8 && (
                                <button
                                  type="button"
                                  onClick={() => handleAddButtonToRow(block.id, rowKey)}
                                  className="w-8 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 hover:border-slate-300 text-slate-450 hover:text-slate-600 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                                  title="Add button to this row"
                                >
                                  <Plus size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handleAddButtonRow(block.id)}
                          className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-200 hover:border-slate-300 text-slate-550 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus size={13} />
                          <span>Add Button</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
          Add one of the content blocks:
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
                <p className="text-xs font-bold text-slate-800">Text</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Add simple text and buttons</p>
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
                <p className="text-xs font-bold text-slate-800">Image</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Boost engagement with visuals</p>
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
                <p className="text-xs font-bold text-slate-800">Delay</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Wait a few seconds in between texts</p>
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
                <p className="text-xs font-bold text-slate-800">Data Collection</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Collect emails, phones and more</p>
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
                  <p className="text-xs font-bold text-slate-800">More</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">View all available options</p>
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
                      <p className="text-xs font-bold text-slate-800">File</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">Add files to the message</p>
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
                      <p className="text-xs font-bold text-slate-800">Audio</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">Send voice snippets in chat</p>
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
                      <p className="text-xs font-bold text-slate-800">Video</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">Share video in chat</p>
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
          Choose Next Step
        </button>
      </div>
    </div>
  );
};
