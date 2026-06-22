import React from 'react';
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
  HelpCircle
} from 'lucide-react';
import { useEdges, useReactFlow } from '@xyflow/react';
import type { ButtonData } from '../../../../../types/bot';
import { useNodeEditor, getBlocks } from '../../../hooks/useNodeEditor';

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
              className="border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col group/block transition-all hover:border-slate-350 hover:shadow-md"
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
                    onClick={() => deleteBlock(block.id)}
                    className="p-1 hover:bg-rose-50 rounded transition-colors text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={12} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {block.type === 'text' && (
                <div className="flex flex-col">
                  <div className="bg-slate-50/20 p-4 pb-2 relative flex flex-col min-h-[110px]">
                    <textarea
                      rows={3}
                      value={block.text || ''}
                      onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                      placeholder="Enter your text..."
                      maxLength={2000}
                      className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent resize-none border-0 p-0 leading-relaxed"
                    />
                    <div className="absolute bottom-2.5 right-3 bg-slate-900 text-slate-200 px-2.5 py-1.5 rounded-xl flex items-center gap-2 shadow-md">
                      <button type="button" className="hover:text-white transition-colors">
                        <LinkIcon size={12} className="stroke-[2.5]" />
                      </button>
                      <button type="button" className="hover:text-white transition-colors">
                        <Smile size={12} className="stroke-[2.5]" />
                      </button>
                      <button type="button" className="hover:text-white transition-colors">
                        <Parentheses size={12} className="stroke-[2.5]" />
                      </button>
                      <div className="w-[1px] h-3.5 bg-slate-700/60 my-0.5" />
                      <span className="text-[10px] font-extrabold tracking-wider text-slate-300">
                        {2000 - (block.text || '').length}
                      </span>
                    </div>
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
                    <input
                      type="text"
                      value={block.text || ''}
                      onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                      placeholder="e.g. What is your email address?"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Save answer to custom variable</label>
                    <input
                      type="text"
                      value={block.variableName || ''}
                      onChange={(e) => updateBlockContent(block.id, { variableName: e.target.value })}
                      placeholder="e.g. user_email"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                    />
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
