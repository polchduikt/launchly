import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';

import type { ButtonData, ChatMessage, PathChoice } from '../../../../../../types/bot';

interface InlineFlowPreviewProps {
  nodes: Node[];
  edges: Edge[];
  startNodeType?: string;
}

import { VARIATION_COLORS } from '../../../../../../const/constants';

function getStartNodeId(nodes: Node[], startNodeType: string): string | null {
  return (
    nodes.find(
      (n) => n.type === startNodeType || n.type === 'START_BROADCAST' || n.type === 'START'
    )?.id ?? null
  );
}

function getNextNodeId(nodeId: string, edges: Edge[], handleId?: string): string | null {
  const out = edges.filter((e) => e.source === nodeId);
  if (!out.length) return null;
  if (handleId) {
    const m = out.find((e) => e.sourceHandle === handleId);
    if (m) return m.target;
  }
  return (
    out.find((e) => !e.sourceHandle || e.sourceHandle === 'then' || e.sourceHandle === 'next')
      ?.target ?? out[0]?.target ?? null
  );
}

type NodeInfo =
  | { kind: 'message'; text: string; imageUrl?: string; buttons?: ButtonData[] }
  | { kind: 'input'; text: string }
  | { kind: 'auto'; text: string }
  | { kind: 'path'; pathChoice: PathChoice }
  | { kind: 'skip' };

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

function getBlocks(data: Record<string, unknown> | null | undefined): Record<string, unknown>[] {
  let blocks: Record<string, unknown>[] = [];
  if (data && Array.isArray(data.blocks) && data.blocks.length > 0) {
    blocks = data.blocks.filter((block): block is Record<string, unknown> =>
      typeof block === 'object' && block !== null
    );
  } else if (data) {
    if (data.text || (!data.text && !data.imageUrl)) {
      blocks.push({
        id: 'block_text_1',
        type: 'text',
        text: data.text || '',
        buttons: data.buttons || [],
      });
    }
    if (data.imageUrl) {
      blocks.push({
        id: 'block_image_1',
        type: 'image',
        imageUrl: data.imageUrl,
        buttons: blocks.length === 0 ? (data.buttons || []) : [],
      });
    }
  }
  return blocks;
}

