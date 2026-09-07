import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  RotateCcw,
  MessageSquare,
  Smartphone,
  ArrowRight,
  Send,
  Paperclip,
  Mic,
  Gift,
  UserCheck,
  Zap,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { AiIcon } from '../../../../components/ui/AiIcon';
import { useTranslation } from '../../../../i18n/config';

export interface CanvasButton {
  id: string;
  label: string;
  targetNodeId: string;
}

export type CanvasNodeType = 'text' | 'buttons' | 'promo' | 'form' | 'ai';

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  title: string;
  message: string;
  x: number;
  y: number;
  buttons?: CanvasButton[];
  promoCode?: string;
  formFieldLabel?: string;
}

const INITIAL_NODES: CanvasNode[] = [
  {
    id: 'node-start',
    type: 'buttons',
    title: '1. Стартовий тригер /start',
    message: 'Привіт! 👋 Вітаємо в Launchly. Оберіть потрібну дію:',
    x: 20,
    y: 20,
    buttons: [
      { id: 'btn-1', label: '🎁 Отримати Гайд', targetNodeId: 'node-guide' },
      { id: 'btn-2', label: '💳 Знижка 20%', targetNodeId: 'node-promo' },
      { id: 'btn-3', label: '🤖 Написати AI', targetNodeId: 'node-ai' }
    ]
  },
  {
    id: 'node-guide',
    type: 'text',
    title: '2. Видача Гайду',
    message: '✅ Твій PDF-гайд "10 кроків до автоматизації" успішно завантажено!',
    x: 360,
    y: 20
  },
  {
    id: 'node-promo',
    type: 'promo',
    title: '3. Персональна знижка',
    message: '🎉 Промокод на знижку 20% активовано! Дійсний 24 години.',
    promoCode: 'LAUNCH20',
    x: 360,
    y: 220
  },
  {
    id: 'node-ai',
    type: 'ai',
    title: '4. AI Консультант',
    message: '🤖 Я розумний AI-асистент. Опишіть вашу нішу, і я підберу скрипт!',
    x: 360,
    y: 420
  }
];

