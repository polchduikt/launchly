import React, { useState, useEffect, useMemo } from 'react';
import { t } from '../../../../i18n';
import { Handle, Position, useReactFlow, useNodeConnections, useUpdateNodeInternals, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Send, Plus, Image as ImageIcon, Paperclip, Volume2, Video, Clock, Database, MessageSquare, Zap, AlertCircle } from 'lucide-react';
import type { ButtonData, CustomNodeData } from '../../../../types/bot';
import { NodeHandle } from './NodeHandle';
import { getBlocks } from '../../hooks/useNodeEditor';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';

const MessageNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const { setNodes } = useReactFlow();
  const sourceConns = useNodeConnections({ handleType: 'source' });
  const targetConns = useNodeConnections({ handleType: 'target' });
  const updateNodeInternals = useUpdateNodeInternals();
  const buttons = (data?.buttons || []) as ButtonData[];
  const blocks = getBlocks(data);
  const [activeButtonValue, setActiveButtonValue] = useState<string | null>(null);
  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const isGrayedOut = useMemo(() => {
    if (!isConnecting) return false;
    if (connection.fromNode?.id === id) return true;
    const sourceHandleId = connection.fromHandle?.id;
    if (sourceHandleId === 'reply') {
      return true;
    }
    return false;
  }, [isConnecting, connection, id]);
  const { showToolbar, bindHover } = useNodeHover();


  const hasDataCollection = blocks.some((b) => b.type === 'data_collection');
  const buttonsSerialized = JSON.stringify(buttons);
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, buttonsSerialized, hasDataCollection, updateNodeInternals]);
  useEffect(() => {
    if (!selected) {
      setTimeout(() => {
        setActiveButtonValue(null);
      }, 0);
    }
  }, [selected]);

  const handleAddButtonInNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttons.length >= 10) return;

    const newBtn: ButtonData = {
      label: `Button ${buttons.length + 1}`,
      value: `btn_${Date.now()}`,
    };

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentBtns = (node.data?.buttons || []) as ButtonData[];
          return {
            ...node,
            data: {
              ...node.data,
              buttons: [...currentBtns, newBtn],
            },
          };
        }
        return node;
      })
    );

    setActiveButtonValue(newBtn.value);

    setTimeout(() => {
      const editEvent = new CustomEvent('edit-flow-button', {
        detail: { nodeId: id, button: newBtn },
      });
      window.dispatchEvent(editEvent);
    }, 50);
  };

  const handleButtonClick = (e: React.MouseEvent, btn: ButtonData) => {
    e.stopPropagation();
    setActiveButtonValue(btn.value);
    
    const editEvent = new CustomEvent('edit-flow-button', {
      detail: { nodeId: id, button: btn },
    });
    window.dispatchEvent(editEvent);
  };

  const groupButtonsByRow = (btns: ButtonData[]) => {
    const groups: Record<string, ButtonData[]> = {};
    btns.forEach((btn) => {
      const r = btn.row ?? '0';
      if (!groups[r]) groups[r] = [];
      groups[r].push(btn);
    });
    return groups;
  };

  const renderTextWithBadges = (text: string) => {
    if (!text) return '';

    interface TokenMatch {
      index: number;
      length: number;
      type: 'variable' | 'linkWithText' | 'rawUrl';
      displayName: string;
      url?: string;
    }

    const matches: TokenMatch[] = [];
    const varRegex = /\{\{\{?(.*?)\}?\}\}/g;
    let m;
    while ((m = varRegex.exec(text)) !== null) {
      const rawName = m[1].trim();
      let displayName = rawName;
      if (rawName === 'first_name') displayName = 'First Name';
      else if (rawName === 'last_name') displayName = 'Last Name';
      else if (rawName === 'phone') displayName = 'Phone';
      else if (rawName === 'email') displayName = 'Email';
      else if (rawName === 'telegram_username') displayName = 'Telegram Username';
      else if (rawName === 'telegram_user_id') displayName = 'Telegram User ID';
      else if (rawName === 'contact_id') displayName = 'Contact Id';
      else if (rawName === 'subscribed') displayName = 'Subscribed';

      matches.push({
        index: m.index,
        length: m[0].length,
        type: 'variable',
        displayName
      });
    }

    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    while ((m = mdLinkRegex.exec(text)) !== null) {
      matches.push({
        index: m.index,
        length: m[0].length,
        type: 'linkWithText',
        displayName: m[1].trim(),
        url: m[2].trim()
      });
    }

    const rawUrlRegex = /(https?:\/\/[^\s()]+)/g;
    while ((m = rawUrlRegex.exec(text)) !== null) {
      const isPart = matches.some(existing => 
        m!.index >= existing.index && 
        (m!.index + m![0].length) <= (existing.index + existing.length)
      );
      if (!isPart) {
        matches.push({
          index: m.index,
          length: m[0].length,
          type: 'rawUrl',
          displayName: m[1].trim(),
          url: m[1].trim()
        });
      }
    }

    matches.sort((a, b) => a.index - b.index);

    const filteredMatches: TokenMatch[] = [];
    let lastEnd = 0;
    for (const match of matches) {
      if (match.index >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.index + match.length;
      }
    }

    const parts = [];
    let currentIndex = 0;

    for (const match of filteredMatches) {
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      if (match.type === 'variable') {
        parts.push(
          <span 
            key={match.index} 
            className="inline-flex items-center bg-blue-600 text-white rounded px-1.5 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline shrink-0"
          >
            {match.displayName}
          </span>
        );
      } else if (match.type === 'linkWithText' || match.type === 'rawUrl') {
        parts.push(
          <a
            key={match.index}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline cursor-pointer font-bold inline-flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {match.displayName}
          </a>
        );
      }

      currentIndex = match.index + match.length;
    }

    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected 
          ? 'border-emerald-500 ring-4 ring-emerald-100' 
          : 'border-slate-200 hover:border-slate-300'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 select-none rounded-t-[22px]">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
          <Send size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block leading-none">
            Telegram
          </span>
          <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">
            {t('node.title.message')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {blocks.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-xs text-slate-400 italic text-center select-none">
            Empty Message Node. Click to edit.
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, bIdx) => {
              const blockBtns = (block.buttons || []) as ButtonData[];
              return (
                <div key={block.id || bIdx} className="space-y-2">
                  {block.type === 'text' && (
                    block.text ? (
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-xs text-slate-800 leading-relaxed break-words whitespace-pre-wrap font-medium">
                        {renderTextWithBadges(block.text)}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-[11px] font-semibold text-slate-400 italic text-center bg-slate-50/20">
                        {t('flow_builder.add_a_text')}
                      </div>
                    )
                  )}

                  {block.type === 'image' && (
                    block.imageUrl ? (
                      <div className="rounded-2xl overflow-hidden border border-slate-200/60 max-h-40 flex items-center justify-center bg-slate-50 relative group">
                        <img src={block.imageUrl} alt="Attachment" className="w-full h-full object-cover select-none" />
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-[11px] font-semibold text-slate-400 italic text-center flex items-center justify-center gap-1.5 bg-slate-50/20">
                        <ImageIcon size={14} className="text-slate-400" />
                        <span>Image</span>
                      </div>
                    )
                  )}

                  {block.type === 'file' && (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-[11px] font-semibold text-slate-500 bg-slate-50/20 flex flex-col items-center justify-center gap-1.5">
                      <Paperclip size={14} className="text-slate-400" />
                      <span className="truncate max-w-full text-center">
                        {block.fileUrl ? (block.fileName || 'File uploaded') : 'File'}
                      </span>
                    </div>
                  )}

                  {block.type === 'audio' && (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-[11px] font-semibold text-slate-500 bg-slate-50/20 flex flex-col items-center justify-center gap-1.5">
                      <Volume2 size={14} className="text-slate-400" />
                      <span className="truncate max-w-full text-center">
                        {block.audioUrl ? 'Audio snippet' : 'Audio'}
                      </span>
                    </div>
                  )}

                  {block.type === 'video' && (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-[11px] font-semibold text-slate-500 bg-slate-50/20 flex flex-col items-center justify-center gap-1.5">
                      <Video size={14} className="text-slate-400" />
                      <span className="truncate max-w-full text-center">
                        {block.videoUrl ? 'Video clip' : 'Video'}
                      </span>
                    </div>
                  )}

                  {block.type === 'delay' && (
                    <div className="border border-dashed border-slate-250 rounded-2xl p-2.5 text-[10px] font-bold text-slate-500 bg-slate-50/10 flex items-center justify-center gap-1.5">
                      <Clock size={12} className="text-cyan-500" />
                      <span>Delay: {block.delaySeconds || 3}s</span>
                    </div>
                  )}

                  {block.type === 'data_collection' && (
                    <div className="space-y-2">
                      {block.text && (
                        <div className="bg-slate-100/60 border border-slate-200/40 rounded-2xl px-4 py-2.5 text-xs text-slate-800 font-medium">
                          {block.text}
                        </div>
                      )}
                      <div className="bg-indigo-50/50 border border-indigo-150 rounded-2xl px-4 py-2.5 text-[11px] font-bold text-indigo-700 flex items-center gap-2 animate-pulse justify-center">
                        <MessageSquare size={13} className="text-indigo-500 shrink-0" />
                        <span>Waiting for {block.replyType || 'Text'} from contact...</span>
                      </div>
                    </div>
                  )}

                  {block.type === 'telegram_menu' && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-2">
                      <div className="text-center text-xs font-bold text-slate-500 pb-1.5 border-b border-slate-200/55">
                        {t('flow_builder.btn_telegram_menu')}
                      </div>
                      {(() => {
                        const groups = groupButtonsByRow(blockBtns);
                        const sortedRowKeys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));

                        return (
                          <div className="space-y-2 pt-1 nodrag">
                            {sortedRowKeys.map((rowKey) => {
                              const rowBtns = groups[rowKey];
                              return (
                                <div key={rowKey} className="flex gap-2 w-full">
                                  {rowBtns.map((btn, btnIdx) => {
                                    const isActive = activeButtonValue === btn.value;
                                    return (
                                      <div
                                        key={btn.value + btnIdx}
                                        onClick={(e) => handleButtonClick(e, btn)}
                                        className={`relative border py-1.5 px-3 pr-7 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer shadow-sm select-none flex-1 truncate ${
                                          isActive
                                            ? 'bg-emerald-50/40 border-emerald-500 text-emerald-700 font-extrabold'
                                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                                        }`}
                                        title={btn.label}
                                      >
                                        <div className="flex items-center justify-between gap-1 w-full">
                                          <span className="block truncate flex-1">{btn.label}</span>
                                          {btn.actionType === 'BUY' && (
                                            <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black text-[9px] shrink-0 ml-1 select-none leading-none">
                                              $
                                            </span>
                                          )}
                                        </div>
                                        {btn.actionType !== 'URL' && btn.actionType !== 'BUY' && (
                                          <Handle
                                            type="source"
                                            position={Position.Right}
                                            id={btn.value}
                                            style={{
                                              position: 'absolute',
                                              right: '8px',
                                              top: '50%',
                                              transform: 'translateY(-50%)',
                                              width: '9px',
                                              height: '9px',
                                            }}
                                            className={`!rounded-full !border-[1.5px] !transition-all !z-20 ${
                                              data?._tempSourceHandle !== btn.value && sourceConns.some((c) => c.sourceHandle === btn.value && c.target !== 'temp_menu_node')
                                                ? '!bg-[#7b8794] !border-[#7b8794]'
                                                : '!bg-white !border-slate-300 hover:!border-slate-400'
                                            }`}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {block.type !== 'telegram_menu' && blockBtns.length > 0 && (
                    <div className="space-y-2 pt-1 nodrag">
                      {blockBtns.map((btn, btnIdx) => {
                        const isActive = activeButtonValue === btn.value;
                        return (
                          <div
                            key={btn.value + btnIdx}
                            onClick={(e) => handleButtonClick(e, btn)}
                            className={`relative border py-2.5 pl-4 pr-10 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer shadow-sm select-none flex items-center justify-between gap-1 ${
                              isActive
                                ? 'bg-emerald-50/40 border-emerald-500 text-emerald-700 font-extrabold'
                                : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-700 hover:border-slate-350'
                            }`}
                          >
                            <span className="truncate flex-1">{btn.label}</span>
                            {btn.actionType === 'BUY' && (
                              <span className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black text-[9px] shrink-0 mr-1.5 select-none leading-none">
                                $
                              </span>
                            )}
                            {btn.actionType !== 'URL' && btn.actionType !== 'BUY' && (
                              <Handle
                                type="source"
                                position={Position.Right}
                                id={btn.value}
                                style={{
                                  position: 'absolute',
                                  left: 'calc(100% - 26px)',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '10px',
                                  height: '10px',
                                }}
                                className={`!rounded-full !border-[1.5px] !transition-all !z-20 ${
                                  data?._tempSourceHandle !== btn.value && sourceConns.some((c) => c.sourceHandle === btn.value && c.target !== 'temp_menu_node')
                                    ? '!bg-[#7b8794] !border-[#7b8794]'
                                    : '!bg-white !border-slate-300 hover:!border-slate-400'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleAddButtonInNode}
          disabled={buttons.length >= 10}
          className="w-full py-2 border border-dashed border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 nodrag shadow-sm"
        >
          <Plus size={13} />
          <span>{t('flow_builder.btn_add_button')}</span>
        </button>
      </div>

      {hasDataCollection && (
        <>
          <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative">
            <div className="flex items-center gap-1 mr-2 text-[9px] font-extrabold text-amber-650 uppercase tracking-wider">
              <Zap size={10} className="text-amber-500 shrink-0" />
              <span>{t('flow_builder.action_on_reply')}</span>
            </div>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="reply"
              isConnected={sourceConns.some((c) => c.sourceHandle === 'reply')}
              padded={false}
            />
          </div>
          <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative">
            <div className="flex items-center gap-1 mr-2 text-[9px] font-extrabold text-rose-600 uppercase tracking-wider">
              <AlertCircle size={10} className="text-rose-500 shrink-0" />
              <span>{t('flow_builder.if_not_responded')}</span>
            </div>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="timeout"
              isConnected={sourceConns.some((c) => c.sourceHandle === 'timeout')}
              padded={false}
            />
          </div>
        </>
      )}

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">{t('flow_builder.next_step')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && sourceConns.some((c) => c.sourceHandle === 'next' && c.target !== 'temp_menu_node')}
          padded={false}
        />
      </div>
    </div>
  );
};
MessageNodeInner.displayName = 'MessageNode';
export const MessageNode = React.memo(MessageNodeInner);