function getNodeInfo(node: Node): NodeInfo {
  const t = node.type;
  const d = node.data as Record<string, unknown>;

  if (t === 'MESSAGE' || t === 'SEND_MESSAGE') {
    const blocks = getBlocks(d);
    let resolvedText = '';
    let resolvedImageUrl: string | undefined = undefined;
    let resolvedButtons: ButtonData[] = [];
    let isInput = false;
    let inputPrompt = 'Please enter a value:';

    blocks.forEach((block) => {
      if (block.type === 'text') {
        if (block.text) {
          if (resolvedText) resolvedText += '\n\n';
          resolvedText += asString(block.text);
        }
        if (Array.isArray(block.buttons)) {
          resolvedButtons = [...resolvedButtons, ...block.buttons];
        }
      } else if (block.type === 'image') {
        if (block.imageUrl) {
          resolvedImageUrl = asString(block.imageUrl);
        }
        if (Array.isArray(block.buttons)) {
          resolvedButtons = [...resolvedButtons, ...block.buttons];
        }
      } else if (block.type === 'data_collection') {
        isInput = true;
        if (block.text) {
          inputPrompt = asString(block.text, inputPrompt);
        }
      } else if (block.type === 'telegram_menu') {
        if (Array.isArray(block.buttons)) {
          resolvedButtons = [...resolvedButtons, ...block.buttons];
        }
      }
    });

    if (isInput) {
      return { kind: 'input', text: inputPrompt };
    }
    return {
      kind: 'message',
      text: resolvedText || (d?.text as string) || '',
      imageUrl: resolvedImageUrl || (d?.imageUrl as string | undefined),
      buttons: resolvedButtons.length > 0 ? resolvedButtons : ((d?.buttons as ButtonData[]) || []),
    };
  }
  if (t === 'DATA_COLLECTION') {
    return { kind: 'input', text: (d?.text as string) || 'Please enter a value:' };
  }
  if (t === 'SMART_DELAY') {
    const sec = (d?.delaySeconds as number) || 0;
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const parts: string[] = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s || !parts.length) parts.push(`${s}s`);
    return { kind: 'auto', text: `⏱ Smart Delay: ${parts.join(' ')}` };
  }
  if (t === 'ACTION')           return { kind: 'auto', text: '⚡ Action step (auto)' };
  if (t === 'API_CALL')         return { kind: 'auto', text: '🌐 AI / API step (auto)' };
  if (t === 'START_AUTOMATION') return { kind: 'auto', text: '🚀 Starting automation…' };

  if (t === 'RANDOMIZER') {
    const vars = (d?.variations as Array<{ id: string; label: string; percentage: number; color?: string }>) || [
      { id: 'variation_0', label: 'A', percentage: 50, color: '#7C3AED' },
      { id: 'variation_1', label: 'B', percentage: 50, color: '#B45309' }
    ];
    return {
      kind: 'path',
      pathChoice: {
        title: 'Choose the path to continue',
        subtitle:
          'In real conversation, the path will be determined automatically to roughly meet the percentage proportions.',
        options: vars.map((v, i) => ({
          label: v.label,
          value: v.id,
          percentage: v.percentage,
          color: v.color || VARIATION_COLORS[i % VARIATION_COLORS.length],
        })),
        sourceNodeId: node.id,
      },
    };
  }
  if (t === 'CONDITION') {
    return {
      kind: 'path',
      pathChoice: {
        title: 'Choose the path to continue',
        subtitle: `Condition: ${d?.variableName ?? 'variable'} ${d?.operator ?? '='} ${d?.value ?? '…'}\nIn real conversation the path is chosen automatically.`,
        options: [
          { label: '✅ True', value: 'branch_0', color: '#16a34a' },
          { label: '❌ False', value: 'fallback', color: '#dc2626' },
        ],
        sourceNodeId: node.id,
      },
    };
  }

  return { kind: 'skip' };
}

const SCROLL_STYLE = `
  .inline-preview-scroll::-webkit-scrollbar { width: 3px; }
  .inline-preview-scroll::-webkit-scrollbar-track { background: transparent; }
  .inline-preview-scroll::-webkit-scrollbar-thumb { background: #2a3f52; border-radius: 10px; }
  .inline-preview-scroll { scrollbar-width: thin; scrollbar-color: #2a3f52 transparent; }
`;