export const InteractiveNodeBuilderDemo: React.FC = () => {
  const { t } = useTranslation();

  const [nodes, setNodes] = useState<CanvasNode[]>(INITIAL_NODES);
  const [activeNodeId, setActiveNodeId] = useState<string>('node-start');
  const [chatHistory, setChatHistory] = useState<
    Array<{ id: string; sender: 'bot' | 'user'; text: string; buttons?: CanvasButton[]; promoCode?: string }>
  >([]);
  const [customInput, setCustomInput] = useState('');
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [connectionLines, setConnectionLines] = useState<
    Array<{ id: string; fromX: number; fromY: number; toX: number; toY: number; isActive: boolean; isHovered: boolean }>
  >([]);
  const resetSimulation = () => {
    const startNode = nodes.find((n) => n.id === 'node-start') || nodes[0];
    if (startNode) {
      setActiveNodeId(startNode.id);
      setChatHistory([
        {
          id: 'start-msg-' + Date.now(),
          sender: 'bot',
          text: startNode.message,
          buttons: startNode.buttons,
          promoCode: startNode.promoCode
        }
      ]);
    }
  };

  useEffect(() => {
    resetSimulation();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const calculateLines = () => {
      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const lines: Array<{
        id: string;
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        isActive: boolean;
        isHovered: boolean;
      }> = [];

      nodes.forEach((sourceNode) => {
        if (!sourceNode.buttons) return;

        sourceNode.buttons.forEach((btn) => {
          const targetNode = nodes.find((n) => n.id === btn.targetNodeId);
          if (!targetNode) return;

          const btnEl = document.getElementById(`btn-port-${btn.id}`);
          const targetEl = document.getElementById(`node-port-${targetNode.id}`);

          if (btnEl && targetEl) {
            const btnRect = btnEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();

            const fromX = btnRect.left + btnRect.width / 2 - canvasRect.left;
            const fromY = btnRect.top + btnRect.height / 2 - canvasRect.top;
            const toX = targetRect.left + targetRect.width / 2 - canvasRect.left;
            const toY = targetRect.top + targetRect.height / 2 - canvasRect.top;

            lines.push({
              id: `${btn.id}-${targetNode.id}`,
              fromX,
              fromY,
              toX,
              toY,
              isActive: activeNodeId === targetNode.id,
              isHovered: hoveredButtonId === btn.id
            });
          }
        });
      });

      setConnectionLines(lines);
    };

    const timer = setTimeout(calculateLines, 50);
    window.addEventListener('resize', calculateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateLines);
    };
  }, [nodes, activeNodeId, hoveredButtonId]);
  const handleButtonClickInChat = (btn: CanvasButton) => {
    const targetNode = nodes.find((n) => n.id === btn.targetNodeId);

    setChatHistory((prev) => [
      ...prev,
      { id: 'user-' + Date.now(), sender: 'user', text: btn.label }
    ]);

    if (targetNode) {
      setActiveNodeId(targetNode.id);
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: targetNode.message,
            buttons: targetNode.buttons,
            promoCode: targetNode.promoCode
          }
        ]);
      }, 350);
    }
  };
  const handleAddNode = (type: CanvasNodeType) => {
    const newId = 'node-' + Date.now();
    const count = nodes.length + 1;

    let title = `Нода #${count}`;
    let message = `Текст ноди #${count}. Редагуйте прямо тут!`;
    let promoCode: string | undefined = undefined;

    if (type === 'promo') {
      title = `Промокод #${count}`;
      message = `🎉 Тримай промокод на знижку!`;
      promoCode = `PROMO_${count}`;
    } else if (type === 'ai') {
      title = `AI Асистент #${count}`;
      message = `🤖 Я штучний інтелект. Готовий відповідати на будь-які питання!`;
    } else if (type === 'form') {
      title = `Збір даних #${count}`;
      message = `📝 Залиште ваші контактні дані для зв'язку.`;
    }

    const newNode: CanvasNode = {
      id: newId,
      type,
      title,
      message,
      x: 360,
      y: 100 + (nodes.length % 3) * 150,
      promoCode
    };

    setNodes((prev) => [...prev, newNode]);
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === 'node-start') {
          const currentBtns = n.buttons || [];
          const newBtn: CanvasButton = {
            id: 'btn-' + Date.now(),
            label: `➔ ${title}`,
            targetNodeId: newId
          };
          return { ...n, buttons: [...currentBtns, newBtn] };
        }
        return n;
      })
    );
  };

  const handleDeleteNode = (id: string) => {
    if (id === 'node-start') return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (activeNodeId === id) setActiveNodeId('node-start');
  };
  const handleUpdateNodeMessage = (id: string, message: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, message } : n)));
  };

  const handleUpdateNodeTitle = (id: string, title: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, title } : n)));
  };

  const handleAddButton = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const currentBtns = n.buttons || [];
          const target = nodes.find((x) => x.id !== nodeId)?.id || 'node-start';
          const newBtn: CanvasButton = {
            id: 'btn-' + Date.now(),
            label: `Кнопка ${currentBtns.length + 1}`,
            targetNodeId: target
          };
          return { ...n, type: 'buttons', buttons: [...currentBtns, newBtn] };
        }
        return n;
      })
    );
  };

  const handleUpdateButtonLabel = (nodeId: string, btnId: string, label: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId && n.buttons) {
          return {
            ...n,
            buttons: n.buttons.map((b) => (b.id === btnId ? { ...b, label } : b))
          };
        }
        return n;
      })
    );
  };

  const handleUpdateButtonTarget = (nodeId: string, btnId: string, targetNodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId && n.buttons) {
          return {
            ...n,
            buttons: n.buttons.map((b) => (b.id === btnId ? { ...b, targetNodeId } : b))
          };
        }
        return n;
      })
    );
  };

  const handleDeleteButton = (nodeId: string, btnId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId && n.buttons) {
          return { ...n, buttons: n.buttons.filter((b) => b.id !== btnId) };
        }
        return n;
      })
    );
  };

  const handleSendCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const text = customInput;
    setCustomInput('');

    setChatHistory((prev) => [
      ...prev,
      { id: 'user-' + Date.now(), sender: 'user', text }
    ]);

    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: `🤖 Дякуємо за відповідь! Воронка підхопила повідомлення: "${text}"`
        }
      ]);
    }, 450);
  };

  return (
    <section
      id="interactive-demo"
      className="py-20 md:py-28 bg-[#F2EBDD] border-b-4 border-[#0A0A0A] px-4 sm:px-6 lg:px-12 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-left mb-10 border-l-8 border-[#0A0A0A] pl-6">
          <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black text-[#0A0A0A] mb-3 uppercase leading-tight">
            {t('landing.builder_demo.title', 'TRY THE NODE BUILDER RIGHT NOW')}
          </h2>
          <p className="text-base sm:text-lg text-[#0A0A0A]/85 font-bold max-w-3xl">
            {t(
              'landing.builder_demo.subtitle',
              'Add nodes, connect them with buttons, and see live results inside the Telegram simulator on the right.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#0A0A0A] text-[#F2EBDD] p-3 sm:p-4 rounded-xl border-3 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-['JetBrains_Mono',monospace] text-xs font-black uppercase text-amber-400 flex items-center gap-1 mr-2">
              <Layers size={15} />
              <span>+ Додати ноду на полотно:</span>
            </span>

            <button
              onClick={() => handleAddNode('text')}
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-emerald-600 text-white font-['JetBrains_Mono',monospace] text-xs font-extrabold rounded-lg border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare size={13} className="text-emerald-400" />
              <span>+ Текст</span>
            </button>

            <button
              onClick={() => handleAddNode('promo')}
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-amber-600 text-white font-['JetBrains_Mono',monospace] text-xs font-extrabold rounded-lg border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Gift size={13} className="text-amber-400" />
              <span>+ Промокод</span>
            </button>

            <button
              onClick={() => handleAddNode('form')}
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-sky-600 text-white font-['JetBrains_Mono',monospace] text-xs font-extrabold rounded-lg border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <UserCheck size={13} className="text-sky-400" />
              <span>+ Форма / Запит</span>
            </button>

            <button
              onClick={() => handleAddNode('ai')}
              className="px-3 py-1.5 bg-[#1E293B] hover:bg-purple-600 text-white font-['JetBrains_Mono',monospace] text-xs font-extrabold rounded-lg border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <AiIcon size={13} className="text-purple-400" />
              <span>+ AI Асистент</span>
            </button>
          </div>

          <button
            onClick={resetSimulation}
            className="px-3 py-1.5 bg-white text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:bg-amber-100 transition-all flex items-center gap-1 cursor-pointer ml-auto"
          >
            <RotateCcw size={13} />
            <span>Скинути</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between px-2 mb-2 font-['JetBrains_Mono',monospace] text-xs font-black uppercase text-[#0A0A0A]">
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500 fill-amber-500" />
                <span>FLOW BUILDER CANVAS ({nodes.length} NODES)</span>
              </span>
              <span className="text-[11px] text-emerald-800 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded">
                З'єднуйте порт-точки кнопок з нодами
              </span>
            </div>

            <div
              ref={canvasRef}
              className="relative min-h-[560px] sm:min-h-[620px] bg-[#0E1726] border-4 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] rounded-2xl p-4 sm:p-6 overflow-x-auto overflow-y-visible [background-image:radial-gradient(#2d3c52_1.5px,transparent_1.5px)] [background-size:20px_20px]"
            ><svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker
                    id="arrow-active"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                  </marker>
                  <marker
                    id="arrow-default"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
                  </marker>
                </defs>

                {connectionLines.map((line) => {
                  const dx = Math.abs(line.toX - line.fromX) * 0.5;
                  const pathData = `M ${line.fromX} ${line.fromY} C ${line.fromX + dx} ${line.fromY}, ${
                    line.toX - dx
                  } ${line.toY}, ${line.toX} ${line.toY}`;

                  const isHighlighted = line.isActive || line.isHovered;

                  return (
                    <g key={line.id}>
                      <path
                        d={pathData}
                        fill="none"
                        stroke={isHighlighted ? '#10B981' : '#475569'}
                        strokeWidth={isHighlighted ? 3.5 : 2}
                        strokeDasharray={line.isActive ? '6 4' : 'none'}
                        className={line.isActive ? 'animate-pulse' : ''}
                        markerEnd={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-20">
                {nodes.map((node) => {
                  const isActive = node.id === activeNodeId;

                  return (
                    <div
                      key={node.id}
                      className={`bg-white border-3 border-[#0A0A0A] rounded-xl p-4 transition-all relative ${
                        isActive
                          ? 'shadow-[6px_6px_0px_#10B981] ring-3 ring-emerald-400 -translate-y-0.5'
                          : 'shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A]'
                      }`}
                    >
                      <div
                        id={`node-port-${node.id}`}
                        className={`absolute -left-3 top-6 w-5 h-5 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-[9px] font-mono font-bold shadow ${
                          isActive ? 'bg-emerald-400 text-black animate-ping' : 'bg-slate-200 text-slate-700'
                        }`}
                        title="Input Port"
                      >
                        ●
                      </div>

                      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded border border-[#0A0A0A] flex items-center justify-center text-xs font-bold ${
                              node.type === 'promo'
                                ? 'bg-amber-300'
                                : node.type === 'form'
                                ? 'bg-sky-300'
                                : node.type === 'ai'
                                ? 'bg-purple-300'
                                : 'bg-emerald-300'
                            }`}
                          >
                            {node.type === 'promo' && <Gift size={12} />}
                            {node.type === 'form' && <UserCheck size={12} />}
                            {node.type === 'ai' && <AiIcon size={12} />}
                            {node.type === 'buttons' && <MessageSquare size={12} />}
                            {node.type === 'text' && <MessageSquare size={12} />}
                          </div>

                          <input
                            type="text"
                            value={node.title}
                            onChange={(e) => handleUpdateNodeTitle(node.id, e.target.value)}
                            className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] bg-transparent border-b border-dashed border-transparent hover:border-[#0A0A0A] outline-none px-1 py-0.5"
                          />
                        </div>

                        {node.id !== 'node-start' && (
                          <button
                            onClick={() => handleDeleteNode(node.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-['JetBrains_Mono',monospace] font-bold text-slate-500 uppercase mb-1">
                            Текст повідомлення в TG:
                          </label>
                          <textarea
                            rows={2}
                            value={node.message}
                            onChange={(e) => handleUpdateNodeMessage(node.id, e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-[#0A0A0A] font-sans text-xs font-medium text-[#0A0A0A] rounded-lg focus:bg-white outline-none resize-none"
                          />
                        </div>
                        {node.promoCode && (
                          <div className="p-1.5 bg-amber-50 border border-amber-300 rounded text-[11px] font-mono font-bold text-amber-900 flex items-center justify-between">
                            <span>Промокод:</span>
                            <code className="bg-amber-200 px-1 rounded">{node.promoCode}</code>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-['JetBrains_Mono',monospace] font-bold text-slate-500 uppercase">
                              Кнопки & Виходи ({node.buttons?.length || 0}):
                            </span>
                            <button
                              onClick={() => handleAddButton(node.id)}
                              className="text-[10px] font-['JetBrains_Mono',monospace] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus size={11} />
                              <span>+ Кнопка</span>
                            </button>
                          </div>

                          {node.buttons && node.buttons.length > 0 ? (
                            <div className="space-y-1.5">
                              {node.buttons.map((btn) => (
                                <div
                                  key={btn.id}
                                  onMouseEnter={() => setHoveredButtonId(btn.id)}
                                  onMouseLeave={() => setHoveredButtonId(null)}
                                  className="relative flex items-center gap-1.5 p-1.5 bg-[#F2EBDD]/60 border border-[#0A0A0A]/30 rounded-lg group"
                                >
                                  <input
                                    type="text"
                                    value={btn.label}
                                    onChange={(e) =>
                                      handleUpdateButtonLabel(node.id, btn.id, e.target.value)
                                    }
                                    className="flex-1 p-1 bg-white border border-[#0A0A0A] text-[11px] font-bold rounded outline-none"
                                  />

                                  <select
                                    value={btn.targetNodeId}
                                    onChange={(e) =>
                                      handleUpdateButtonTarget(node.id, btn.id, e.target.value)
                                    }
                                    className="p-1 bg-white border border-[#0A0A0A] text-[10px] font-bold rounded outline-none cursor-pointer"
                                  >
                                    {nodes.map((n) => (
                                      <option key={n.id} value={n.id}>
                                        ➜ {n.title}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    onClick={() => handleDeleteButton(node.id, btn.id)}
                                    className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  <div
                                    id={`btn-port-${btn.id}`}
                                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 border border-[#0A0A0A] flex items-center justify-center text-[8px] text-white font-mono shadow"
                                    title="Output Port (Connects to target)"
                                  >
                                    ➔
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">Немає кнопок.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="flex items-center justify-between px-2 mb-2 font-['JetBrains_Mono',monospace] text-xs font-black uppercase text-[#0A0A0A]">
              <span className="flex items-center gap-1">
                <Smartphone size={14} />
                <span>{t('landing.builder_demo.preview_telegram', 'Telegram Simulation')}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t('landing.builder_demo.online', 'online')}</span>
              </span>
            </div>

            <div className="bg-[#0A0A0A] p-3 sm:p-4 rounded-[36px] shadow-[10px_10px_0px_#0A0A0A] border-4 border-[#0A0A0A] relative overflow-hidden">
              <div className="w-32 h-4 bg-[#0A0A0A] mx-auto rounded-b-xl mb-2 relative z-20"></div>
              <div className="bg-[#0e1621] rounded-[24px] overflow-hidden flex flex-col h-[520px] sm:h-[580px] border border-slate-700 relative z-10">
                <div className="bg-[#17212b] px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 border-2 border-white/20 flex items-center justify-center text-white font-black text-xs shadow-inner">
                        L
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#17212b]"></span>
                    </div>

                    <div>
                      <h4 className="text-white font-bold text-xs sm:text-sm leading-tight flex items-center gap-1">
                        <span>Launchly Bot</span>
                        <CheckCircle2 size={13} className="text-sky-400 fill-sky-400 stroke-[#17212b]" />
                      </h4>
                      <p className="text-[10px] text-sky-400 font-medium">bot • active flow</p>
                    </div>
                  </div>

                  <button
                    onClick={resetSimulation}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-['JetBrains_Mono',monospace]"
                    title="Restart /start"
                  >
                    <RotateCcw size={12} />
                    <span className="hidden sm:inline">/start</span>
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0e1621] bg-[radial-gradient(#1c2938_1px,transparent_1px)] [background-size:12px_12px]">
                  <div className="text-center my-1">
                    <span className="px-2.5 py-1 bg-[#182533]/80 text-slate-400 text-[10px] font-bold rounded-full border border-slate-700/50">
                      Сьогодні
                    </span>
                  </div>

                  {chatHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col ${
                        item.sender === 'user' ? 'items-end' : 'items-start'
                      } space-y-1.5 animate-fadeIn`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm font-medium shadow-md leading-relaxed whitespace-pre-line ${
                          item.sender === 'user'
                            ? 'bg-[#2b5278] text-white rounded-tr-none'
                            : 'bg-[#182533] text-slate-100 rounded-tl-none border border-slate-700/50'
                        }`}
                      >
                        {item.text}

                        {item.promoCode && (
                          <div className="mt-2.5 p-2 bg-[#242f3d] border border-amber-500/40 rounded-xl text-center">
                            <span className="text-[10px] uppercase text-amber-400 font-bold block">
                              Активований Промокод
                            </span>
                            <code className="text-xs font-mono font-black text-amber-300 tracking-wider">
                              {item.promoCode}
                            </code>
                          </div>
                        )}

                        <div
                          className={`text-[9px] mt-1 text-right font-mono ${
                            item.sender === 'user' ? 'text-sky-200' : 'text-slate-500'
                          }`}
                        >
                          12:42
                        </div>
                      </div>
                      {item.sender === 'bot' && item.buttons && item.buttons.length > 0 && (
                        <div className="w-[85%] space-y-1.5 pt-1">
                          {item.buttons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleButtonClickInChat(btn)}
                              className="w-full py-2 px-3 bg-[#242f3d] hover:bg-[#2b394a] active:bg-[#34465b] text-sky-300 font-semibold text-xs rounded-xl border border-sky-500/20 shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                            >
                              <span>{btn.label}</span>
                              <ArrowRight
                                size={12}
                                className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-sky-400"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div ref={chatBottomRef} />
                </div>
                <form
                  onSubmit={handleSendCustomInput}
                  className="bg-[#17212b] p-2.5 border-t border-slate-800 flex items-center gap-2 shrink-0"
                >
                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <Paperclip size={16} />
                  </button>

                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={t('landing.demo.input_placeholder', 'Write a message...')}
                    className="flex-1 bg-[#0e1621] text-white placeholder-slate-500 text-xs px-3 py-2 rounded-full border border-slate-700 focus:outline-none focus:border-sky-500 transition-colors font-sans"
                  />

                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 transition-colors shrink-0 shadow-md cursor-pointer"
                  >
                    {customInput.trim() ? <Send size={14} /> : <Mic size={14} />}
                  </button>
                </form>
              </div>
              <div className="w-28 h-1 bg-slate-700 mx-auto rounded-full mt-2"></div>
            </div>

            <p className="text-[11px] font-['JetBrains_Mono',monospace] font-bold text-[#0A0A0A]/60 text-center mt-3">
              💡 {t('landing.builder_demo.test_click_hint', 'Click inline buttons in chat to test the workflow')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
