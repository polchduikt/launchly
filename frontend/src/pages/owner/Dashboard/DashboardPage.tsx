import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation, getLanguage } from '../../../i18n/config';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { useAllBotUsersQuery } from '../../../hooks/crm/useCrmQueries';
import { createBotApi, saveFlowSchemaApi } from '../../../api/bot';
import { TEMPLATES_DATA } from '../../../const/templatesData';
import type { FlowTemplate } from '../../../const/templatesData';
import { BLOG_ARTICLES } from '../../../const/blogData';
import { useBlogArticlesQuery } from '../../../hooks/dashboard/useBlogQueries';
import { DISPLAY_KEY_HOME_TEMPLATES, DISPLAY_KEY_HOME_BLOG } from '../FlowBuilder/components/DisplayPanel';
import { 
  Workflow, 
  X, 
  Search, 
  Plus, 
  ArrowLeft, 
  Loader2, 
  RotateCcw,
  BookOpen,
  User,
  Calendar,
  Clock
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
  const [visibleMessages, setVisibleMessages] = useState<unknown[]>([]);
  const [isWaitingInput, setIsWaitingInput] = useState(false);
  const [activeButtons, setActiveButtons] = useState<string[]>([]);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<any[]>([]);
  const nextIndexRef = useRef(1);

  const messages = template.phonePreview.messages || [];

  const addTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
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

  const playStep = (msgIndex: number, currentVisible: unknown[]) => {
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
             
        {visibleMessages.map((msg: any, idx) => {
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

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading: isLoadingBots } = useBotsQuery();
  const { data: allContacts = [] } = useAllBotUsersQuery();
  const currentLang = getLanguage() || 'uk';
  const { data: rawBlogArticles = BLOG_ARTICLES } = useBlogArticlesQuery(currentLang);
  const blogArticles = useMemo(
    () => rawBlogArticles.filter((a) => !a.language || a.language.toLowerCase() === currentLang.toLowerCase()),
    [rawBlogArticles, currentLang]
  );
  const user = useAuthStore((state) => state.user);
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [_isOpenedFromList, setIsOpenedFromList] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'engage' | 'traffic' | 'dm'>('all');
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const [showHomeTemplates, setShowHomeTemplates] = useState(
    () => localStorage.getItem(DISPLAY_KEY_HOME_TEMPLATES) !== 'false'
  );
  const [showHomeBlog, setShowHomeBlog] = useState(
    () => localStorage.getItem(DISPLAY_KEY_HOME_BLOG) !== 'false'
  );

  // React to storage changes (e.g. from settings page)
  useEffect(() => {
    const handler = () => {
      setShowHomeTemplates(localStorage.getItem(DISPLAY_KEY_HOME_TEMPLATES) !== 'false');
      setShowHomeBlog(localStorage.getItem(DISPLAY_KEY_HOME_BLOG) !== 'false');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

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
    return allContacts.length;
  }, [allContacts]);

  const handleSetUpTemplate = async (template: FlowTemplate) => {
    setIsCreating(true);
    try {
      const botName = template.title.split(' in ')[0];
      const newBot = await createBotApi({
        name: botName,
        telegramToken: '',
        description: template.shortDesc,
      });

      await saveFlowSchemaApi(newBot.id, template.nodes as any, template.edges as any);
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

  if (isLoadingBots) {
    return <div className="min-h-screen bg-[#F2EBDD]" />;
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-[1300px] mx-auto space-y-12 relative z-10">
        
        <div className="space-y-2 border-b-4 border-[#0A0A0A] pb-6">
          <h1 className="font-['Anybody',sans-serif] text-3xl md:text-5xl font-black text-[#0A0A0A] uppercase tracking-tight">
            {t('dashboard.hello_user', { name: displayName })}
          </h1>
          <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs font-bold text-[#0A0A0A]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0A0A0A]"></span>
            <span>
              {totalContacts} {t('dashboard.contacts_count')}
            </span>
          </div>
        </div>

        {showHomeTemplates && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-l-4 border-[#0A0A0A] pl-4">
            <h2 className="font-['Anybody',sans-serif] text-xl md:text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">
              {t('dashboard.start_here')}
            </h2>
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="font-['JetBrains_Mono',monospace] text-xs font-extrabold text-[#0A0A0A] hover:underline underline-offset-4 uppercase tracking-wider cursor-pointer"
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
                  className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer min-h-[190px]"
                >
                  <div className="space-y-3">
                    <h3 className="font-['Geist',sans-serif] font-bold text-[#0A0A0A] group-hover:text-[#F2EBDD] text-sm md:text-base leading-snug transition-colors">
                      {getTemplateTitle(tmpl)}
                    </h3>
                  </div>
                  <div className="mt-5 pt-5 border-t border-[#0A0A0A]/20 group-hover:border-[#F2EBDD]/30 flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A] group-hover:text-[#F2EBDD]">
                    <Workflow size={12} />
                    <span>{t('dashboard.templates.flow_template', 'Шаблон Автоматизації')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {showHomeBlog && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-l-4 border-[#0A0A0A] pl-4">
            <h2 className="font-['Anybody',sans-serif] text-xl md:text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">
              {t('dashboard.blog.latest')}
            </h2>
            <button 
              onClick={() => navigate('/blog')}
              className="font-['JetBrains_Mono',monospace] text-xs font-extrabold text-[#0A0A0A] hover:underline underline-offset-4 uppercase tracking-wider cursor-pointer"
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
                  className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-y-1 transition-all rounded-[24px] overflow-hidden flex flex-col group cursor-pointer"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-200 border-b-2 border-[#0A0A0A] relative">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3 font-['JetBrains_Mono',monospace]">
                    <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-sm md:text-base leading-snug line-clamp-2 uppercase break-words [overflow-wrap:anywhere]">
                      {article.title}
                    </h3>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-700 pt-2 border-t border-[#0A0A0A]/15">
                      <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                        <User size={12} className="shrink-0 text-[#0A0A0A]" />
                        <span className="truncate">{article.author || 'Launchly Team'}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {article.date && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="shrink-0 text-[#0A0A0A]" />
                            <span>{article.date}</span>
                          </div>
                        )}
                        {article.readTime && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="shrink-0 text-[#0A0A0A]" />
                              <span>{article.readTime}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {(isTemplatesModalOpen || selectedTemplate !== null) && createPortal(
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseAll();
              }
            }}
            className="fixed inset-0 bg-[#0A0A0A]/50 z-[9998] flex items-center justify-center p-4 transition-all duration-200"
          >
            <div className={`bg-[#F2EBDD] rounded-3xl w-full border-2 border-[#0A0A0A] shadow-2xl flex overflow-hidden relative transition-all duration-300 ${
              selectedTemplate ? 'max-w-5xl h-[85vh]' : 'max-w-[1240px] h-[88vh]'
            }`}>
              
              <button
                onClick={handleCloseAll}
                className="absolute top-5 right-5 z-[10000] w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer shadow-md"
                title="Close"
              >
                <X size={16} />
              </button>

              {selectedTemplate ? (
                <div className="flex flex-col md:flex-row w-full h-full min-h-0">
                  <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col justify-between space-y-8 min-h-0">
                    <div className="space-y-6">
                      <div className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-extrabold text-[#0A0A0A] uppercase tracking-widest border-b border-[#0A0A0A]/20 pb-2">
                        <BookOpen size={14} className="text-[#0A0A0A]" />
                        <span>{t('dashboard.templates.flow_template', 'Шаблон Автоматизації')}</span>
                      </div>

                      <h1 className="font-['Anybody',sans-serif] text-2xl md:text-4xl font-black text-[#0A0A0A] uppercase leading-tight">
                        {getTemplateTitle(selectedTemplate)}
                      </h1>

                      <p className="font-['Geist',sans-serif] text-xs font-semibold text-slate-800 leading-relaxed">
                        {getTemplateDesc(selectedTemplate)}
                      </p>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">{t('dashboard.templates.biz_value_label')}</h4>
                          <p className="font-['Geist',sans-serif] text-xs text-slate-800 leading-relaxed font-medium">
                            {getTemplateBusinessValue(selectedTemplate)}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-['JetBrains_Mono',monospace] text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">{t('dashboard.templates.how_works_label')}</h4>
                          <p className="font-['Geist',sans-serif] text-xs text-slate-800 leading-relaxed font-medium">
                            {getTemplateHowItWorks(selectedTemplate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t-2 border-[#0A0A0A] flex items-center justify-between gap-4 shrink-0 font-['JetBrains_Mono',monospace]">
                      <button
                        onClick={() => {
                          setSelectedTemplate(null);
                          setIsTemplatesModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A] hover:underline cursor-pointer uppercase"
                      >
                        <ArrowLeft size={14} />
                        <span>{t('dashboard.templates.back_btn')}</span>
                      </button>
                      
                      <button
                        onClick={() => handleSetUpTemplate(selectedTemplate)}
                        disabled={isCreating}
                        className="px-6 py-3 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-[#F2EBDD] text-xs font-extrabold uppercase border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCreating && <Loader2 size={13} className="animate-spin" />}
                        <span>{t('dashboard.templates.setup_btn')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-[360px] bg-slate-900 border-l-2 border-[#0A0A0A] flex items-center justify-center p-8 shrink-0 relative">
                    <PhonePreview template={selectedTemplate} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col w-full h-full min-h-0">
                  <div className="p-6 border-b-2 border-[#0A0A0A] flex items-center justify-between shrink-0 font-['JetBrains_Mono',monospace]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-[#0A0A0A]">{t('dashboard.templates.modal_title')}</h3>
                    </div>
                    <div className="flex items-center gap-4 pr-16 md:pr-20">
                      <button
                        onClick={handleStartFromScratch}
                        disabled={isCreating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] text-xs font-bold uppercase transition-all disabled:opacity-50 cursor-pointer shadow-[3px_3px_0px_#0A0A0A]"
                      >
                        {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        <span>{t('dashboard.templates.start_from_scratch')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden min-h-0">
                    <div className="w-56 border-r-2 border-[#0A0A0A] p-6 flex flex-col gap-6 shrink-0 bg-[#F2EBDD] font-['JetBrains_Mono',monospace]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A0A0A]" size={14} />
                        <input
                          type="text"
                          placeholder={t('dashboard.templates.search_placeholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0A0A0A] text-xs font-bold text-[#0A0A0A] placeholder-[#0A0A0A]/50 focus:outline-none uppercase"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setActiveCategory('all')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold border-2 transition-all cursor-pointer uppercase ${
                              activeCategory === 'all' 
                                ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' 
                                : 'border-transparent text-[#0A0A0A] hover:bg-white hover:border-[#0A0A0A]'
                            }`}
                          >
                            {t('dashboard.templates.all')}
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3">{t('dashboard.templates.by_goal')}</span>
                          <button
                            onClick={() => setActiveCategory('engage')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold border-2 transition-all cursor-pointer uppercase ${
                              activeCategory === 'engage' 
                                ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' 
                                : 'border-transparent text-[#0A0A0A] hover:bg-white hover:border-[#0A0A0A]'
                            }`}
                          >
                            {t('dashboard.templates.engage')}
                          </button>
                          <button
                            onClick={() => setActiveCategory('traffic')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold border-2 transition-all cursor-pointer uppercase ${
                              activeCategory === 'traffic' 
                                ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' 
                                : 'border-transparent text-[#0A0A0A] hover:bg-white hover:border-[#0A0A0A]'
                            }`}
                          >
                            {t('dashboard.templates.traffic')}
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3">{t('dashboard.templates.by_trigger')}</span>
                          <button
                            onClick={() => setActiveCategory('dm')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold border-2 transition-all cursor-pointer uppercase ${
                              activeCategory === 'dm' 
                                ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' 
                                : 'border-transparent text-[#0A0A0A] hover:bg-white hover:border-[#0A0A0A]'
                            }`}
                          >
                            {t('dashboard.templates.dm')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                      {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-[#0A0A0A] text-xs font-bold font-['JetBrains_Mono',monospace]">
                          {t('dashboard.templates.no_results')}
                        </div>
                      ) : activeCategory === 'all' ? (
                        <>
                          {recommendedTemplates.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase tracking-tight">{t('dashboard.recommended')}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recommendedTemplates.map((tmpl) => (
                                  <div
                                    key={tmpl.id}
                                    onClick={() => {
                                      setSelectedTemplate(tmpl);
                                      setIsOpenedFromList(true);
                                    }}
                                    className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all rounded-2xl p-5 flex flex-col justify-between group cursor-pointer min-h-[140px]"
                                  >
                                    <div className="space-y-1.5">
                                      <h3 className="font-bold text-[#0A0A0A] group-hover:text-[#F2EBDD] text-[15px] leading-snug transition-colors">
                                        {getTemplateTitle(tmpl)}
                                      </h3>
                                      <p className="text-xs text-slate-700 group-hover:text-slate-300 leading-normal line-clamp-2">
                                        {getTemplateDesc(tmpl)}
                                      </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-[#0A0A0A]/20 group-hover:border-[#F2EBDD]/30 flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A] group-hover:text-[#F2EBDD]">
                                      <Workflow size={13} />
                                      <span>{t('dashboard.templates.flow_template', 'Шаблон Автоматизації')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {discoverTemplates.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase tracking-tight">{t('dashboard.discover_more_templates')}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {discoverTemplates.map((tmpl) => (
                                  <div
                                    key={tmpl.id}
                                    onClick={() => {
                                      setSelectedTemplate(tmpl);
                                      setIsOpenedFromList(true);
                                    }}
                                    className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all rounded-2xl p-5 flex flex-col justify-between group cursor-pointer min-h-[140px]"
                                  >
                                    <div className="space-y-1.5">
                                      <h3 className="font-bold text-[#0A0A0A] group-hover:text-[#F2EBDD] text-[15px] leading-snug transition-colors">
                                        {getTemplateTitle(tmpl)}
                                      </h3>
                                      <p className="text-xs text-slate-700 group-hover:text-slate-300 leading-normal line-clamp-2">
                                        {getTemplateDesc(tmpl)}
                                      </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-[#0A0A0A]/20 group-hover:border-[#F2EBDD]/30 flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A] group-hover:text-[#F2EBDD]">
                                      <Workflow size={13} />
                                      <span>{t('dashboard.templates.flow_template', 'Шаблон Автоматизації')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase tracking-tight">{getCategoryTitle()}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((tmpl) => (
                              <div
                                key={tmpl.id}
                                onClick={() => {
                                  setSelectedTemplate(tmpl);
                                  setIsOpenedFromList(true);
                                }}
                                className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all rounded-2xl p-5 flex flex-col justify-between group cursor-pointer min-h-[140px]"
                              >
                                <div className="space-y-1.5">
                                  <h3 className="font-bold text-[#0A0A0A] group-hover:text-[#F2EBDD] text-[15px] leading-snug transition-colors">
                                    {getTemplateTitle(tmpl)}
                                  </h3>
                                  <p className="text-xs text-slate-700 group-hover:text-slate-300 leading-normal line-clamp-2">
                                    {getTemplateDesc(tmpl)}
                                  </p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-[#0A0A0A]/20 group-hover:border-[#F2EBDD]/30 flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A] group-hover:text-[#F2EBDD]">
                                  <Workflow size={13} />
                                  <span>{t('dashboard.templates.flow_template', 'Шаблон Автоматизації')}</span>
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
