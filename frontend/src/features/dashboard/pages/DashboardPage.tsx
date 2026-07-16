import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRequireBots } from '../hooks/useRequireBots';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { t } from '../../../i18n';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../../bot/hooks/useBotsQuery';
import { createBotApi, saveFlowSchemaApi } from '../../bot/api/bot';
import { TEMPLATES_DATA } from '../config/templatesData';
import type { FlowTemplate } from '../config/templatesData';
import { BLOG_ARTICLES } from '../config/blogData';
import { useBlogArticlesQuery } from '../hooks/useBlogQueries';
import { 
  Sparkles, 
  Calendar, 
  ArrowUpRight, 
  Workflow, 
  X, 
  Search, 
  Plus, 
  ArrowLeft, 
  Loader2, 
  MessageSquare, 
  RotateCcw,
  BookOpen
} from 'lucide-react';

const parseButtons = (text: string) => {
  const regex = /\[\s*([^\]]+?)\s*\]/g;
  const buttons: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    buttons.push(match[1].trim());
  }
  const cleanText = text.replace(/\[\s*([^\]]+?)\s*\]/g, '').trim();
  return { cleanText, buttons };
};

const PhonePreview: React.FC<{ template: FlowTemplate }> = ({ template }) => {
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [isWaitingInput, setIsWaitingInput] = useState(false);
  const [activeButtons, setActiveButtons] = useState<string[]>([]);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const nextIndexRef = useRef(1);

  const messages = template.phonePreview.messages || [];

  const addTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id as any);
  };

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, isWaitingInput]);

  const playStep = (msgIndex: number, currentVisible: any[]) => {
    nextIndexRef.current = msgIndex;
    if (msgIndex >= messages.length) {
      addTimeout(() => {
        setKey((k) => k + 1);
      }, 3500);
      return;
    }

    const msg = messages[msgIndex];
    const { cleanText, buttons } = parseButtons(msg.text);

    const nextVisible = [...currentVisible, { ...msg, text: cleanText }];
    setVisibleMessages(nextVisible);

    if (buttons.length > 0) {
      setIsWaitingInput(true);
      setActiveButtons(buttons);
      setClickedButton(null);

      const btnToClick = buttons[0];
      addTimeout(() => {
        setClickedButton(btnToClick);

        addTimeout(() => {
          const userReply = {
            id: `user_${Date.now()}`,
            text: btnToClick,
            isUser: true,
          };
          const updatedVisible = [...nextVisible, userReply];
          setVisibleMessages(updatedVisible);
          setIsWaitingInput(false);
          setActiveButtons([]);
          setClickedButton(null);

          addTimeout(() => {
            playStep(msgIndex + 1, updatedVisible);
          }, 900);
        }, 350);
      }, 1800);
    } else {
      setIsWaitingInput(false);
      setActiveButtons([]);
      setClickedButton(null);

      addTimeout(() => {
        playStep(msgIndex + 1, nextVisible);
      }, 1500);
    }
  };

  useEffect(() => {
    clearTimeouts();
    setVisibleMessages([]);
    setIsWaitingInput(false);
    setActiveButtons([]);
    setClickedButton(null);
    nextIndexRef.current = 1;

    if (messages.length === 0) return;

    playStep(0, []);

    return () => clearTimeouts();
  }, [template, key]);

  const handleButtonClick = (btnLabel: string) => {
    if (clickedButton) return;
    clearTimeouts();
    setClickedButton(btnLabel);

    const userReply = {
      id: `user_${Date.now()}`,
      text: btnLabel,
      isUser: true,
    };
    const nextVisible = [...visibleMessages, userReply];
    setVisibleMessages(nextVisible);

    addTimeout(() => {
      setIsWaitingInput(false);
      setActiveButtons([]);
      setClickedButton(null);

      addTimeout(() => {
        playStep(nextIndexRef.current + 1, nextVisible);
      }, 900);
    }, 350);
  };

  return (
    <div className="w-[280px] bg-slate-900 border-[8px] border-slate-950 rounded-[38px] shadow-2xl p-4 aspect-[9/18] flex flex-col relative overflow-hidden select-none shrink-0">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
        <div className="w-10 h-1 bg-slate-800 rounded-full" />
      </div>

      <div className="pt-4 pb-3 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full ${template.phonePreview.avatarBg} flex items-center justify-center text-white text-[10px] font-black shadow-inner`}>
            {template.phonePreview.avatarText}
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-100 leading-none">{template.phonePreview.senderName}</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-0.5">Business chat</div>
          </div>
        </div>
        <button 
          onClick={() => setKey(k => k + 1)}
          className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Restart animation"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 relative scrollbar-none">
        <div
          className="absolute inset-0 bg-slate-950 opacity-15 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', 
            backgroundSize: '14px 14px' 
          }} 
        />
             
        {visibleMessages.map((msg, idx) => {
          if (!msg || !msg.text) return null;
          const isUser = msg.isUser;
          const isLastMessage = idx === visibleMessages.length - 1;
          const showButtonsForThisMsg = isLastMessage && isWaitingInput && activeButtons.length > 0;

          return (
            <div key={msg.id || idx} className={`flex flex-col animate-in slide-in-from-bottom-2 duration-300 relative z-10 ${isUser ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] text-xs px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed shadow-sm rounded-2xl ${
                isUser 
                  ? 'bg-indigo-600 border border-indigo-500 text-white rounded-tr-sm' 
                  : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>

              {showButtonsForThisMsg && (
                <div className="flex flex-col gap-1.5 mt-2 w-[85%]">
                  {activeButtons.map((btnLabel) => {
                    const isClicked = clickedButton === btnLabel;
                    return (
                      <button
                        key={btnLabel}
                        onClick={() => handleButtonClick(btnLabel)}
                        disabled={clickedButton !== null}
                        className={`w-full py-2 px-3 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer select-none ${
                          isClicked
                            ? 'bg-indigo-600 border-indigo-500 text-white scale-[0.98]'
                            : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 active:scale-[0.98]'
                        }`}
                      >
                        {btnLabel}
                      </button>
                    );
                  })}
                </div>
              )}

              <span className="text-[8px] text-slate-500 font-bold mt-1.5 px-1 uppercase">10:00 AM</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading: isLoadingRequire, hasBots } = useRequireBots();
  const { data: bots = [], isLoading: isLoadingBots } = useBotsQuery();
  const { data: blogArticles = BLOG_ARTICLES } = useBlogArticlesQuery();
  const user = useAuthStore((state) => state.user);
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isOpenedFromList, setIsOpenedFromList] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'engage' | 'traffic' | 'dm'>('all');
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const getTemplateTitle = (tmpl: FlowTemplate) => {
    return t(`dashboard.template.${tmpl.id}.title`);
  };

  const getTemplateDesc = (tmpl: FlowTemplate) => {
    return t(`dashboard.template.${tmpl.id}.desc`);
  };

  const getTemplateBusinessValue = (tmpl: FlowTemplate) => {
    return t(`dashboard.template.${tmpl.id}.business_value`);
  };

  const getTemplateHowItWorks = (tmpl: FlowTemplate) => {
    return t(`dashboard.template.${tmpl.id}.how_it_works`);
  };

  const handleCloseAll = () => {
    setSelectedTemplate(null);
    setIsTemplatesModalOpen(false);
  };
  const totalContacts = useMemo(() => {
    return bots
      .filter((b) => b.hasTelegramToken)
      .reduce((sum, b) => sum + (b.totalUsers || 0), 0);
  }, [bots]);
  const connectedChannels = useMemo(() => bots.filter((b) => b.hasTelegramToken).length, [bots]);

  const handleSetUpTemplate = async (template: FlowTemplate) => {
    setIsCreating(true);
    try {
      const botName = template.title.split(' in ')[0];
      const newBot = await createBotApi({
        name: botName,
        telegramToken: '',
        description: template.shortDesc,
      });

      await saveFlowSchemaApi(newBot.id, template.nodes, template.edges);
      await queryClient.refetchQueries({ queryKey: ['bots'] });
      const setActiveBotId = useBotStore.getState().setActiveBotId;
      setActiveBotId(newBot.id);
      setSelectedTemplate(null);
      setIsTemplatesModalOpen(false);
      navigate('/builder');
    } catch (err) {
      console.error('Failed to set up template:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartFromScratch = async () => {
    setIsCreating(true);
    try {
      const newBot = await createBotApi({
        name: 'New Automation',
        telegramToken: '',
        description: 'Custom automation flow built from scratch.',
      });

      const defaultNodes = [
        {
          id: 'node_start',
          type: 'START',
          position: { x: 100, y: 150 },
          data: {},
        }
      ];
      await saveFlowSchemaApi(newBot.id, defaultNodes, []);
      await queryClient.refetchQueries({ queryKey: ['bots'] });

      const setActiveBotId = useBotStore.getState().setActiveBotId;
      setActiveBotId(newBot.id);

      setIsTemplatesModalOpen(false);
      navigate('/builder');
    } catch (err) {
      console.error('Failed to start from scratch:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'engage': return 'Engage your audience';
      case 'traffic': return 'Drive traffic';
      case 'dm': return 'DM';
      default: return 'Templates';
    }
  };

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_DATA.filter((tmpl) => {
      const matchesSearch = tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tmpl.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' ||
        (activeCategory === 'engage' && tmpl.goal === 'engage') ||
        (activeCategory === 'traffic' && tmpl.goal === 'traffic') ||
        (activeCategory === 'dm' && tmpl.trigger === 'dm');

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const recommendedTemplates = useMemo(() => {
    return filteredTemplates.filter(t => t.category === 'Recommended');
  }, [filteredTemplates]);

  const discoverTemplates = useMemo(() => {
    return filteredTemplates.filter(t => t.category !== 'Recommended');
  }, [filteredTemplates]);

  if (isLoadingRequire || isLoadingBots) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <span className="text-sm font-semibold text-slate-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!hasBots) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-[1300px] mx-auto space-y-12">
        
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.hello_user', { name: displayName })}
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="text-[11px] font-bold text-slate-400">
              {totalContacts} {t('dashboard.contacts_count')}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{t('dashboard.start_here')}</h2>
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboard.explore_templates')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEMPLATES_DATA.slice(0, 3).map((tmpl) => {
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setIsOpenedFromList(false);
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-3xl p-6 flex flex-col justify-between group cursor-pointer min-h-[190px]"
                >
                  <div className="space-y-3">
                    <h3 className="font-medium text-slate-700 text-sm md:text-base leading-snug group-hover:text-indigo-650 transition-colors">
                      {getTemplateTitle(tmpl)}
                    </h3>
                  </div>
                  <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <Workflow size={11} />
                    <span>{tmpl.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{t('dashboard.blog.latest')}</h2>
            <button 
              onClick={() => navigate('/blog')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t('dashboard.blog.view_all')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogArticles.slice(0, 3).map((article) => {
              return (
                <div
                  key={article.id}
                  onClick={() => navigate(`/blog/${article.id}`)}
                  className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden flex flex-col group cursor-pointer"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-50 relative">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm md:text-base leading-snug group-hover:text-indigo-650 transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {(isTemplatesModalOpen || selectedTemplate !== null) && createPortal(
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseAll();
              }
            }}
            className="fixed inset-0 bg-slate-950/20 z-[9998] flex items-center justify-center p-4 transition-all duration-200"
          >
            <div className="bg-white rounded-3xl max-w-5xl w-full h-[85vh] border border-slate-100 shadow-2xl flex overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              
              <button
                onClick={handleCloseAll}
                className="absolute top-5 right-5 z-[10000] text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              {selectedTemplate ? (
                <div className="flex flex-col md:flex-row w-full h-full min-h-0">
                  <div className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col justify-between space-y-8 min-h-0">
                    <div className="space-y-6">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <BookOpen size={12} className="text-slate-400" />
                        <span>{t('dashboard.templates.type_label')}</span>
                      </div>

                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                        {getTemplateTitle(selectedTemplate)}
                      </h1>

                      <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                        {getTemplateDesc(selectedTemplate)}
                      </p>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('dashboard.templates.biz_value_label')}</h4>
                          <p className="text-xs text-slate-650 leading-relaxed font-medium">
                            {getTemplateBusinessValue(selectedTemplate)}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('dashboard.templates.how_works_label')}</h4>
                          <p className="text-xs text-slate-650 leading-relaxed font-medium">
                            {getTemplateHowItWorks(selectedTemplate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedTemplate(null);
                          setIsTemplatesModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>{t('dashboard.templates.back_btn')}</span>
                      </button>
                      
                      <button
                        onClick={() => handleSetUpTemplate(selectedTemplate)}
                        disabled={isCreating}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCreating && <Loader2 size={13} className="animate-spin" />}
                        <span>{t('dashboard.templates.setup_btn')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-[360px] bg-slate-50 border-l border-slate-100 flex items-center justify-center p-8 shrink-0 relative">
                    <div 
                      className="absolute inset-0 bg-slate-100/50 opacity-60 pointer-events-none" 
                      style={{ 
                        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', 
                        backgroundSize: '16px 16px' 
                      }} 
                    />
                    
                    <PhonePreview template={selectedTemplate} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col w-full h-full min-h-0">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-800">{t('dashboard.templates.modal_title')}</h3>
                    </div>
                    <div className="flex items-center gap-4 pr-8">
                      <button
                        onClick={handleStartFromScratch}
                        disabled={isCreating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        <span>{t('dashboard.templates.start_from_scratch')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden min-h-0">
                    <div className="w-56 border-r border-slate-100 p-6 flex flex-col gap-6 shrink-0 bg-slate-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder={t('dashboard.templates.search_placeholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setActiveCategory('all')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeCategory === 'all' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {t('dashboard.templates.all')}
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">{t('dashboard.templates.by_goal')}</span>
                          <button
                            onClick={() => setActiveCategory('engage')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeCategory === 'engage' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {t('dashboard.templates.engage')}
                          </button>
                          <button
                            onClick={() => setActiveCategory('traffic')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeCategory === 'traffic' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {t('dashboard.templates.traffic')}
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">{t('dashboard.templates.by_trigger')}</span>
                          <button
                            onClick={() => setActiveCategory('dm')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeCategory === 'dm' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {t('dashboard.templates.dm')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs font-bold">
                          {t('dashboard.templates.no_results')}
                        </div>
                      ) : activeCategory === 'all' ? (
                        <>
                          {recommendedTemplates.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-base font-bold text-slate-700 tracking-tight">{t('dashboard.recommended')}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recommendedTemplates.map((tmpl) => (
                                  <div
                                    key={tmpl.id}
                                    onClick={() => {
                                      setSelectedTemplate(tmpl);
                                      setIsOpenedFromList(true);
                                    }}
                                    className="bg-white border border-slate-150 hover:border-slate-250 hover:shadow-sm transition-all rounded-2xl p-5 flex flex-col justify-between group cursor-pointer min-h-[140px]"
                                  >
                                    <div className="space-y-1.5">
                                      <h3 className="font-bold text-slate-800 text-[15px] leading-snug group-hover:text-indigo-650 transition-colors">
                                        {getTemplateTitle(tmpl)}
                                      </h3>
                                      <p className="text-xs text-slate-450 leading-normal line-clamp-2">
                                        {getTemplateDesc(tmpl)}
                                      </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                      <Workflow size={13} />
                                      <span>{tmpl.type}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {discoverTemplates.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-base font-bold text-slate-700 tracking-tight">{t('dashboard.discover_more_templates')}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {discoverTemplates.map((tmpl) => (
                                  <div
                                    key={tmpl.id}
                                    onClick={() => {
                                      setSelectedTemplate(tmpl);
                                      setIsOpenedFromList(true);
                                    }}
                                    className="bg-white border border-slate-150 hover:border-slate-250 hover:shadow-sm transition-all rounded-2xl p-5 flex flex-col justify-between group cursor-pointer min-h-[140px]"
                                  >
                                    <div className="space-y-1.5">
                                      <h3 className="font-bold text-slate-800 text-[15px] leading-snug group-hover:text-indigo-650 transition-colors">
                                        {getTemplateTitle(tmpl)}
                                      </h3>
                                      <p className="text-xs text-slate-450 leading-normal line-clamp-2">
                                        {getTemplateDesc(tmpl)}
                                      </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                      <Workflow size={13} />
                                      <span>{tmpl.type}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <h4 className="text-base font-bold text-slate-700 tracking-tight">{getCategoryTitle()}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((tmpl) => (
                              <div
                                key={tmpl.id}
                                onClick={() => {
                                  setSelectedTemplate(tmpl);
                                  setIsOpenedFromList(true);
                                }}
                                className="bg-white border border-slate-150 hover:border-slate-250 hover:shadow-sm transition-all rounded-2xl p-5 flex flex-col justify-between group cursor-pointer min-h-[140px]"
                              >
                                <div className="space-y-1.5">
                                  <h3 className="font-bold text-slate-800 text-[15px] leading-snug group-hover:text-indigo-650 transition-colors">
                                    {getTemplateTitle(tmpl)}
                                  </h3>
                                  <p className="text-xs text-slate-450 leading-normal line-clamp-2">
                                    {getTemplateDesc(tmpl)}
                                  </p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                  <Workflow size={13} />
                                  <span>{tmpl.type}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;

