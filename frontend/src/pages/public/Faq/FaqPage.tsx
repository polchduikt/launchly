import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../../i18n/config';
import { ROUTES } from '../../../routes/paths';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import logo from '../../../assets/images/logo.png';
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
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const isUk = currentLanguage === 'uk';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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
    // General Questions (#1 General first so "What is Launchly" is card #1)
    { id: 'g1', category: 'general', icon: HelpCircle, question: t('faq.g1.q'), answer: t('faq.g1.a') },
    { id: 'g2', category: 'general', icon: BookOpen, question: t('faq.g2.q'), answer: t('faq.g2.a') },
    { id: 'g3', category: 'general', icon: Sparkles, question: t('faq.g3.q'), answer: t('faq.g3.a') },

    // Nodes Guide (All 10 Launchly Node Types)
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

    // Builder & Automations
    { id: 'b1', category: 'builder', icon: Zap, question: t('faq.b1.q'), answer: t('faq.b1.a') },
    { id: 'b2', category: 'builder', icon: Workflow, question: t('faq.b2.q'), answer: t('faq.b2.a') },
    { id: 'b3', category: 'builder', icon: Zap, question: t('faq.b3.q'), answer: t('faq.b3.a') },

    // AI Assistants
    { id: 'a1', category: 'ai', icon: Bot, question: t('faq.a1.q'), answer: t('faq.a1.a') },
    { id: 'a2', category: 'ai', icon: Bot, question: t('faq.a2.q'), answer: t('faq.a2.a') },

    // Billing & Payments
    { id: 'm1', category: 'billing', icon: CreditCard, question: t('faq.m1.q'), answer: t('faq.m1.a') },
    { id: 'm2', category: 'billing', icon: CreditCard, question: t('faq.m2.q'), answer: t('faq.m2.a') },

    // Security
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
      
      {/* Background pattern */}
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
        {/* Header */}
        <header className="bg-[#F2EBDD]/85 backdrop-blur-md border-b-2 border-[#0A0A0A] shadow-[0_4px_0px_#0A0A0A] sticky top-0 w-full z-50 flex justify-between items-center h-20 px-6 md:px-12 lg:px-16">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.LANDING} className="flex items-center">
              <img src={logo} alt="Launchly Logo" className="h-10 sm:h-12 w-auto object-contain cursor-pointer" />
            </Link>

            <div className="relative ml-2">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
                className="flex items-center gap-1 font-['JetBrains_Mono',monospace] text-sm font-bold text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-0.5 transition-all cursor-pointer select-none"
              >
                <span>{currentLanguage === 'uk' ? 'Uk' : 'En'}</span>
                <span className="text-[10px] tracking-tighter">▼</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] py-1 min-w-[75px] z-50 font-['JetBrains_Mono',monospace]">
                  <button
                    onClick={() => { changeLanguage('en'); setIsLangDropdownOpen(false); }}
                    className={`w-full px-3 py-1 text-left text-xs font-bold hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ${currentLanguage === 'en' ? 'bg-[#0A0A0A]/10 font-black' : ''}`}
                  >
                    En
                  </button>
                  <button
                    onClick={() => { changeLanguage('uk'); setIsLangDropdownOpen(false); }}
                    className={`w-full px-3 py-1 text-left text-xs font-bold hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ${currentLanguage === 'uk' ? 'bg-[#0A0A0A]/10 font-black' : ''}`}
                  >
                    Uk
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider">
            <Link to={ROUTES.LANDING} className="hover:bg-[#0A0A0A] hover:text-[#F2EBDD] px-2.5 py-1 transition-colors">
              {isUk ? 'ГОЛОВНА' : 'HOME'}
            </Link>
            <Link to={ROUTES.BLOG} className="hover:bg-[#0A0A0A] hover:text-[#F2EBDD] px-2.5 py-1 transition-colors">
              {isUk ? 'БЛОГ' : 'BLOG'}
            </Link>
            <Link to={ROUTES.TERMS} className="hover:bg-[#0A0A0A] hover:text-[#F2EBDD] px-2.5 py-1 transition-colors">
              {isUk ? 'УМОВИ' : 'TERMS'}
            </Link>
          </nav>

          <Link
            to={ROUTES.REGISTER}
            className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            {isUk ? 'СВІЙ БОТ' : 'GET STARTED'}
          </Link>
        </header>

        {/* Hero Banner */}
        <section className="py-12 md:py-16 px-6 lg:px-16 max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
            <HelpCircle size={14} className="text-amber-400" />
            <span>FAQ &amp; HELP CENTER</span>
          </div>

          <h1 className="font-['Anybody',sans-serif] text-4xl sm:text-6xl font-black uppercase text-[#0A0A0A] tracking-tight leading-none">
            {t('faq.hero_title', 'Часті запитання та Ноди')}
          </h1>

          <p className="text-base sm:text-lg font-bold text-[#0A0A0A]/80 max-w-2xl mx-auto">
            {t('faq.hero_subtitle', 'Інструкція до кожної ноди у Конструкторі, налаштування воронок та відповіді на поширені питання.')}
          </p>

          {/* Search Box */}
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

        {/* Main Content Area */}
        <section className="py-8 px-6 lg:px-16 max-w-5xl mx-auto pb-24">

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase transition-all cursor-pointer ${
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

          {/* Accordions List */}
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

          {/* Bottom Help Card */}
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

      <PublicFooter />
    </div>
  );
};

export default FaqPage;
