import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRequireBots } from '../hooks/useRequireBots';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../../bot/hooks/useBotsQuery';
import { createBotApi, saveFlowSchemaApi } from '../../bot/api/bot';
import { TEMPLATES_DATA } from '../config/templatesData';
import type { FlowTemplate } from '../config/templatesData';
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

const PhonePreview: React.FC<{ template: FlowTemplate }> = ({ template }) => {
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const messages = template.phonePreview.messages || [];
    if (messages.length > 0) {
      setVisibleMessages([messages[0]]);
    } else {
      setVisibleMessages([]);
    }

    let index = 1;
    const interval = setInterval(() => {
      if (index < messages.length) {
        const nextMsg = messages[index];
        if (nextMsg) {
          setVisibleMessages((prev) => [...prev, nextMsg]);
        }
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [template, key]);

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

      <div className="flex-1 overflow-y-auto py-4 space-y-3 relative scrollbar-none">
        <div
          className="absolute inset-0 bg-slate-950 opacity-15 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', 
            backgroundSize: '14px 14px' 
          }} 
        />
             
        {visibleMessages.map((msg, idx) => {
          if (!msg || !msg.text) return null;
          return (
            <div key={idx} className="flex flex-col animate-in slide-in-from-bottom-2 duration-300 relative z-10">
              <div className="max-w-[90%] bg-slate-800 border border-slate-700/50 text-slate-200 text-xs rounded-2xl rounded-tl-sm px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed shadow-sm">
                {msg.text}
              </div>
              <span className="text-[8px] text-slate-500 font-bold mt-1 ml-1.5 uppercase">10:00 AM</span>
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
  const user = useAuthStore((state) => state.user);
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isOpenedFromList, setIsOpenedFromList] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'engage' | 'traffic' | 'dm'>('all');
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
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
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
        
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {displayName}!
          </h1>
          <div className="text-xs font-semibold text-slate-500">
            {totalContacts} {totalContacts === 1 ? 'contact' : 'contacts'}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Start here</h2>
            <button 
              onClick={() => setIsTemplatesModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Explore all Templates</span>
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
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-2xl p-6 flex flex-col justify-between group cursor-pointer min-h-[170px]"
                >
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-850 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                      {tmpl.title}
                    </h3>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Workflow size={11} />
                    <span>{tmpl.type}</span>
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
                        <span>Telegram Template</span>
                      </div>

                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                        {selectedTemplate.title}
                      </h1>

                      <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                        {selectedTemplate.shortDesc}
                      </p>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Business value</h4>
                          <p className="text-xs text-slate-650 leading-relaxed font-medium">
                            {selectedTemplate.businessValue}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">How does it work?</h4>
                          <p className="text-xs text-slate-650 leading-relaxed font-medium">
                            {selectedTemplate.howItWorks}
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
                        <span>Back To List</span>
                      </button>
                      
                      <button
                        onClick={() => handleSetUpTemplate(selectedTemplate)}
                        disabled={isCreating}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isCreating && <Loader2 size={13} className="animate-spin" />}
                        <span>Set Up Template</span>
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
                      <h3 className="text-lg font-black text-slate-800">Templates</h3>
                    </div>
                    <div className="flex items-center gap-4 pr-8">
                      <button
                        onClick={handleStartFromScratch}
                        disabled={isCreating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        <span>Start From Scratch</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden min-h-0">
                    <div className="w-56 border-r border-slate-100 p-6 flex flex-col gap-6 shrink-0 bg-slate-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search Telegram templates..."
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
                            All templates
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">By goal</span>
                          <button
                            onClick={() => setActiveCategory('engage')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeCategory === 'engage' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Engage your audience
                          </button>
                          <button
                            onClick={() => setActiveCategory('traffic')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeCategory === 'traffic' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Drive traffic
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">By trigger</span>
                          <button
                            onClick={() => setActiveCategory('dm')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              activeCategory === 'dm' 
                                ? 'bg-slate-200 text-slate-800' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            DM
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs font-bold">
                          No templates found matching your filter criteria.
                        </div>
                      ) : activeCategory === 'all' ? (
                        <>
                          {recommendedTemplates.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-base font-bold text-slate-700 tracking-tight">Recommended</h4>
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
                                        {tmpl.title}
                                      </h3>
                                      <p className="text-xs text-slate-450 leading-normal line-clamp-2">
                                        {tmpl.shortDesc}
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
                              <h4 className="text-base font-bold text-slate-700 tracking-tight">Discover more Templates</h4>
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
                                        {tmpl.title}
                                      </h3>
                                      <p className="text-xs text-slate-450 leading-normal line-clamp-2">
                                        {tmpl.shortDesc}
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
                                  <h3 className="font-bold text-slate-800 text-[15px] leading-snug group-hover:text-indigo-600 transition-colors">
                                    {tmpl.title}
                                  </h3>
                                  <p className="text-xs text-slate-450 leading-normal line-clamp-2">
                                    {tmpl.shortDesc}
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

