import React, { useState, useEffect } from 'react';
import { t } from '../../../../../i18n/config';
import { Handle, Position, useReactFlow, useNodeConnections, useUpdateNodeInternals, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Send, Plus, Image as ImageIcon, Paperclip, Volume2, Video, Clock, MessageSquare, Zap, AlertCircle } from 'lucide-react';
import type { ButtonData, CustomNodeData } from '../../../../../types/bot';
import { NodeHandle } from './NodeHandle';
import { getBlocks } from '../../../../../hooks/bot/useNodeEditor';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { useFlowUiStore } from '../../../../../store/useFlowUiStore';
import { renderTextWithBadges } from '../../utils/textBadgeRenderer';

const MessageNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const { setNodes } = useReactFlow();
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const updateNodeInternals = useUpdateNodeInternals();
  const buttons = (data?.buttons || []) as ButtonData[];
  const blocks = getBlocks(data);
  const [activeButtonValue, setActiveButtonValue] = useState<string | null>(null);
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isReplyHandle = useConnection((s) => s.fromHandle?.id === 'reply');
  const isGrayedOut = isConnecting && (isSelfSource || isReplyHandle);
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);


  const hasDataCollection = blocks.some((b) => b.type === 'data_collection');
  const prevHandlesRef = React.useRef<string | null>(null);
  useEffect(() => {
    const handleSig = `${buttons.length}:${hasDataCollection}`;
    if (prevHandlesRef.current !== null && prevHandlesRef.current !== handleSig) {
      updateNodeInternals(id);
    }
    prevHandlesRef.current = handleSig;
  }, [id, buttons.length, hasDataCollection, updateNodeInternals]);
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
    useFlowUiStore.getState().openEditButton(id, newBtn);
  };

  const handleButtonClick = (e: React.MouseEvent, btn: ButtonData) => {
    e.stopPropagation();
    setActiveButtonValue(btn.value);
    useFlowUiStore.getState().openEditButton(id, btn);
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

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected 
          ? 'shadow-lg ring-2 ring-[#0A0A0A]' 
          : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-sky-100/75 rounded-t-[22px] select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-sky-100/60 text-sky-600 flex items-center justify-center shrink-0">
          <Send size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-sky-600/70 uppercase tracking-wider block leading-none">
            {t('node.message.category', 'Message')}
          </span>
          <span className="text-xs font-bold text-sky-900 truncate block mt-0.5">
            {t('node.title.message')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {isZoomedOut ? (
          <div className="space-y-2 select-none pointer-events-none">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-xs text-slate-700 truncate font-medium">
              {blocks.find((b) => b.type === 'text')?.text || t('flow_builder.add_a_text')}
            </div>
            {buttons.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {buttons.map((btn, btnIdx) => (
                  <div
                    key={btn.value + btnIdx}
                    className="relative border border-slate-250 py-1.5 px-3 rounded-xl text-left text-[11px] font-bold bg-white text-slate-600 truncate flex items-center justify-between"
                  >
                    <span className="truncate flex-1">{btn.label}</span>
                    {btn.actionType !== 'URL' && btn.actionType !== 'BUY' && (
                      <NodeHandle
                        type="source"
                        position={Position.Right}
                        id={btn.value}
                        isConnected={data?._tempSourceHandle !== btn.value && sourceConns.some((c) => c.sourceHandle === btn.value && c.target !== 'temp_menu_node')}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-[#0A0A0A]/40 rounded-2xl p-3 text-xs text-[#0A0A0A]/60 italic text-center select-none bg-white/40">
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
                          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 text-xs text-[#0A0A0A] leading-relaxed break-words whitespace-pre-wrap font-bold font-['JetBrains_Mono',monospace]">
                            {renderTextWithBadges(block.text)}
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-[#0A0A0A]/40 rounded-2xl p-3 text-[11px] font-black text-[#0A0A0A]/60 italic text-center bg-[#F2EBDD]/40">
                            {t('flow_builder.add_a_text')}
                          </div>
                        )
                      )}

                      {block.type === 'image' && (
                        block.imageUrl ? (
                          block.imageUrl.includes('{') ? (
                            <div className="rounded-2xl border-2 border-[#0A0A0A] p-3 text-[11px] font-black text-[#0A0A0A] bg-[#F2EBDD] flex items-center gap-2 select-none">
                              <ImageIcon size={14} className="text-[#0A0A0A] shrink-0" />
                              <div className="flex items-center flex-wrap gap-1">
                                {renderTextWithBadges(block.imageUrl)}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl overflow-hidden border-2 border-[#0A0A0A] max-h-40 flex items-center justify-center bg-[#F2EBDD] relative group">
                              <img src={block.imageUrl} alt="Attachment" className="w-full h-full object-cover select-none" />
                            </div>
                          )
                        ) : (
                          <div className="border-2 border-dashed border-[#0A0A0A]/40 rounded-2xl p-3 text-[11px] font-bold text-[#0A0A0A]/60 italic text-center flex items-center justify-center gap-1.5 bg-[#F2EBDD]/40">
                            <ImageIcon size={14} className="text-[#0A0A0A]/60" />
                            <span>Image</span>
                          </div>
                        )
                      )}

                      {block.type === 'file' && (
                        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 text-[11px] font-bold text-[#0A0A0A] flex flex-col items-center justify-center gap-1.5">
                          <Paperclip size={14} className="text-[#0A0A0A]/60" />
                          <div className="truncate max-w-full text-center">
                            {block.fileUrl && block.fileUrl.includes('{') ? renderTextWithBadges(block.fileUrl) : (block.fileName || 'File')}
                          </div>
                        </div>
                      )}

                      {block.type === 'audio' && (
                        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 text-[11px] font-bold text-[#0A0A0A] flex flex-col items-center justify-center gap-1.5">
                          <Volume2 size={14} className="text-[#0A0A0A]/60" />
                          <div className="truncate max-w-full text-center">
                            {block.audioUrl && block.audioUrl.includes('{') ? renderTextWithBadges(block.audioUrl) : 'Audio'}
                          </div>
                        </div>
                      )}

                      {block.type === 'video' && (
                        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 text-[11px] font-bold text-[#0A0A0A] flex flex-col items-center justify-center gap-1.5">
                          <Video size={14} className="text-[#0A0A0A]/60" />
                          <div className="truncate max-w-full text-center">
                            {block.videoUrl && block.videoUrl.includes('{') ? renderTextWithBadges(block.videoUrl) : 'Video'}
                          </div>
                        </div>
                      )}

                      {block.type === 'delay' && (
                        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-2.5 text-[10px] font-black text-[#0A0A0A] flex items-center justify-center gap-1.5">
                          <Clock size={12} className="text-cyan-700" />
                          <span>Delay: {block.delaySeconds || 3}s</span>
                        </div>
                      )}

                      {block.type === 'data_collection' && (
                        <div className="space-y-2">
                          {block.text && (
                            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl px-4 py-2.5 text-xs text-[#0A0A0A] font-bold font-['JetBrains_Mono',monospace]">
                              {typeof block.text === 'string' ? block.text : ''}
                            </div>
                          )}
                          <div className="bg-indigo-50 border-2 border-[#0A0A0A] rounded-2xl px-4 py-2.5 text-[11px] font-black text-indigo-900 flex items-center gap-2 animate-pulse justify-center">
                            <MessageSquare size={13} className="text-indigo-700 shrink-0" />
                            <span>Waiting for {typeof block.replyType === 'string' ? block.replyType : 'Text'} from contact...</span>
                          </div>
                        </div>
                      )}

                      {block.type === 'telegram_menu' && (
                        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 flex flex-col gap-2 font-['JetBrains_Mono',monospace]">
                          <div className="text-center text-xs font-black text-[#0A0A0A]/60 pb-1.5 border-b border-[#0A0A0A]/15 uppercase tracking-wider">
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
                                        const isConnected = data?._tempSourceHandle !== btn.value && sourceConns.some((c) => c.sourceHandle === btn.value && c.target !== 'temp_menu_node');
                                        return (
                                          <div
                                            key={btn.value + btnIdx}
                                            onClick={(e) => handleButtonClick(e, btn)}
                                            className={`relative border-2 border-[#0A0A0A] py-1.5 px-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer shadow-xs select-none flex-1 min-w-0 ${
                                              isActive
                                                ? 'bg-emerald-100 text-emerald-950 font-black'
                                                : 'bg-white hover:bg-[#F2EBDD] text-[#0A0A0A]'
                                            }`}
                                            title={btn.label}
                                          >
                                            <div className="flex items-center justify-between gap-1 w-full">
                                              <span className="block truncate flex-1">{btn.label}</span>
                                              {btn.actionType === 'BUY' && (
                                                <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-900 border border-[#0A0A0A] flex items-center justify-center font-black text-[9px] shrink-0 ml-1 select-none leading-none">
                                                  $
                                                </span>
                                              )}
                                            </div>
                                            {btn.actionType !== 'URL' && btn.actionType !== 'BUY' && (
                                              <NodeHandle
                                                type="source"
                                                position={Position.Right}
                                                id={btn.value}
                                                isConnected={isConnected}
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
                        <div className="space-y-2 pt-1 nodrag font-['JetBrains_Mono',monospace]">
                          {blockBtns.map((btn, btnIdx) => {
                            const isActive = activeButtonValue === btn.value;
                            const isConnected = data?._tempSourceHandle !== btn.value && sourceConns.some((c) => c.sourceHandle === btn.value && c.target !== 'temp_menu_node');
                            return (
                              <div
                                key={btn.value + btnIdx}
                                onClick={(e) => handleButtonClick(e, btn)}
                                className={`relative border-2 border-[#0A0A0A] py-2 pl-3.5 pr-4 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer shadow-xs select-none flex items-center justify-between gap-1 ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-950 font-black'
                                    : 'bg-white hover:bg-[#F2EBDD] text-[#0A0A0A]'
                                }`}
                              >
                                <span className="truncate flex-1">{btn.label}</span>
                                {btn.actionType === 'BUY' && (
                                  <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-900 border border-[#0A0A0A] flex items-center justify-center font-black text-[9px] shrink-0 mr-1.5 select-none leading-none">
                                    $
                                  </span>
                                )}
                                {btn.actionType !== 'URL' && btn.actionType !== 'BUY' && (
                                  <NodeHandle
                                    type="source"
                                    position={Position.Right}
                                    id={btn.value}
                                    isConnected={isConnected}
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
              className="w-full py-2.5 border-2 border-dashed border-[#0A0A0A]/40 hover:border-[#0A0A0A] hover:bg-[#F2EBDD]/60 text-[#0A0A0A] text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 nodrag shadow-xs font-['JetBrains_Mono',monospace]"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>{t('flow_builder.btn_add_button')}</span>
            </button>
          </>
        )}
      </div>

      {hasDataCollection && (
        <>
          <div className="flex justify-end items-center px-4 py-2 bg-transparent border-t border-slate-100 dark:border-[#27272A] select-none relative">
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
          <div className="flex justify-end items-center px-4 py-2 bg-transparent border-t border-slate-100 dark:border-[#27272A] select-none relative">
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

      <div className="flex justify-end items-center px-4 py-2 bg-transparent select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2">{t('flow_builder.next_step')}</span>
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
