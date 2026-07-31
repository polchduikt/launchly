import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, Send, RotateCcw, Pencil, Plus, Trash2, ChevronDown, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SiClaude, SiGooglegemini } from '@icons-pack/react-simple-icons';
import { t } from '../../../../../../i18n/config';
import { useIntegrationsQuery } from '../../../../../../hooks/integration/useIntegrationQueries';
import type { IntegrationResponse } from '../../../../../../types';

interface AiEditorState {
  setNextStepSourceHandle?: (handle: string) => void;
  setIsNextStepDrawerOpen?: (open: boolean) => void;
  isNextStepDrawerOpen?: boolean;
}

interface AiNodeEditorProps {
  data: Record<string, unknown>;
  handleChange: (keyOrObj: string | Record<string, unknown>, value?: unknown) => void;
  editorState?: AiEditorState;
}

export const AiNodeEditor: React.FC<AiNodeEditorProps> = ({ data, handleChange, editorState }) => {
  const navigate = useNavigate();
  const { data: integrations = [] } = useIntegrationsQuery();
  const generated = !!data.generated;
  const prompt = typeof data.prompt === 'string' ? data.prompt : '';
  const context = typeof data.context === 'string' ? data.context : '';
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const [promptInput, setPromptInput] = useState(prompt);
  const [contextInput, setContextInput] = useState(context);
  const [showGoalTooltip, setShowGoalTooltip] = useState(false);
  const [showContextTooltip, setShowContextTooltip] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<{ id: string; name: string; icon: React.ReactNode }[]>([]);

  useEffect(() => {
    const list: { id: string; name: string; icon: React.ReactNode }[] = [];
    integrations.forEach((i: IntegrationResponse) => {
      if (!i.active) return;
      if (i.type === 'CHATGPT') {
        list.push({
          id: 'chatgpt',
          name: 'ChatGPT',
          icon: (
            <svg className="w-3.5 h-3.5 text-slate-900 fill-current" viewBox="0 0 256 260">
              <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
            </svg>
          ),
        });
      } else if (i.type === 'CLAUDE') {
        list.push({
          id: 'claude',
          name: 'Claude',
          icon: <SiClaude className="w-3.5 h-3.5 text-[#D97757]" />,
        });
      } else if (i.type === 'DEEPSEEK') {
        list.push({
          id: 'deepseek',
          name: 'DeepSeek',
          icon: (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4D6BFE" d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 0 1-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 0 0-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 0 1-.465.137 9.597 9.597 0 0 0-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 0 0 1.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 0 1 1.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 0 1 .415-.287.302.302 0 0 1 .2.288.306.306 0 0 1-.31.307.303.303 0 0 1-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 0 1-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 0 1 .016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 0 1-.254-.078.253.253 0 0 1-.114-.358c.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" />
            </svg>
          ),
        });
      } else if (i.type === 'GEMINI') {
        list.push({
          id: 'gemini',
          name: 'Gemini',
          icon: <SiGooglegemini className="w-3.5 h-3.5 text-[#4285F4]" />,
        });
      }
    });
    setConnectedProviders(list);
    setHasProvider(list.length > 0);

    if (list.length > 0 && !data.provider) {
      handleChange('provider', list[0].id);
    }
  }, [handleChange, data.provider, integrations]);

  const [chatMessages, setChatMessages] = useState<{ sender: 'bot' | 'user'; text: string }[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setPromptInput(prompt);
  }, [prompt]);

  useEffect(() => {
    setContextInput(context);
  }, [context]);

  useEffect(() => {
    setChatMessages([]);
  }, [generated, prompt, context, hasProvider]);

  const handleGenerate = () => {
    if (!promptInput.trim()) return;
    const autoTasks = [
      `Inform the user about ${promptInput.trim()}.`,
      `Provide helpful answers using the provided context.`
    ];

    handleChange({
      prompt: promptInput.trim(),
      context: contextInput.trim(),
      tasks: autoTasks,
      generated: true
    });
  };

  const handleEditContext = () => {
    handleChange('generated', false);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const updatedTasks = [...tasks, newTaskText.trim()];
    handleChange('tasks', updatedTasks);
    setNewTaskText('');
    setIsAddingTask(false);
  };

  const handleRemoveTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    handleChange('tasks', updatedTasks);
  };

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    const userText = userMessage.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setUserMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = "";

      const lowerText = userText.toLowerCase();
      const isUkrainian = /[а-яіїєґ]/i.test(lowerText);

      if (isUkrainian) {
        if (context.toLowerCase().includes('рідин') || context.toLowerCase().includes('картридж') || context.toLowerCase().includes('вейп')) {
          if (lowerText.includes('що') || lowerText.includes('асортимент') || lowerText.includes('є') || lowerText.includes('продукт')) {
            reply = "У нашому вейп шопі в асортименті є рідини та картриджі. Що саме вас цікавить?";
          } else {
            reply = "Ми продаємо рідини та картриджі у нашому магазині. Чи є у вас питання щодо конкретного смаку чи сумісності?";
          }
        } else if (context) {
          reply = `Ось інформація з мого контексту: "${context}". Чим я можу допомогти вам детальніше?`;
        } else {
          reply = `Звісно! Я тут, щоб допомогти вам із ціллю: "${prompt}". Яке саме питання вас цікавить?`;
        }
      } else {
        if (lowerText.includes('spec') || lowerText.includes('car') || lowerText.includes('site')) {
          if (context.toLowerCase().includes('car')) {
            reply = "According to our specifications, we track detailed stats including engine capacity, horsepower, and torque. Let me know if you want stats for a specific model!";
          } else if (context) {
            reply = `Here is what I know: ${context}. Let me know if you need more details!`;
          } else {
            reply = `Sure! I am here to help you with: "${prompt}". What specific details are you looking for?`;
          }
        } else if (lowerText.includes('hello') || lowerText.includes('hi')) {
          reply = "Hello! How can I assist you today?";
        } else {
          reply = `I've noted your message: "${userText}". Based on my goal to "${prompt}", is there anything specific you would like to know?`;
        }
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 1200);
  };

  const handleRestartPreview = () => {
    setChatMessages([]);
    setUserMessage('');
    setIsTyping(false);
  };

  if (!hasProvider) {
    return (
      <div className="space-y-6 flex-1 flex flex-col justify-between select-none">
        <div className="bg-[#FFF7F5] border border-[#FFEDE9] p-5 rounded-3xl space-y-4 shadow-xs mt-2">
          <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <Settings size={20} className="animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {t('editor.ai.provider_required')}
            </h4>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {t('editor.ai.provider_desc')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings?tab=integrations')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl border-none transition-all cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Settings size={13} />
            {t('editor.ai.go_to_settings')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-start">
      <div className="space-y-2 mt-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {t('editor.ai.choose_provider')}
        </label>
        <div className="flex flex-wrap gap-2">
          {connectedProviders.map((p) => {
            const isActive = data.provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleChange('provider', p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-xs select-none ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-extrabold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-800'
                }`}
              >
                {p.icon}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!generated ? (
        <div className="space-y-5">
          <div className="space-y-2 relative">
            <div className="flex items-center gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t('editor.ai.tell_ai')}
              </label>
              <button
                type="button"
                onMouseEnter={() => setShowGoalTooltip(true)}
                onMouseLeave={() => setShowGoalTooltip(false)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0"
              >
                <HelpCircle size={12} />
              </button>
            </div>

            {showGoalTooltip && (
              <div className="absolute top-6 left-0 bg-slate-800 text-white text-[10px] p-2.5 rounded-xl z-50 shadow-lg max-w-[240px] leading-relaxed font-medium">
                {t('editor.ai.tell_ai_tooltip')}
              </div>
            )}

            <div className="relative">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={t('editor.ai.goal_placeholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-xs font-bold text-slate-800 transition-all bg-white shadow-xs resize-none"
              />
              <div className="absolute bottom-2.5 right-3 text-slate-350">
                <Sparkles size={14} />
              </div>
            </div>
          </div>

          <div className="space-y-2 relative">
            <div className="flex items-center gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t('editor.ai.give_context')}
              </label>
              <button
                type="button"
                onMouseEnter={() => setShowContextTooltip(true)}
                onMouseLeave={() => setShowContextTooltip(false)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0"
              >
                <HelpCircle size={12} />
              </button>
            </div>

            {showContextTooltip && (
              <div className="absolute top-6 left-0 bg-slate-800 text-white text-[10px] p-2.5 rounded-xl z-50 shadow-lg max-w-[240px] leading-relaxed font-medium">
                {t('editor.ai.context_tooltip')}
              </div>
            )}

            <textarea
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              placeholder={t('editor.ai.context_placeholder')}
              rows={4}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-xs font-bold text-slate-800 transition-all bg-white shadow-xs resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!promptInput.trim()}
            className={`w-full py-3.5 flex items-center justify-center gap-2 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer border-none shadow-sm ${
              promptInput.trim()
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Sparkles size={14} />
            {t('editor.ai.generate')}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('editor.ai.goal')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={prompt}
                readOnly
                className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50/50"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 select-none">
                <span className="text-[10px] font-bold">TG</span>
                <ChevronDown size={12} />
              </div>
            </div>

            <div className="pl-3.5 space-y-1.5 border-l-2 border-slate-100 mt-2.5">
              {tasks.map((task, idx) => (
                <div key={idx} className="group flex items-start justify-between gap-2 text-[11px] text-slate-500 font-semibold leading-relaxed">
                  <div className="flex gap-2 items-start mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1" />
                    <span>{task}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 bg-transparent border-none cursor-pointer p-0 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {isAddingTask ? (
                <div className="flex gap-2 items-center mt-2.5">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder={t('editor.ai.task_placeholder')}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border-none cursor-pointer"
                  >
                    {t('editor.ai.add_task')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTask(true)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-transparent border-none cursor-pointer p-0 mt-2"
                >
                  <Plus size={12} />
                  {t('editor.ai.new_task')}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('editor.ai.context')}
            </label>
            <div className="relative group bg-slate-50/50 border border-slate-200 rounded-2xl p-4 pr-10 text-xs text-slate-700 font-semibold leading-relaxed">
              {context}
              <button
                type="button"
                onClick={handleEditContext}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-indigo-600 bg-transparent border-none cursor-pointer p-0"
              >
                <Pencil size={12} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (editorState) {
                  editorState.setNextStepSourceHandle?.('next');
                  editorState.setIsNextStepDrawerOpen?.(true);
                }
              }}
              className="w-full py-3.5 bg-white hover:bg-emerald-50/10 border border-dashed border-emerald-200 hover:border-emerald-400 text-emerald-700 hover:text-emerald-800 text-xs font-bold rounded-2xl transition-all cursor-pointer text-center select-none shadow-xs"
            >
              {t('editor.ai.choose_next_step')}
            </button>
          </div>
        </div>
      )}

      {generated && !editorState?.isNextStepDrawerOpen && (
        <div className="fixed left-[340px] top-24 z-50 bg-white border border-slate-200 shadow-2xl rounded-[28px] p-5 w-[360px] h-[520px] flex flex-col justify-between overflow-hidden animate-in slide-in-from-left-4 duration-250 select-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200/50">
                AI
              </span>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block leading-none">{t('editor.ai.simulation')}</span>
                <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{t('editor.ai.step_preview')}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRestartPreview}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl border-none cursor-pointer transition-all"
            >
              <RotateCcw size={10} />
              {t('editor.ai.restart_preview')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 custom-scrollbar pr-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 items-end ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[9px] border shrink-0">
                    AI
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-[20px] px-3.5 py-2.5 text-xs leading-relaxed font-semibold ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-150'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-end justify-start">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[9px] border shrink-0">
                  AI
                </span>
                <div className="bg-slate-100 border border-slate-150 rounded-[20px] rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 pt-3 flex gap-2">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder={t('editor.ai.write_message')}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 font-semibold"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
