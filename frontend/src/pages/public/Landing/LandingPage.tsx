import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import { LAUNCHLY_PLANS } from '../../../const/plans';
import logo from '../../../assets/images/logo.png';
import { useTranslation } from '../../../i18n/config';
import { HeroInteractiveDemo } from './components/HeroInteractiveDemo';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import {
  Workflow,
  Bot,
  Users,
  CreditCard,
  BookOpen,
  ArrowRight,
  Zap,
  Check,
  ShoppingBag,
  GraduationCap,
  Calendar,
  Target,
  Star,
  Shield,
  Server,
  Lock,
  ChevronDown,
  TrendingUp,
  Sparkles,
  MessageSquare,
  GitBranch,
  Plug,
  BrainCircuit
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [useCaseTab, setUseCaseTab] = useState<'ecommerce' | 'courses' | 'services' | 'agencies'>('ecommerce');
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [isDarkHeader, setIsDarkHeader] = useState<boolean>(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const headerCheckY = 40;
      const darkElements = document.querySelectorAll('[data-header-theme="dark"]');
      let overDark = false;

      darkElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= headerCheckY && rect.bottom >= headerCheckY) {
          overDark = true;
        }
      });

      setIsDarkHeader(overDark);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useScrollReveal(billingCycle);

  const handleCta = () => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME);
    } else {
      navigate(ROUTES.REGISTER);
    }
  };

  const toolsList = [
    'TELEGRAM',
    'STRIPE',
    'PAYPAL',
    'OPENAI',
    'GEMINI',
    'DEEPSEEK',
    'CLAUDE',
    'HUBSPOT',
    'MAILCHIMP',
    'GOOGLE SHEETS',
    'HOTMART'
  ];

  return (
    <div className="min-h-screen bg-[#F2EBDD] text-[#0A0A0A] font-['Geist',sans-serif] antialiased flex flex-col relative z-0 selection:bg-[#0A0A0A] selection:text-[#F2EBDD]">
      
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

      <header
        className={`sticky top-0 w-full z-50 flex justify-between items-center h-20 px-6 md:px-12 lg:px-16 backdrop-blur-md transition-all duration-300 ${
          isDarkHeader
            ? 'bg-[#0A0A0A]/90 border-b-2 border-[#F2EBDD] shadow-[0_4px_0px_#F2EBDD] text-[#F2EBDD]'
            : 'bg-[#F2EBDD]/85 border-b-2 border-[#0A0A0A] shadow-[0_4px_0px_#0A0A0A] text-[#0A0A0A]'
        }`}
      >
        
        <div className="flex items-center gap-4">
          <Link to={ROUTES.LANDING} className="flex items-center">
            <img
              src={logo}
              alt="Launchly Logo"
              className={`h-10 sm:h-12 w-auto object-contain cursor-pointer transition-all duration-300 ${
                isDarkHeader ? 'brightness-0 invert' : ''
              }`}
            />
          </Link>

          <div className="relative ml-2">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
              className={`flex items-center gap-1 font-['JetBrains_Mono',monospace] text-sm font-bold border-b-2 pb-0.5 transition-all cursor-pointer select-none ${
                isDarkHeader ? 'text-[#F2EBDD] border-[#F2EBDD]' : 'text-[#0A0A0A] border-[#0A0A0A]'
              }`}
            >
              <span>{currentLanguage === 'uk' ? 'Uk' : 'En'}</span>
              <span className="text-[10px] tracking-tighter">▼</span>
            </button>

            {isLangDropdownOpen && (
              <div
                className={`absolute top-full left-0 mt-2 border-2 py-1 min-w-[75px] z-50 ${
                  isDarkHeader
                    ? 'bg-[#0A0A0A] border-[#F2EBDD] shadow-[4px_4px_0px_#F2EBDD]'
                    : 'bg-[#F2EBDD] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]'
                }`}
              >
                <button
                  onClick={() => {
                    changeLanguage('en');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold transition-colors cursor-pointer ${
                    isDarkHeader
                      ? 'hover:bg-[#F2EBDD] hover:text-[#0A0A0A] ' + (currentLanguage === 'en' ? 'bg-[#F2EBDD]/20 font-black' : 'text-[#F2EBDD]')
                      : 'hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ' + (currentLanguage === 'en' ? 'bg-[#0A0A0A]/10 font-black' : 'text-[#0A0A0A]')
                  }`}
                >
                  En
                </button>
                <button
                  onClick={() => {
                    changeLanguage('uk');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold transition-colors cursor-pointer ${
                    isDarkHeader
                      ? 'hover:bg-[#F2EBDD] hover:text-[#0A0A0A] ' + (currentLanguage === 'uk' ? 'bg-[#F2EBDD]/20 font-black' : 'text-[#F2EBDD]')
                      : 'hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ' + (currentLanguage === 'uk' ? 'bg-[#0A0A0A]/10 font-black' : 'text-[#0A0A0A]')
                  }`}
                >
                  Uk
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-3 xl:gap-4 absolute left-1/2 -translate-x-1/2">
          {[
            { href: '#features', key: 'landing.nav.features', fallback: 'FEATURES' },
            { href: '#ai-automation', key: 'landing.nav.ai', fallback: 'AI' },
            { href: '#how-it-works', key: 'landing.nav.how_it_works', fallback: 'HOW IT WORKS' },
            { href: '#use-cases', key: 'landing.nav.use_cases', fallback: 'SOLUTIONS' },
            { href: '#comparison', key: 'landing.nav.comparison', fallback: 'WHY US' },
            { href: '#testimonials', key: 'landing.nav.testimonials', fallback: 'REVIEWS' },
            { href: '#trust', key: 'landing.nav.trust', fallback: 'SECURITY' },
            { href: '#pricing', key: 'landing.nav.pricing', fallback: 'PRICING' },
            { href: '#faq', key: 'landing.nav.faq', fallback: 'FAQ' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider transition-colors duration-200 px-2 py-1 ${
                isDarkHeader
                  ? 'text-[#F2EBDD] hover:bg-[#F2EBDD] hover:text-[#0A0A0A]'
                  : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
              }`}
            >
              {t(item.key, item.fallback)}
            </a>
          ))}
          <Link
            to={ROUTES.BLOG}
            className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider transition-colors duration-200 px-2 py-1 ${
              isDarkHeader
                ? 'text-[#F2EBDD] hover:bg-[#F2EBDD] hover:text-[#0A0A0A]'
                : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
            }`}
          >
            {t('landing.nav.blog', 'BLOG')}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 transition-all cursor-pointer ${
                isDarkHeader
                  ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD] shadow-[4px_4px_0px_#F2EBDD] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                  : 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
              }`}
            >
              {t('landing.nav.dashboard', 'DASHBOARD')}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:underline underline-offset-4 cursor-pointer ${
                  isDarkHeader ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'
                }`}
              >
                {t('landing.nav.login', 'LOGIN')}
              </button>
              <button
                onClick={() => navigate(ROUTES.REGISTER)}
                className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 transition-all cursor-pointer ${
                  isDarkHeader
                    ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD] shadow-[4px_4px_0px_#F2EBDD] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                    : 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                }`}
              >
                {t('landing.nav.signup', 'SIGN UP')}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-grow pt-10 sm:pt-14">
        <section className="py-16 md:py-24 px-6 lg:px-12 max-w-7xl mx-auto relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left z-10 space-y-6 reveal-slide-left">
            <h1 className="font-['Anybody',sans-serif] text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#0A0A0A] uppercase leading-[0.95] tracking-tight border-l-8 border-[#0A0A0A] pl-4 sm:pl-6 text-left">
              {t('landing.hero.title_1', 'Automate')}<br />
              {t('landing.hero.title_2', 'Everything.')}<br />
              {t('landing.hero.title_3', 'Code Nothing.')}
            </h1>
            <p className="text-base sm:text-lg text-[#0A0A0A] font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t('landing.hero.subtitle', 'The All-in-One No-Code platform for chatbots, sales automation, and smart messaging in Telegram.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={handleCta}
                className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {isAuthenticated 
                    ? t('landing.hero.cta_dashboard', 'Go to Dashboard') 
                    : t('landing.hero.cta_start', 'Start Building Free')}
                </span>
                <ArrowRight size={16} />
              </button>
              <a
                href="#features"
                className="bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen size={16} />
                <span>{t('landing.hero.cta_features', 'Explore Features')}</span>
              </a>
            </div>
          </div>          <div className="flex-1 w-full relative reveal-brutal-pop reveal-delay-150">
            <HeroInteractiveDemo />
          </div>
        </section>

        <section className="py-6 bg-[#0A0A0A] border-y-4 border-[#0A0A0A] overflow-hidden select-none reveal-blur-in" data-header-theme="dark">
          <div className="text-center mb-3">
            <p className="font-['JetBrains_Mono',monospace] text-[11px] text-[#F2EBDD] uppercase tracking-widest border-b border-[#F2EBDD]/30 pb-1 inline-block">
              {t('landing.ticker.integrations', 'INTEGRATES WITH YOUR FAVORITE TOOLS')}
            </p>
          </div>
          
          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee flex items-center text-[#F2EBDD]">
              {[...toolsList, ...toolsList, ...toolsList, ...toolsList].map((tool, idx) => (
                <span 
                  key={`${tool}-${idx}`} 
                  className="font-['Anybody',sans-serif] text-2xl md:text-3xl font-black uppercase tracking-tighter hover:text-white transition-colors cursor-pointer whitespace-nowrap px-8"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-[#F2EBDD] border-b-4 border-[#0A0A0A] px-6 lg:px-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <p className="font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest text-center text-[#0A0A0A]/50 mb-8">
              {t('landing.stats.label', 'Launchly в цифрах')}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x-4 lg:divide-[#0A0A0A]">
              {[
                { value: t('landing.stats.automations', '1 000+'), label: t('landing.stats.automations_label', 'Запущених автоматизацій'), icon: <Zap size={20} className="text-amber-500" /> },
                { value: t('landing.stats.satisfaction', '95%'), label: t('landing.stats.satisfaction_label', 'Задоволених клієнтів'), icon: <Star size={20} className="text-amber-500" /> },
                { value: t('landing.stats.setup_time', '1 хв'), label: t('landing.stats.setup_time_label', 'Середній час запуску'), icon: <TrendingUp size={20} className="text-amber-500" /> },
                { value: t('landing.stats.payments', '$100k+'), label: t('landing.stats.payments_label', 'Оброблено платежів'), icon: <CreditCard size={20} className="text-amber-500" /> },
              ].map((stat, i) => (
                <div key={i} className="text-center px-4 lg:px-8 reveal-blur-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <div className="font-['Anybody',sans-serif] text-4xl sm:text-5xl font-black text-[#0A0A0A] leading-none mb-1">
                    {stat.value}
                  </div>
                  <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#0A0A0A]/60 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 px-6 lg:px-12 max-w-7xl mx-auto" id="features">
          <div className="text-left mb-12 border-b-4 border-[#0A0A0A] pb-4 reveal-blur-in">
            <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black text-[#0A0A0A] mb-3 uppercase leading-none">
              {t('landing.features.section_title_1', 'Powerful')}<br />
              {t('landing.features.section_title_2', 'features,')}<br />
              {t('landing.features.section_title_3', 'zero code')}
            </h2>
            <p className="text-base sm:text-lg text-[#0A0A0A] font-bold">
              {t('landing.features.section_subtitle', 'Everything you need to build intelligent, automated workflows.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer reveal-slide-left reveal-delay-50">
              <div className="w-16 h-16 border-2 border-[#0A0A0A] group-hover:border-[#F2EBDD] flex items-center justify-center mb-6 bg-white group-hover:bg-[#0A0A0A]">
                <Workflow size={32} className="text-[#0A0A0A] group-hover:text-[#F2EBDD] transition-colors" />
              </div>
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] group-hover:text-[#F2EBDD] mb-3 uppercase leading-tight">
                {t('landing.features.card_1_title', 'Visual Flow Builder')}
              </h3>
              <p className="text-sm font-medium leading-relaxed">
                {t('landing.features.card_1_desc', 'Design complex conversational flows with our intuitive drag-and-drop canvas. No coding required.')}
              </p>
            </div>

            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer reveal-slide-right reveal-delay-100">
              <div className="w-16 h-16 border-2 border-[#0A0A0A] group-hover:border-[#F2EBDD] flex items-center justify-center mb-6 bg-white group-hover:bg-[#0A0A0A]">
                <Bot size={32} className="text-[#0A0A0A] group-hover:text-[#F2EBDD] transition-colors" />
              </div>
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] group-hover:text-[#F2EBDD] mb-3 uppercase leading-tight">
                {t('landing.features.card_2_title', 'AI Assistants')}
              </h3>
              <p className="text-sm font-medium leading-relaxed">
                {t('landing.features.card_2_desc', 'Seamlessly integrate with ChatGPT, Claude, and Gemini to provide intelligent, context-aware responses to your users.')}
              </p>
            </div>

            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer reveal-slide-left reveal-delay-150">
              <div className="w-16 h-16 border-2 border-[#0A0A0A] group-hover:border-[#F2EBDD] flex items-center justify-center mb-6 bg-white group-hover:bg-[#0A0A0A]">
                <Users size={32} className="text-[#0A0A0A] group-hover:text-[#F2EBDD] transition-colors" />
              </div>
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] group-hover:text-[#F2EBDD] mb-3 uppercase leading-tight">
                {t('landing.features.card_3_title', 'CRM & Audience')}
              </h3>
              <p className="text-sm font-medium leading-relaxed">
                {t('landing.features.card_3_desc', 'Manage your users effectively with tags, custom fields, and detailed analytics built right into the platform.')}
              </p>
            </div>

            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer reveal-slide-right reveal-delay-200">
              <div className="w-16 h-16 border-2 border-[#0A0A0A] group-hover:border-[#F2EBDD] flex items-center justify-center mb-6 bg-white group-hover:bg-[#0A0A0A]">
                <CreditCard size={32} className="text-[#0A0A0A] group-hover:text-[#F2EBDD] transition-colors" />
              </div>
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] group-hover:text-[#F2EBDD] mb-3 uppercase leading-tight">
                {t('landing.features.card_4_title', 'Chat Payments')}
              </h3>
              <p className="text-sm font-medium leading-relaxed">
                {t('landing.features.card_4_desc', 'Accept payments directly within the chat interface using robust integrations with Stripe and PayPal.')}
              </p>
            </div>
          </div>
        </section>

        <section id="ai-automation" className="py-20 md:py-28 bg-[#F2EBDD] border-y-4 border-[#0A0A0A] px-6 lg:px-12 relative z-10 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-center">
            <div className="space-y-8 reveal-slide-left">
              <div className="border-l-8 border-[#0A0A0A] pl-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg mb-3 border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
                  <Sparkles size={14} className="text-amber-300 fill-amber-300" />
                  <span>{t('landing.ai.badge', 'AI AUTOMATION LAYER')}</span>
                </div>
                <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black text-[#0A0A0A] uppercase leading-none mb-4">
                  {t('landing.ai.title_1', 'AI THAT')}<br />
                  {t('landing.ai.title_2', 'BUILDS AND')}<br />
                  {t('landing.ai.title_3', 'REPLIES')}
                </h2>
                <p className="text-base sm:text-lg text-[#0A0A0A] font-bold max-w-2xl leading-relaxed">
                  {t('landing.ai.subtitle', 'Use AI as a live chat assistant, generate automation nodes from a prompt, or connect your own AI provider to answer customers in your brand voice.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <MessageSquare size={22} />,
                    title: t('landing.ai.card_chat_title', 'AI in chat'),
                    desc: t('landing.ai.card_chat_desc', 'Replies to customers with context from your business.')
                  },
                  {
                    icon: <GitBranch size={22} />,
                    title: t('landing.ai.card_nodes_title', 'Node generator'),
                    desc: t('landing.ai.card_nodes_desc', 'Turns a plain request into a ready automation flow.')
                  },
                  {
                    icon: <Plug size={22} />,
                    title: t('landing.ai.card_custom_title', 'Your own AI'),
                    desc: t('landing.ai.card_custom_desc', 'Connect OpenAI-compatible providers and keep control.')
                  }
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="bg-white border-2 border-[#0A0A0A] shadow-[5px_5px_0px_#0A0A0A] p-5 hover:-translate-y-1 transition-all reveal-brutal-pop"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="w-11 h-11 bg-amber-300 border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] flex items-center justify-center mb-4 text-[#0A0A0A]">
                      {item.icon}
                    </div>
                    <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase leading-tight mb-2 text-[#0A0A0A]">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-[#0A0A0A]/70 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative reveal-slide-right reveal-delay-150">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-emerald-300 border-4 border-[#0A0A0A] rotate-6 hidden sm:block animate-ai-float-slow" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-amber-300 border-4 border-[#0A0A0A] -rotate-12 hidden sm:block animate-ai-float" />

              <div className="relative bg-[#0A0A0A] text-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[10px_10px_0px_#0A0A0A] p-4 sm:p-6 overflow-hidden">
                <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(#F2EBDD 1px, transparent 1px), linear-gradient(90deg, #F2EBDD 1px, transparent 1px)',
                  backgroundSize: '22px 22px'
                }} />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_0.9fr] gap-5 items-stretch">
                  <div className="bg-[#F2EBDD] text-[#0A0A0A] border-2 border-[#F2EBDD] p-4 sm:p-5 shadow-[6px_6px_0px_rgba(242,235,221,0.25)]">
                    <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-emerald-400 border border-[#0A0A0A] animate-pulse" />
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-black uppercase">
                          {t('landing.ai.chat_window', 'Live AI chat')}
                        </span>
                      </div>
                      <BrainCircuit size={18} className="text-indigo-600" />
                    </div>

                    <div className="space-y-3 min-h-[260px] ai-chat-sequence">
                      <div className="ai-chat-message max-w-[82%] bg-white border-2 border-[#0A0A0A] p-3 shadow-[3px_3px_0px_#0A0A0A]">
                        <p className="text-xs font-bold leading-relaxed">
                          {t('landing.ai.user_message', 'Can you help me pick the right plan?')}
                        </p>
                      </div>
                      <div className="ai-chat-message ml-auto max-w-[88%] bg-indigo-600 text-white border-2 border-[#0A0A0A] p-3 shadow-[3px_3px_0px_#0A0A0A]">
                        <p className="text-xs font-bold leading-relaxed">
                          {t('landing.ai.ai_message', 'Yes. Tell me how many contacts and bots you need, and I will suggest the best option.')}
                        </p>
                      </div>
                      <div className="ai-chat-message max-w-[78%] bg-white border-2 border-[#0A0A0A] p-3 shadow-[3px_3px_0px_#0A0A0A]">
                        <p className="text-xs font-bold leading-relaxed">
                          {t('landing.ai.user_message_2', 'We have 4 bots and need support automation.')}
                        </p>
                      </div>
                      <div className="ai-chat-message ml-auto max-w-[88%] bg-emerald-300 text-[#0A0A0A] border-2 border-[#0A0A0A] p-3 shadow-[3px_3px_0px_#0A0A0A]">
                        <p className="text-xs font-black leading-relaxed">
                          {t('landing.ai.ai_message_2', 'Pro is the best fit. I can also start a follow-up flow for undecided leads.')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white text-[#0A0A0A] border-2 border-[#F2EBDD] p-4 shadow-[5px_5px_0px_rgba(242,235,221,0.25)]">
                      <div className="font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-3">
                        {t('landing.ai.generator_label', 'Prompt to flow')}
                      </div>
                      <p className="font-['Anybody',sans-serif] text-xl font-black uppercase leading-tight mb-3">
                        {t('landing.ai.generator_title', 'Create a sales automation')}
                      </p>
                      <div className="space-y-2">
                        {[
                          t('landing.ai.flow_node_1', 'AI question'),
                          t('landing.ai.flow_node_2', 'Condition: interested'),
                          t('landing.ai.flow_node_3', 'Send offer'),
                          t('landing.ai.flow_node_4', 'Notify manager')
                        ].map((node, index) => (
                          <div key={node} className="flex items-center gap-2">
                            <span className={`w-7 h-7 border-2 border-[#0A0A0A] flex items-center justify-center font-['JetBrains_Mono',monospace] text-[10px] font-black ${index === 0 ? 'bg-indigo-500 text-white' : index === 2 ? 'bg-amber-300' : 'bg-emerald-300'}`}>
                              {index + 1}
                            </span>
                            <span className="text-xs font-black uppercase leading-tight">{node}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#F2EBDD] text-[#0A0A0A] border-2 border-[#F2EBDD] p-4 shadow-[5px_5px_0px_rgba(242,235,221,0.25)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest text-[#0A0A0A]/60">
                            {t('landing.ai.provider_label', 'AI provider')}
                          </p>
                          <p className="font-['Anybody',sans-serif] text-lg font-black uppercase leading-tight">
                            {t('landing.ai.provider_title', 'OpenAI-compatible')}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] flex items-center justify-center animate-ai-orbit">
                          <Plug size={22} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 md:py-28 bg-[#0A0A0A] text-[#F2EBDD] px-6 lg:px-12 border-y-4 border-[#0A0A0A] relative z-10" data-header-theme="dark">
          <div className="max-w-7xl mx-auto relative z-20 space-y-12">
            <div className="text-left border-l-8 border-[#F2EBDD] pl-6 reveal-blur-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg mb-3 border border-white shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
                <Zap size={14} className="fill-[#0A0A0A]" />
                <span>3 SIMPLE STEPS</span>
              </div>
              <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 uppercase leading-none">
                {t('landing.how.title', 'How It Works')}
              </h2>
              <p className="text-base sm:text-lg text-[#F2EBDD]/80 font-bold max-w-2xl">
                {t('landing.how.subtitle', 'Launch your first automation in three simple steps.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative z-10 flex flex-col items-start text-left bg-[#F2EBDD] text-[#0A0A0A] border-4 border-[#0A0A0A] shadow-[8px_8px_0px_rgba(255,255,255,0.2)] p-8 space-y-4 rounded-xl hover:-translate-y-1 transition-all reveal-slide-left reveal-delay-100">
                <div className="w-16 h-16 bg-amber-400 text-[#0A0A0A] flex items-center justify-center font-['Anybody',sans-serif] text-2xl font-black border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-lg">
                  01
                </div>
                <h3 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase leading-tight">
                  {t('landing.how.step1_title', 'Connect Your Bot')}
                </h3>
                <p className="text-sm sm:text-base font-bold text-[#0A0A0A]/80 leading-relaxed">
                  {t('landing.how.step1_desc', 'Link your Telegram channels in seconds with zero coding required.')}
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-start text-left bg-[#F2EBDD] text-[#0A0A0A] border-4 border-[#0A0A0A] shadow-[8px_8px_0px_rgba(255,255,255,0.2)] p-8 space-y-4 rounded-xl hover:-translate-y-1 transition-all reveal-scale-rotate reveal-delay-200">
                <div className="w-16 h-16 bg-amber-400 text-[#0A0A0A] flex items-center justify-center font-['Anybody',sans-serif] text-2xl font-black border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-lg">
                  02
                </div>
                <h3 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase leading-tight">
                  {t('landing.how.step2_title', 'Build Your Flow')}
                </h3>
                <p className="text-sm sm:text-base font-bold text-[#0A0A0A]/80 leading-relaxed">
                  {t('landing.how.step2_desc', 'Use the visual drag-and-drop canvas to map out the perfect automated user journey.')}
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-start text-left bg-[#F2EBDD] text-[#0A0A0A] border-4 border-[#0A0A0A] shadow-[8px_8px_0px_rgba(255,255,255,0.2)] p-8 space-y-4 rounded-xl hover:-translate-y-1 transition-all reveal-slide-right reveal-delay-300">
                <div className="w-16 h-16 bg-amber-400 text-[#0A0A0A] flex items-center justify-center font-['Anybody',sans-serif] text-2xl font-black border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-lg">
                  03
                </div>
                <h3 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase leading-tight">
                  {t('landing.how.step3_title', 'Start Receiving Payments')}
                </h3>
                <p className="text-sm sm:text-base font-bold text-[#0A0A0A]/80 leading-relaxed">
                  {t('landing.how.step3_desc', 'Launch your bot and watch subscriber engagement and automated revenue roll in.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="py-20 md:py-28 bg-[#F2EBDD] border-y-4 border-[#0A0A0A] px-6 lg:px-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-left mb-12 border-l-8 border-[#0A0A0A] pl-6 reveal-blur-in">
              <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
                {t('landing.use_cases.title', 'Solutions for Every Industry')}
              </h2>
              <p className="text-base sm:text-lg text-[#0A0A0A] font-bold">
                {t('landing.use_cases.subtitle', 'Automate communications and sales tailored to your specific business needs')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 reveal-scale reveal-delay-100">
              <button
                onClick={() => setUseCaseTab('ecommerce')}
                className={`p-4 border-3 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  useCaseTab === 'ecommerce'
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[6px_6px_0px_#0A0A0A] -translate-y-0.5'
                    : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A]/5'
                }`}
              >
                <ShoppingBag size={18} />
                <span className="truncate">{t('landing.use_cases.ecommerce_title', 'E-Commerce & Stores')}</span>
              </button>

              <button
                onClick={() => setUseCaseTab('courses')}
                className={`p-4 border-3 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  useCaseTab === 'courses'
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[6px_6px_0px_#0A0A0A] -translate-y-0.5'
                    : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A]/5'
                }`}
              >
                <GraduationCap size={18} />
                <span className="truncate">{t('landing.use_cases.courses_title', 'Info-Business & Courses')}</span>
              </button>

              <button
                onClick={() => setUseCaseTab('services')}
                className={`p-4 border-3 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  useCaseTab === 'services'
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[6px_6px_0px_#0A0A0A] -translate-y-0.5'
                    : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A]/5'
                }`}
              >
                <Calendar size={18} />
                <span className="truncate">{t('landing.use_cases.services_title', 'Services & Bookings')}</span>
              </button>

              <button
                onClick={() => setUseCaseTab('agencies')}
                className={`p-4 border-3 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  useCaseTab === 'agencies'
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[6px_6px_0px_#0A0A0A] -translate-y-0.5'
                    : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A]/5'
                }`}
              >
                <Target size={18} />
                <span className="truncate">{t('landing.use_cases.agencies_title', 'Marketers & Agencies')}</span>
              </button>
            </div>
            <div className="bg-white border-4 border-[#0A0A0A] shadow-[10px_10px_0px_#0A0A0A] p-8 sm:p-12 flex flex-col md:flex-row gap-8 items-start justify-between transition-all rounded-2xl reveal-brutal-pop reveal-delay-150">
              <div className="space-y-5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg shadow-[2px_2px_0px_#0A0A0A]">
                  {useCaseTab === 'ecommerce' && <ShoppingBag size={14} className="text-emerald-400" />}
                  {useCaseTab === 'courses' && <GraduationCap size={14} className="text-amber-400" />}
                  {useCaseTab === 'services' && <Calendar size={14} className="text-sky-400" />}
                  {useCaseTab === 'agencies' && <Target size={14} className="text-purple-400" />}
                  <span>{t(`landing.use_cases.${useCaseTab}_title`)}</span>
                </div>

                <h3 className="font-['Anybody',sans-serif] text-3xl sm:text-4xl font-black text-[#0A0A0A] uppercase leading-tight">
                  {t(`landing.use_cases.${useCaseTab}_title`)}
                </h3>

                <p className="text-base sm:text-lg text-[#0A0A0A]/85 font-semibold leading-relaxed">
                  {t(`landing.use_cases.${useCaseTab}_desc`)}
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_#0A0A0A]">
                      <Check size={14} className="text-[#0A0A0A] stroke-[3]" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[#0A0A0A]">
                      {t(`landing.use_cases.${useCaseTab}_f1`)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_#0A0A0A]">
                      <Check size={14} className="text-[#0A0A0A] stroke-[3]" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[#0A0A0A]">
                      {t(`landing.use_cases.${useCaseTab}_f2`)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0px_#0A0A0A]">
                      <Check size={14} className="text-[#0A0A0A] stroke-[3]" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[#0A0A0A]">
                      {t(`landing.use_cases.${useCaseTab}_f3`)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto shrink-0 pt-6 md:pt-0 self-end">
                <button
                  onClick={handleCta}
                  className="w-full sm:w-auto bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-[#0A0A0A] shadow-[5px_5px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t('landing.hero.cta_start', 'Start Building Free')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="comparison" className="py-20 md:py-28 bg-[#0A0A0A] text-[#F2EBDD] px-6 lg:px-12 border-y-4 border-[#0A0A0A] relative z-10" data-header-theme="dark">
          <div className="max-w-7xl mx-auto">
            <div className="text-left mb-12 border-l-8 border-[#F2EBDD] pl-6 reveal-blur-in">
              <p className="font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest text-emerald-300 mb-3">
                {t('landing.comparison.eyebrow', 'BUSINESS COMPARISON')}
              </p>
              <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none mb-3">
                {t('landing.comparison.title', 'WHY LAUNCHLY WINS')}
              </h2>
              <p className="text-base sm:text-lg font-bold max-w-3xl text-[#F2EBDD]/80">
                {t(
                  'landing.comparison.subtitle',
                  'Compare the real cost of launching Telegram automation: speed, team dependency, operations, and long-term maintenance.'
                )}
              </p>
            </div>

            <div className="overflow-x-auto border-2 border-[#F2EBDD] shadow-[8px_8px_0px_#F2EBDD] bg-[#F2EBDD] text-[#0A0A0A] reveal-flip-up reveal-delay-150">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[1.15fr_1fr_1fr_1fr] border-b-2 border-[#0A0A0A]">
                  <div className="p-4 bg-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest">
                    {t('landing.comparison.column_metric', 'Decision factor')}
                  </div>
                  <div className="p-4 bg-emerald-300 border-l-2 border-[#0A0A0A] font-['Anybody',sans-serif] text-xl font-black uppercase">
                    {t('landing.comparison.col_launchly', 'Launchly')}
                  </div>
                  <div className="p-4 bg-white border-l-2 border-[#0A0A0A] font-['Anybody',sans-serif] text-xl font-black uppercase">
                    {t('landing.comparison.col_manual', 'Manual Telegram bot')}
                  </div>
                  <div className="p-4 bg-white border-l-2 border-[#0A0A0A] font-['Anybody',sans-serif] text-xl font-black uppercase">
                    {t('landing.comparison.col_custom', 'Custom development')}
                  </div>
                </div>

                {[
                  {
                    metric: t('landing.comparison.r1_metric', 'Launch speed'),
                    launchly: t('landing.comparison.r1_launchly', 'Hours to first working funnel'),
                    manual: t('landing.comparison.r1_manual', 'Fast start, slow to scale'),
                    custom: t('landing.comparison.r1_custom', 'Weeks or months before launch'),
                  },
                  {
                    metric: t('landing.comparison.r2_metric', 'Engineering dependency'),
                    launchly: t('landing.comparison.r2_launchly', 'No-code builder for business teams'),
                    manual: t('landing.comparison.r2_manual', 'Owner or operator does everything manually'),
                    custom: t('landing.comparison.r2_custom', 'Requires developers for every change'),
                  },
                  {
                    metric: t('landing.comparison.r3_metric', 'CRM, tags, and audience data'),
                    launchly: t('landing.comparison.r3_launchly', 'Built in from day one'),
                    manual: t('landing.comparison.r3_manual', 'Scattered across chats and spreadsheets'),
                    custom: t('landing.comparison.r3_custom', 'Must be scoped, built, and maintained'),
                  },
                  {
                    metric: t('landing.comparison.r4_metric', 'Payments and follow-ups'),
                    launchly: t('landing.comparison.r4_launchly', 'Payments, triggers, and post-purchase flows'),
                    manual: t('landing.comparison.r4_manual', 'Manual checks and missed follow-ups'),
                    custom: t('landing.comparison.r4_custom', 'Extra integrations and QA cycles'),
                  },
                  {
                    metric: t('landing.comparison.r5_metric', 'AI automation'),
                    launchly: t('landing.comparison.r5_launchly', 'AI nodes ready for support and sales flows'),
                    manual: t('landing.comparison.r5_manual', 'No reliable AI workflow layer'),
                    custom: t('landing.comparison.r5_custom', 'Possible, but expensive to implement well'),
                  },
                  {
                    metric: t('landing.comparison.r6_metric', 'Maintenance cost'),
                    launchly: t('landing.comparison.r6_launchly', 'Platform updates included'),
                    manual: t('landing.comparison.r6_manual', 'Hidden cost in daily team time'),
                    custom: t('landing.comparison.r6_custom', 'Ongoing developer budget required'),
                  },
                ].map((row, index) => (
                  <div
                    key={row.metric}
                    className={`grid grid-cols-[1.15fr_1fr_1fr_1fr] ${
                      index < 5 ? 'border-b-2 border-[#0A0A0A]' : ''
                    }`}
                  >
                    <div className="p-4 bg-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider">
                      {row.metric}
                    </div>
                    <div className="p-4 bg-emerald-100 border-l-2 border-[#0A0A0A] text-sm font-black leading-relaxed flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-700 stroke-[3]" />
                      <span>{row.launchly}</span>
                    </div>
                    <div className="p-4 bg-white border-l-2 border-[#0A0A0A] text-sm font-bold leading-relaxed text-[#0A0A0A]/75">
                      {row.manual}
                    </div>
                    <div className="p-4 bg-white border-l-2 border-[#0A0A0A] text-sm font-bold leading-relaxed text-[#0A0A0A]/75">
                      {row.custom}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <p className="text-sm sm:text-base font-bold text-[#F2EBDD]/80 max-w-2xl">
                {t(
                  'landing.comparison.takeaway',
                  'For CEOs, the question is not whether automation is possible. It is how fast your team can launch it without turning every funnel change into an engineering project.'
                )}
              </p>
              <button
                onClick={handleCta}
                className="bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-[#F2EBDD] shadow-[4px_4px_0px_#F2EBDD] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t('landing.comparison.cta', 'Build without developers')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 md:py-28 bg-[#F2EBDD] border-b-4 border-[#0A0A0A] px-6 lg:px-12 relative z-10">
          <div className="max-w-7xl mx-auto space-y-10">
            
            <div className="text-left border-l-8 border-[#0A0A0A] pl-6 reveal-blur-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg mb-2.5">
                <Users size={14} className="text-amber-400" />
                <span>{t('landing.testimonials.badge', 'Відгуки та Історії Успіху')}</span>
              </div>
              <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
                {t('landing.testimonials.title', 'Що кажуть наші клієнти')}
              </h2>
              <p className="text-base sm:text-lg text-[#0A0A0A] font-bold max-w-2xl">
                {t('landing.testimonials.subtitle', 'Понад 5,000+ бізнесів та агентств автоматизують продажі та підтримку за допомогою Launchly.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              
              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all reveal-brutal-pop reveal-delay-50">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t1_text')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t1_name')}
                    className="w-11 h-11 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                  />
                  <div>
                    <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-tight">
                      {t('landing.testimonials.t1_name')}
                    </h4>
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600">
                      {t('landing.testimonials.t1_role')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all reveal-scale-rotate reveal-delay-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t2_text')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t2_name')}
                    className="w-11 h-11 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                  />
                  <div>
                    <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-tight">
                      {t('landing.testimonials.t2_name')}
                    </h4>
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600">
                      {t('landing.testimonials.t2_role')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all reveal-brutal-pop reveal-delay-150">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t3_text')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t3_name')}
                    className="w-11 h-11 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                  />
                  <div>
                    <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-tight">
                      {t('landing.testimonials.t3_name')}
                    </h4>
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600">
                      {t('landing.testimonials.t3_role')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all reveal-scale-rotate reveal-delay-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t4_text')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t4_name')}
                    className="w-11 h-11 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                  />
                  <div>
                    <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-tight">
                      {t('landing.testimonials.t4_name')}
                    </h4>
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600">
                      {t('landing.testimonials.t4_role')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all reveal-brutal-pop reveal-delay-250">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t5_text')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t5_name')}
                    className="w-11 h-11 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                  />
                  <div>
                    <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-tight">
                      {t('landing.testimonials.t5_name')}
                    </h4>
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600">
                      {t('landing.testimonials.t5_role')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all reveal-scale-rotate reveal-delay-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t6_text')}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t6_name')}
                    className="w-11 h-11 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
                  />
                  <div>
                    <h4 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-tight">
                      {t('landing.testimonials.t6_name')}
                    </h4>
                    <p className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600">
                      {t('landing.testimonials.t6_role')}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        <section id="trust" className="py-20 md:py-28 bg-[#0A0A0A] text-[#F2EBDD] border-b-4 border-[#F2EBDD] px-6 lg:px-12 relative z-10" data-header-theme="dark">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-left border-l-8 border-[#F2EBDD] pl-6 reveal-blur-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg mb-2.5">
                <Shield size={14} className="text-amber-500" />
                <span>{t('landing.trust.badge', 'БЕЗПЕКА & НАДІЙНІСТЬ')}</span>
              </div>
              <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black text-white mb-2 uppercase leading-none">
                {t('landing.trust.title', 'Ваш бізнес у надійних руках')}
              </h2>
              <p className="text-base sm:text-lg text-[#F2EBDD]/70 font-bold max-w-2xl">
                {t('landing.trust.subtitle', 'Ми дбаємо про безперебійну роботу ваших автоматизацій та безпеку даних на рівні Enterprise.')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Server size={28} className="text-emerald-400" />, title: t('landing.trust.uptime_title', '99.9% Uptime SLA'), desc: t('landing.trust.uptime_desc', 'Боти працюють цілодобово навіть під час пікових рекламних кампаній'), border: 'border-emerald-500/50 hover:border-emerald-400' },
                { icon: <Lock size={28} className="text-amber-400" />, title: t('landing.trust.encryption_title', 'Шифрування AES-256'), desc: t('landing.trust.encryption_desc', 'Токени Telegram та ключі Stripe зберігаються у зашифрованому vault'), border: 'border-amber-500/50 hover:border-amber-400' },
                { icon: <Server size={28} className="text-indigo-400" />, title: t('landing.trust.backup_title', 'Авто-резервування'), desc: t('landing.trust.backup_desc', 'Кожен стан воронки та налаштування бота резервуються щохвилини'), border: 'border-indigo-500/50 hover:border-indigo-400' },
                { icon: <Shield size={28} className="text-rose-400" />, title: t('landing.trust.gdpr_title', 'GDPR Compliant'), desc: t('landing.trust.gdpr_desc', 'Дані користувачів обробляються відповідно до вимог законодавства ЄС'), border: 'border-rose-500/50 hover:border-rose-400' },
              ].map((item, i) => (
                <div key={i} className={`bg-white/5 border-2 ${item.border} p-6 space-y-4 hover:-translate-y-1 transition-all reveal-brutal-pop`} style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-12 h-12 bg-white/10 border border-white/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-white leading-tight">
                    {item.title}
                  </h3>
                  <p className="font-['Geist',sans-serif] text-sm text-[#F2EBDD]/60 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 px-6 lg:px-12 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-12 space-y-4 reveal-blur-in">
            <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl font-black text-[#0A0A0A] uppercase leading-none">
              {t('landing.pricing.title', 'SIMPLE, TRANSPARENT PRICING')}
            </h2>
            <p className="text-base sm:text-lg text-[#0A0A0A] font-bold">
              {t('landing.pricing.subtitle', 'Choose the plan that fits your growth.')}
            </p>

            <div className="inline-flex bg-white border-2 border-[#0A0A0A] p-1 shadow-[4px_4px_0px_#0A0A0A] mt-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-slate-100'
                }`}
              >
                {t('landing.pricing.monthly', 'MONTHLY')}
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-slate-100'
                }`}
              >
                {t('landing.pricing.annual', 'ANNUAL')} <span className="font-bold border-b border-current ml-1">{t('landing.pricing.discount', '-20%')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {LAUNCHLY_PLANS.map((plan, idx) => {
              const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
              const isPro = plan.id === 'pro';

              const planName = t(`landing.plans.${plan.id}.name`, plan.name);
              const planSubtitle = t(`landing.plans.${plan.id}.subtitle`, plan.subtitle);
              const planCta = t(`landing.plans.${plan.id}.cta`, plan.cta);
              const planFeatures = plan.features.map((feat, fIdx) =>
                t(`landing.plans.${plan.id}.f${fIdx + 1}`, feat)
              );

              const delays = ['reveal-delay-100', 'reveal-delay-200', 'reveal-delay-300', 'reveal-delay-400'];

              return (
                <div
                  key={plan.id}
                  className={`border-2 border-[#0A0A0A] p-6 flex flex-col justify-between relative transition-all reveal-brutal-pop ${delays[idx % 4]} ${
                    isPro
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[6px_6px_0px_#0A0A0A] ring-2 ring-indigo-500 lg:-translate-y-2'
                      : 'bg-[#F2EBDD] text-[#0A0A0A] shadow-[5px_5px_0px_#0A0A0A]'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest font-black border-l-2 border-b-2 border-[#0A0A0A]">
                      {t('landing.pricing.popular', 'MOST POPULAR')}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-['Anybody',sans-serif] text-2xl font-black uppercase ${isPro ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'}`}>
                          {planName}
                        </h3>
                        {plan.badge && (
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-bold">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-medium mt-1 min-h-[2.25rem] leading-snug ${isPro ? 'text-slate-300' : 'text-slate-600'}`}>
                        {planSubtitle}
                      </p>
                    </div>

                    <div className="py-2 border-t border-b border-current/20 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-['Anybody',sans-serif] text-3xl sm:text-4xl font-black">${price}</span>
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest opacity-80">{t('landing.pricing.mo', '/mo')}</span>
                      </div>
                      <div className="pt-1">
                        <span className="font-['Anybody',sans-serif] text-lg font-extrabold">{plan.contactsLimit}</span>
                        <span className="text-[11px] font-bold block opacity-70 leading-none mt-0.5">{t('landing.pricing.contacts_label', 'Active Contacts / mo')}</span>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {planFeatures.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs font-medium leading-tight">
                          <Check size={14} className={`shrink-0 mt-0.5 ${isPro ? 'text-indigo-400' : 'text-[#0A0A0A]'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={handleCta}
                      className={`w-full font-['JetBrains_Mono',monospace] text-xs font-extrabold uppercase tracking-wider py-3 border-2 transition-all cursor-pointer ${
                        isPro
                          ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD] shadow-[3px_3px_0px_rgba(242,235,221,0.4)] hover:bg-white hover:border-white hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                          : 'bg-white text-[#0A0A0A] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                      }`}
                    >
                      {planCta}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        <section id="faq" className="py-20 md:py-28 px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-left border-l-8 border-[#0A0A0A] pl-6 reveal-blur-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg mb-2.5">
                <BookOpen size={14} className="text-amber-400" />
                <span>{t('landing.faq.badge', 'ЧАСТІ ЗАПИТАННЯ')}</span>
              </div>
              <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
                {t('landing.faq.title', 'Маєте питання?')}
              </h2>
              <p className="text-base sm:text-lg text-[#0A0A0A] font-bold max-w-2xl">
                {t('landing.faq.subtitle', 'Знаходимо відповіді на найпоширеніші запитання наших клієнтів.')}
              </p>
            </div>

            <div className="space-y-3">
              {([1, 2, 3, 4, 5, 6] as const).map((n) => {
                const isOpen = faqOpen === n;
                return (
                  <div
                    key={n}
                    className={`border-4 border-[#0A0A0A] bg-white transition-all ${isOpen ? 'shadow-[6px_6px_0px_#0A0A0A]' : 'shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A]'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? null : n)}
                      className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                    >
                      <span className="font-['Anybody',sans-serif] text-base sm:text-lg font-black uppercase text-[#0A0A0A] leading-tight">
                        {t(`landing.faq.q${n}`, '')}
                      </span>
                      <span className={`shrink-0 w-8 h-8 border-2 border-[#0A0A0A] flex items-center justify-center transition-transform duration-200 ${isOpen ? 'bg-[#0A0A0A] rotate-180' : 'bg-white'}`}>
                        <ChevronDown size={16} className={isOpen ? 'text-amber-400' : 'text-[#0A0A0A]'} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t-2 border-[#0A0A0A]/10 pt-4">
                        <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                          {t(`landing.faq.a${n}`, '')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="w-full pb-0 bg-transparent select-none overflow-hidden" data-header-theme="dark">
          <div className="w-full overflow-hidden leading-none -mb-1 relative h-20 sm:h-28 md:h-36 lg:h-44">
            <svg
              className="absolute top-0 left-0 h-full pointer-events-none animate-wave-back"
              style={{ width: '200%' }}
              viewBox="0 0 2880 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 0 25 C 180 25,180 5,360 5 C 540 5,540 25,720 25 C 900 25,900 45,1080 45 C 1260 45,1260 25,1440 25 C 1620 25,1620 5,1800 5 C 1980 5,1980 25,2160 25 C 2340 25,2340 45,2520 45 C 2700 45,2700 25,2880 25 L 2880 100 L 0 100 Z"
                fill="#0A0A0A"
                fillOpacity="0.4"
              />
            </svg>
            <svg
              className="absolute top-0 left-0 h-full pointer-events-none animate-wave-front"
              style={{ width: '200%' }}
              viewBox="0 0 2880 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 0 25 C 180 25,180 5,360 5 C 540 5,540 25,720 25 C 900 25,900 45,1080 45 C 1260 45,1260 25,1440 25 C 1620 25,1620 5,1800 5 C 1980 5,1980 25,2160 25 C 2340 25,2340 45,2520 45 C 2700 45,2700 25,2880 25 L 2880 100 L 0 100 Z"
                fill="#0A0A0A"
              />
            </svg>
          </div>

          <div className="bg-[#0A0A0A] text-[#F2EBDD] w-full pt-2 sm:pt-4 pb-16 sm:pb-24 px-6 lg:px-16 text-center">
            <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
              <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-[0.95]">
                {t('landing.cta.title', 'Створіть свою першу автоматизацію безкоштовно вже сьогодні')}
              </h2>

              <p className="font-['JetBrains_Mono',monospace] text-xs sm:text-base text-[#F2EBDD]/70 font-bold max-w-2xl mx-auto leading-relaxed">
                {t('landing.cta.subtitle', "Без прив'язки банківської картки. Налаштування займе 3 хвилини.")}
              </p>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleCta}
                  className="bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-sm sm:text-base font-black uppercase tracking-wider px-8 sm:px-12 py-3.5 sm:py-4 border-4 border-[#F2EBDD] shadow-[6px_6px_0px_rgba(255,255,255,0.25)] hover:bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center gap-3"
                >
                  <span>{t('landing.cta.button', 'Розпочати безкоштовно →')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
};

export default LandingPage;
