import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../../i18n/config';
import { useSEO } from '../../../hooks/useSEO';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import { PublicHeader } from '../../../components/layout/PublicHeader';
import { FooterCTA } from '../../../components/layout/FooterCTA';
import {
  Search,
  ChevronDown,
  HelpCircle,
  Zap,
  Bot,
  CreditCard,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  Workflow,
  Sparkles,
  Layers,
  Split,
  Clock,
  Globe,
  PlayCircle,
  FileText,
  StopCircle
} from 'lucide-react';

export const FaqPage: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useSEO({
    title: t('seo.faq.title', 'FAQ — Launchly Help Center & Node Documentation'),
    description: t('seo.faq.description', 'Answers to frequently asked questions about Launchly: automation nodes, flow builder, AI assistants, billing, and security.'),
    keywords: t('seo.faq.keywords', 'launchly faq, help center, telegram bot help, automation nodes guide'),
    canonicalPath: '/faq',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: t('faq.g1.q', 'What is Launchly?'), acceptedAnswer: { '@type': 'Answer', text: t('faq.g1.a', 'Launchly is a no-code platform for building Telegram bots and automations.') } },
        { '@type': 'Question', name: t('faq.g2.q', 'How do I get started?'), acceptedAnswer: { '@type': 'Answer', text: t('faq.g2.a', 'Sign up for free, connect your Telegram bot token, and start building your first flow.') } },
        { '@type': 'Question', name: t('faq.b1.q', 'What is the Flow Builder?'), acceptedAnswer: { '@type': 'Answer', text: t('faq.b1.a', 'The Flow Builder is a drag-and-drop visual editor for creating automated chat scenarios.') } },
        { '@type': 'Question', name: t('faq.a1.q', 'What AI models are supported?'), acceptedAnswer: { '@type': 'Answer', text: t('faq.a1.a', 'Launchly supports OpenAI, Gemini, DeepSeek, and Claude AI models.') } },
        { '@type': 'Question', name: t('faq.m1.q', 'What payment methods are accepted?'), acceptedAnswer: { '@type': 'Answer', text: t('faq.m1.a', 'We accept Stripe and PayPal. All major credit cards are supported.') } },
      ],
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'all', label: t('faq.cat.all', 'Усі запитання'), icon: HelpCircle },
    { id: 'nodes', label: t('faq.cat.nodes', 'Інструкція до Нод'), icon: Workflow },
    { id: 'general', label: t('faq.cat.general', 'Загальні'), icon: BookOpen },
    { id: 'builder', label: t('faq.cat.builder', 'Автоматизації'), icon: Zap },
    { id: 'ai', label: t('faq.cat.ai', 'ШІ Асистенти'), icon: Bot },
    { id: 'billing', label: t('faq.cat.billing', 'Оплата та Тарифи'), icon: CreditCard },
    { id: 'security', label: t('faq.cat.security', 'Безпека'), icon: ShieldCheck },
  ];

  const faqItems = [
    { id: 'g1', category: 'general', icon: HelpCircle, question: t('faq.g1.q'), answer: t('faq.g1.a') },
    { id: 'g2', category: 'general', icon: BookOpen, question: t('faq.g2.q'), answer: t('faq.g2.a') },
    { id: 'g3', category: 'general', icon: Sparkles, question: t('faq.g3.q'), answer: t('faq.g3.a') },

    { id: 'n1', category: 'nodes', icon: MessageSquare, question: t('faq.n1.q'), answer: t('faq.n1.a') },
    { id: 'n2', category: 'nodes', icon: Split, question: t('faq.n2.q'), answer: t('faq.n2.a') },
    { id: 'n3', category: 'nodes', icon: Layers, question: t('faq.n3.q'), answer: t('faq.n3.a') },
    { id: 'n4', category: 'nodes', icon: Sparkles, question: t('faq.n4.q'), answer: t('faq.n4.a') },
    { id: 'n5', category: 'nodes', icon: Globe, question: t('faq.n5.q'), answer: t('faq.n5.a') },
    { id: 'n6', category: 'nodes', icon: Clock, question: t('faq.n6.q'), answer: t('faq.n6.a') },
    { id: 'n7', category: 'nodes', icon: Split, question: t('faq.n7.q'), answer: t('faq.n7.a') },
    { id: 'n8', category: 'nodes', icon: PlayCircle, question: t('faq.n8.q'), answer: t('faq.n8.a') },
    { id: 'n9', category: 'nodes', icon: FileText, question: t('faq.n9.q'), answer: t('faq.n9.a') },
    { id: 'n10', category: 'nodes', icon: StopCircle, question: t('faq.n10.q'), answer: t('faq.n10.a') },

    { id: 'b1', category: 'builder', icon: Zap, question: t('faq.b1.q'), answer: t('faq.b1.a') },
    { id: 'b2', category: 'builder', icon: Workflow, question: t('faq.b2.q'), answer: t('faq.b2.a') },
    { id: 'b3', category: 'builder', icon: Zap, question: t('faq.b3.q'), answer: t('faq.b3.a') },

    { id: 'a1', category: 'ai', icon: Bot, question: t('faq.a1.q'), answer: t('faq.a1.a') },
    { id: 'a2', category: 'ai', icon: Bot, question: t('faq.a2.q'), answer: t('faq.a2.a') },

    { id: 'm1', category: 'billing', icon: CreditCard, question: t('faq.m1.q'), answer: t('faq.m1.a') },
    { id: 'm2', category: 'billing', icon: CreditCard, question: t('faq.m2.q'), answer: t('faq.m2.a') },

    { id: 's1', category: 'security', icon: ShieldCheck, question: t('faq.s1.q'), answer: t('faq.s1.a') }
  ];

  const filteredFaqs = faqItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F2EBDD] text-[#0A0A0A] font-['Geist',sans-serif] antialiased flex flex-col justify-between relative z-0 selection:bg-[#0A0A0A] selection:text-[#F2EBDD]">
      <div
        className="fixed inset-0 z-[-1] pointer-events-none opacity-5"
        style={{
          backgroundColor: '#F2EBDD',
          backgroundImage: `
            linear-gradient(#0A0A0A 1px, transparent 1px),
            linear-gradient(90deg, #0A0A0A 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '-1px -1px'
        }}
      />

      <div>
        <PublicHeader />
        <section className="py-12 md:py-16 px-6 lg:px-16 max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
            <HelpCircle size={14} className="text-amber-400" />
            <span>FAQ &amp; HELP CENTER</span>
          </div>

          <h1 className="font-['Anybody',sans-serif] text-4xl sm:text-6xl font-black uppercase text-[#0A0A0A] tracking-tight leading-none">
            {t('faq.hero_title', 'Часті запитання')}
          </h1>

          <p className="text-base sm:text-lg font-bold text-[#0A0A0A]/80 max-w-2xl mx-auto">
            {t('faq.hero_subtitle', 'Інструкція до кожної ноди у Конструкторі, налаштування воронок та відповіді на поширені питання.')}
          </p>

          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search size={20} className="absolute left-4 text-[#0A0A0A]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('faq.search_placeholder', 'Шукати запитання чи назву ноди (напр. Message, Condition, AI)...')}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] font-['JetBrains_Mono',monospace] text-sm font-bold text-[#0A0A0A] outline-none focus:ring-2 focus:ring-[#0A0A0A]"
              />
            </div>
          </div>
        </section>

        <section className="py-8 px-6 lg:px-16 max-w-5xl mx-auto pb-24">

          <div className="flex overflow-x-auto sm:flex-wrap items-center justify-start sm:justify-center gap-2 mb-10 pb-2 sm:pb-0 scrollbar-none max-w-full">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[3px_3px_0px_#0A0A0A]'
                      : 'bg-white text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:bg-[#F2EBDD]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 text-center space-y-3 font-['JetBrains_Mono',monospace]">
              <HelpCircle size={36} className="mx-auto text-slate-400" />
              <p className="text-base font-bold text-[#0A0A0A]">
                {t('faq.no_results', 'Запитань або нод за вашим запитом не знайдено')}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="text-xs font-black underline uppercase cursor-pointer text-[#0A0A0A]"
              >
                {t('faq.reset_filters', 'Скинути фільтри')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map(item => {
                const isOpen = !!openItems[item.id];
                const ItemIcon = item.icon || HelpCircle;

                return (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] transition-all overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left font-['Anybody',sans-serif] text-base sm:text-lg font-black text-[#0A0A0A] cursor-pointer hover:bg-amber-50/50 transition-colors select-none"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center shrink-0 border border-black/20">
                          <ItemIcon size={16} />
                        </span>
                        <span className="truncate">{item.question}</span>
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-[#0A0A0A] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 pt-3 text-sm font-medium text-[#0A0A0A]/90 border-t border-[#0A0A0A]/10 whitespace-pre-line leading-relaxed font-['JetBrains_Mono',monospace] bg-[#F2EBDD]/40">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 font-['JetBrains_Mono',monospace]">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black uppercase text-white">
                {t('faq.need_help_title', 'Потрібна допомога з нодами?')}
              </h3>
              <p className="text-xs text-slate-300 font-bold">
                {t('faq.need_help_sub', 'Наша служба підтримки допоможе побудувати будь-який складний сценарій.')}
              </p>
            </div>
            <a
              href="mailto:support@launchly.app"
              className="bg-[#F2EBDD] text-[#0A0A0A] px-6 py-3 border-2 border-white text-xs font-black uppercase tracking-wider hover:bg-white transition-all shrink-0 flex items-center gap-2"
            >
              <MessageSquare size={16} />
              <span>{t('faq.contact_support', 'Написати в підтримку')}</span>
            </a>
          </div>

        </section>
      </div>

      <FooterCTA />
      <PublicFooter />
    </div>
  );
};

export default FaqPage;