function ButtonGrid({
  buttons,
  consumed,
  onClick,
}: {
  buttons: ButtonData[];
  consumed?: boolean;
  onClick?: (btn: ButtonData) => void;
}) {
  if (!buttons.length) return null;
  const rows = buttons.reduce<Record<string, ButtonData[]>>((acc, btn) => {
    const r = btn.row ?? '0';
    if (!acc[r]) acc[r] = [];
    acc[r].push(btn);
    return acc;
  }, {});
  return (
    <div className="flex flex-col gap-[3px] mt-[6px] w-full">
      {Object.values(rows).map((rowBtns, ri) => (
        <div key={ri} className="flex gap-[3px] w-full">
          {rowBtns.map((btn, bi) => (
            <button
              key={bi}
              onClick={() => !consumed && onClick?.(btn)}
              disabled={consumed}
              className={`flex-1 text-[11px] font-semibold py-[6px] px-2 rounded-[6px] border transition-colors text-center leading-tight ${
                consumed
                  ? 'border-[#3a4a5c] text-[#4a6070] cursor-default bg-transparent'
                  : 'border-[#3c5a7a] text-[#6ab2e8] hover:bg-[#1e3a52] cursor-pointer bg-transparent'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-[3px] px-3 py-2 bg-[#182533] rounded-2xl rounded-tl-none w-fit">
    <span className="w-1.5 h-1.5 rounded-full bg-[#6d8599] animate-bounce [animation-delay:0ms]" />
    <span className="w-1.5 h-1.5 rounded-full bg-[#6d8599] animate-bounce [animation-delay:150ms]" />
    <span className="w-1.5 h-1.5 rounded-full bg-[#6d8599] animate-bounce [animation-delay:300ms]" />
  </div>
);

export const InlineFlowPreview: React.FC<InlineFlowPreviewProps> = ({
  nodes,
  edges,
  startNodeType = 'START',
}) => {
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId]   = useState<string | null>(null);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [showTyping, setShowTyping]          = useState(false);
  const [pathChoice, setPathChoice]         = useState<PathChoice | null>(null);
  const [inputValue, setInputValue]         = useState('');
  const chatEndRef     = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((tid) => window.clearTimeout(tid));
    timeoutsRef.current = [];
  }, []);

  const registerTimeout = useCallback((fn: () => void, delay: number) => {
    const tid = window.setTimeout(fn, delay);
    timeoutsRef.current.push(tid);
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  const addBotMsg = useCallback((msg: Omit<ChatMessage, 'id'>) =>
    setMessages((p) => [...p, { id: crypto.randomUUID(), ...msg }]), []);

  const addUserMsg = useCallback((text: string) =>
    setMessages((p) => [...p, { id: crypto.randomUUID(), text, isUser: true }]), []);

  const consumeLastButtons = useCallback(() =>
    setMessages((p) => {
      const c = [...p];
      for (let i = c.length - 1; i >= 0; i--) {
        if (!c[i].isUser && c[i].buttons?.length) { c[i] = { ...c[i], buttonsConsumed: true }; break; }
      }
      return c;
    }), []);

  const walkToNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) {
      setShowTyping(false);
      addBotMsg({ text: '— end of flow —' });
      setCurrentNodeId(null);
      return;
    }
    const info = getNodeInfo(node);

    if (info.kind === 'skip') {
      setShowTyping(false);
      const next = getNextNodeId(nodeId, edges);
      if (next) registerTimeout(() => walkToNode(next), 100);
      else { addBotMsg({ text: '— end of flow —' }); setCurrentNodeId(null); }
      return;
    }

    setShowTyping(false);

    if (info.kind === 'path') {
      setPathChoice(info.pathChoice);
      setCurrentNodeId(nodeId);
      return;
    }

    if (info.kind === 'input') {
      addBotMsg({ text: info.text, nodeId });
      setCurrentNodeId(nodeId);
      setWaitingForInput(true);
      registerTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    if (info.kind === 'auto') {
      addBotMsg({ text: info.text, nodeId });
      const next = getNextNodeId(nodeId, edges);
      setCurrentNodeId(next);
      if (next) { setShowTyping(true); registerTimeout(() => walkToNode(next), 700); }
      return;
    }

    const hasButtons = !!(info.buttons?.length);
    addBotMsg({ text: info.text, imageUrl: info.imageUrl, buttons: hasButtons ? info.buttons : undefined, nodeId });
    if (hasButtons) { setCurrentNodeId(nodeId); return; }
    setCurrentNodeId(nodeId);
    const next = getNextNodeId(nodeId, edges);
    if (next) { setShowTyping(true); registerTimeout(() => walkToNode(next), 800); }
    else { registerTimeout(() => addBotMsg({ text: '— end of flow —' }), 800); }
  }, [nodes, edges, addBotMsg, registerTimeout]);

  const restart = useCallback(() => {
    clearAllTimeouts();
    setMessages([]);
    setWaitingForInput(false);
    setShowTyping(false);
    setPathChoice(null);
    setInputValue('');

    const startId = getStartNodeId(nodes, startNodeType);
    if (!startId) { addBotMsg({ text: 'No start node found.' }); return; }
    const firstId = getNextNodeId(startId, edges);
    if (!firstId) { addBotMsg({ text: 'Nothing connected to the start node.' }); return; }
    setShowTyping(true);
    registerTimeout(() => walkToNode(firstId), 400);
  }, [nodes, edges, walkToNode, addBotMsg, startNodeType, clearAllTimeouts, registerTimeout]);

  useEffect(() => {
    restart();
  }, [nodes, edges, restart]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping, pathChoice]);

  const handleButtonClick = useCallback((btn: ButtonData) => {
    consumeLastButtons();
    addUserMsg(btn.label);
    const next = getNextNodeId(currentNodeId ?? '', edges, btn.value);
    setCurrentNodeId(next);
    if (!next) { registerTimeout(() => addBotMsg({ text: '— end of flow —' }), 300); return; }
    setShowTyping(true);
    registerTimeout(() => walkToNode(next), 500);
  }, [currentNodeId, edges, walkToNode, addBotMsg, addUserMsg, consumeLastButtons, registerTimeout]);

  const handlePathChoice = useCallback((opt: { label: string; value: string }, sourceNodeId: string) => {
    setPathChoice(null);
    addUserMsg(opt.label);
    const next = getNextNodeId(sourceNodeId, edges, opt.value);
    setCurrentNodeId(next);
    if (!next) { registerTimeout(() => addBotMsg({ text: '— end of flow —' }), 300); return; }
    setShowTyping(true);
    registerTimeout(() => walkToNode(next), 500);
  }, [edges, walkToNode, addBotMsg, addUserMsg, registerTimeout]);

  const handleSendInput = useCallback(() => {
    const val = inputValue.trim();
    if (!val) return;
    addUserMsg(val);
    setInputValue('');
    setWaitingForInput(false);
    const next = getNextNodeId(currentNodeId ?? '', edges);
    setCurrentNodeId(next);
    if (!next) { registerTimeout(() => addBotMsg({ text: '— end of flow —' }), 300); return; }
    setShowTyping(true);
    registerTimeout(() => walkToNode(next), 500);
  }, [inputValue, currentNodeId, edges, walkToNode, addBotMsg, addUserMsg, registerTimeout]);

  const currentNode = nodes.find((n) => n.id === currentNodeId);
  const currentInfo = currentNode ? getNodeInfo(currentNode) : null;
  const needsTap =
    currentNodeId && currentInfo?.kind === 'message' &&
    !waitingForInput && !showTyping && !pathChoice &&
    !(currentInfo.buttons?.length);

  const handleContinue = useCallback(() => {
    if (!currentNodeId) return;
    const next = getNextNodeId(currentNodeId, edges);
    setCurrentNodeId(next);
    if (!next) { addBotMsg({ text: '— end of flow —' }); return; }
    setShowTyping(true);
    registerTimeout(() => walkToNode(next), 400);
  }, [currentNodeId, edges, walkToNode, addBotMsg, registerTimeout]);

  return (
    <>
      <style>{SCROLL_STYLE}</style>
      <div className="flex items-start gap-2.5 relative w-full justify-center">
        <div
          className="flex flex-col bg-[#17212b] overflow-hidden relative border-[6px] border-[#111921] shadow-2xl"
          style={{
            width: '100%',
            maxWidth: '300px',
            height: '460px',
            borderRadius: '2rem',
          }}
        >
          <div className="flex justify-center pt-1.5 pb-0 shrink-0">
            <div className="w-16 h-[4px] bg-[#111921] rounded-full" />
          </div>

          <div className="flex items-center justify-between px-3.5 pt-1 pb-2 bg-[#17212b] border-b border-[#111921]/70 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-650 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                L
              </div>
              <div className="min-w-0">
                <div className="text-white text-[11px] font-bold leading-none truncate">Launchly Preview</div>
                <div className="text-[#6d8599] text-[9px] font-medium mt-0.5">Business chat</div>
              </div>
            </div>
            <button
              onClick={restart}
              title="Restart preview"
              className="text-[#6d8599] hover:text-white transition-colors cursor-pointer p-1"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 inline-preview-scroll relative"
            style={{ background: '#0e1621' }}
          >
            {messages.map((msg) => {
              if (msg.isUser) {
                return (
                  <div key={msg.id} className="flex justify-end animate-in slide-in-from-bottom-1 duration-150">
                    <div className="bg-[#2b5278] text-white text-[11px] leading-relaxed rounded-[12px] rounded-br-[3px] py-1.5 px-2.5 max-w-[80%] font-sans shadow-sm break-words">
                      {msg.text}
                    </div>
                  </div>
                );
              }
              if (msg.text === '— end of flow —') {
                return (
                  <div key={msg.id} className="flex justify-center py-1 animate-in fade-in duration-200">
                    <span className="text-[8px] text-[#4a6070] italic">— end of flow —</span>
                  </div>
                );
              }
              return (
                <div key={msg.id} className="flex flex-col items-start gap-0.5 animate-in slide-in-from-bottom-1 duration-150">
                  <div className="flex items-start gap-1.5 max-w-[90%]">
                    <div className="w-5.5 h-5.5 rounded-full bg-[#2a3f52] flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0 w-full">
                      {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="" className="rounded-xl max-h-24 object-cover mb-1 w-full" />
                      )}
                      {msg.text && (
                        <div className="bg-[#182533] text-[#e8eaed] text-[11px] leading-normal rounded-[12px] rounded-tl-[3px] py-1.5 px-2.5 font-sans shadow-sm whitespace-pre-wrap break-words">
                          {msg.text}
                          {msg.buttons && msg.buttons.length > 0 && (
                            <ButtonGrid
                              buttons={msg.buttons}
                              consumed={msg.buttonsConsumed}
                              onClick={!msg.buttonsConsumed ? handleButtonClick : undefined}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {showTyping && (
              <div className="flex items-start gap-1.5 animate-in fade-in duration-200">
                <div className="w-5.5 h-5.5 rounded-full bg-[#2a3f52] flex-shrink-0 mt-0.5" />
                <TypingDots />
              </div>
            )}

            {needsTap && (
              <div
                onClick={handleContinue}
                className="self-center mt-0.5 text-[9px] text-[#4a9eda] font-semibold cursor-pointer hover:text-[#6ab8f7] transition-colors animate-in fade-in duration-300 select-none"
              >
                Tap to continue →
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {pathChoice && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-4 py-4 animate-in fade-in duration-200"
              style={{ background: '#17212b', zIndex: 20 }}
            >
              <div className="text-white text-[12px] font-bold text-center leading-tight mb-2">
                {pathChoice.title}
              </div>
              <div className="text-[#6d8599] text-[9px] text-center leading-normal mb-3 px-1 whitespace-pre-wrap">
                {pathChoice.subtitle}
              </div>
              <div className="w-full flex flex-col gap-1 max-h-36 overflow-y-auto inline-preview-scroll">
                {pathChoice.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handlePathChoice(opt, pathChoice.sourceNodeId)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#1e2d3d] hover:bg-[#263545] border border-[#2b3c50] hover:border-[#3c5a7a] rounded-lg transition-all cursor-pointer text-left group"
                  >
                    <span className="text-white text-[11px] font-semibold">{opt.label}</span>
                    <div className="flex items-center gap-1.5">
                      {opt.percentage !== undefined && (
                        <span className="text-[#6d8599] text-[10px] font-medium">{opt.percentage}%</span>
                      )}
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: opt.color || '#7c3aed' }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {waitingForInput && (
            <div className="bg-[#17212b] border-t border-[#111921]/60 px-2 py-2 flex items-center gap-1.5 shrink-0 animate-in slide-in-from-bottom-2 duration-200">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendInput()}
                placeholder="Message..."
                className="flex-1 bg-[#242f3d] border border-[#2b3c50] rounded-full py-1 px-3 text-[11px] text-white placeholder-[#4a6070] focus:outline-none focus:border-[#4a9eda] transition-colors font-sans"
              />
              <button
                onClick={handleSendInput}
                disabled={!inputValue.trim()}
                className="text-[#4a9eda] hover:text-[#6ab8f7] disabled:text-[#3a4a5c] transition-colors cursor-pointer disabled:cursor-default shrink-0 p-0.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
