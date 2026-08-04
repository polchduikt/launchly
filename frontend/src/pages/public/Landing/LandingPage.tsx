import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import { LAUNCHLY_PLANS } from '../../../const/plans';
import logo from '../../../assets/images/logo.png';
import { useTranslation } from '../../../i18n/config';
import { HeroInteractiveDemo } from './components/HeroInteractiveDemo';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import {
  Workflow,
  Bot,
  Users,
  CreditCard,
  BookOpen,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  ShoppingBag,
  GraduationCap,
  Calendar,
  Target,
  Star,
  Quote
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [useCaseTab, setUseCaseTab] = useState<'ecommerce' | 'courses' | 'services' | 'agencies'>('ecommerce');
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

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
              <div className="absolute top-full left-0 mt-2 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] py-1 min-w-[75px] z-50">
                <button
                  onClick={() => {
                    changeLanguage('en');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors cursor-pointer ${
                    currentLanguage === 'en' ? 'bg-[#0A0A0A]/10 font-black' : ''
                  }`}
                >
                  En
                </button>
                <button
                  onClick={() => {
                    changeLanguage('uk');
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors cursor-pointer ${
                    currentLanguage === 'uk' ? 'bg-[#0A0A0A]/10 font-black' : ''
                  }`}
                >
                  Uk
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <a 
            href="#features" 
            className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
          >
            {t('landing.nav.product', 'PRODUCT')}
          </a>
          <a 
            href="#features" 
            className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
          >
            {t('landing.nav.features', 'FEATURES')}
          </a>
          <a 
            href="#pricing" 
            className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
          >
            {t('landing.nav.pricing', 'PRICING')}
          </a>
          <Link 
            to={ROUTES.BLOG} 
            className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
          >
            {t('landing.nav.blog', 'BLOG')}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
            >
              {t('landing.nav.dashboard', 'DASHBOARD')}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#0A0A0A] uppercase tracking-wider hover:underline underline-offset-4 cursor-pointer"
              >
                {t('landing.nav.login', 'LOGIN')}
              </button>
              <button
                onClick={() => navigate(ROUTES.REGISTER)}
                className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
              >
                {t('landing.nav.signup', 'SIGN UP')}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-grow pt-10 sm:pt-14">
        <section className="py-16 md:py-24 px-6 lg:px-12 max-w-7xl mx-auto relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left z-10 space-y-6">
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
          </div>

          <div className="flex-1 w-full relative">
            <HeroInteractiveDemo />
          </div>
        </section>

        <section className="py-6 bg-[#0A0A0A] border-y-4 border-[#0A0A0A] overflow-hidden select-none">
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
        <section className="py-20 md:py-28 px-6 lg:px-12 max-w-7xl mx-auto" id="features">
          <div className="text-left mb-12 border-b-4 border-[#0A0A0A] pb-4">
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
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer">
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

            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer">
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

            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer">
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

            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all duration-200 group cursor-pointer">
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

        <section className="py-20 md:py-28 bg-white border-y-4 border-[#0A0A0A] px-6 lg:px-12 relative z-10 my-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-left mb-12 border-l-8 border-[#0A0A0A] pl-6">
            <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
              {t('landing.use_cases.title', 'Solutions for Every Industry')}
            </h2>
            <p className="text-base sm:text-lg text-[#0A0A0A] font-bold">
              {t('landing.use_cases.subtitle', 'Automate communications and sales tailored to your specific business needs')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <button
              onClick={() => setUseCaseTab('ecommerce')}
              className={`p-4 border-2 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                useCaseTab === 'ecommerce'
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[4px_4px_0px_#0A0A0A]'
                  : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#F2EBDD]'
              }`}
            >
              <ShoppingBag size={18} />
              <span className="truncate">{t('landing.use_cases.ecommerce_title', 'E-Commerce & Stores')}</span>
            </button>

            <button
              onClick={() => setUseCaseTab('courses')}
              className={`p-4 border-2 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                useCaseTab === 'courses'
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[4px_4px_0px_#0A0A0A]'
                  : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#F2EBDD]'
              }`}
            >
              <GraduationCap size={18} />
              <span className="truncate">{t('landing.use_cases.courses_title', 'Info-Business & Courses')}</span>
            </button>

            <button
              onClick={() => setUseCaseTab('services')}
              className={`p-4 border-2 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                useCaseTab === 'services'
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[4px_4px_0px_#0A0A0A]'
                  : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#F2EBDD]'
              }`}
            >
              <Calendar size={18} />
              <span className="truncate">{t('landing.use_cases.services_title', 'Services & Bookings')}</span>
            </button>

            <button
              onClick={() => setUseCaseTab('agencies')}
              className={`p-4 border-2 border-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                useCaseTab === 'agencies'
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[4px_4px_0px_#0A0A0A]'
                  : 'bg-white text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#F2EBDD]'
              }`}
            >
              <Target size={18} />
              <span className="truncate">{t('landing.use_cases.agencies_title', 'Marketers & Agencies')}</span>
            </button>
          </div>

          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start justify-between transition-all">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg">
                {useCaseTab === 'ecommerce' && <ShoppingBag size={14} />}
                {useCaseTab === 'courses' && <GraduationCap size={14} />}
                {useCaseTab === 'services' && <Calendar size={14} />}
                {useCaseTab === 'agencies' && <Target size={14} />}
                <span>{t(`landing.use_cases.${useCaseTab}_title`)}</span>
              </div>

              <h3 className="font-['Anybody',sans-serif] text-2xl sm:text-3xl font-black text-[#0A0A0A] uppercase leading-tight">
                {t(`landing.use_cases.${useCaseTab}_title`)}
              </h3>

              <p className="text-base text-[#0A0A0A] font-medium leading-relaxed">
                {t(`landing.use_cases.${useCaseTab}_desc`)}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-400 border border-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-[#0A0A0A] stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-[#0A0A0A]">
                    {t(`landing.use_cases.${useCaseTab}_f1`)}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-400 border border-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-[#0A0A0A] stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-[#0A0A0A]">
                    {t(`landing.use_cases.${useCaseTab}_f2`)}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-400 border border-[#0A0A0A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-[#0A0A0A] stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-[#0A0A0A]">
                    {t(`landing.use_cases.${useCaseTab}_f3`)}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0 self-end">
              <button
                onClick={handleCta}
                className="w-full sm:w-auto bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-extrabold uppercase tracking-wider px-8 py-4 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t('landing.hero.cta_start', 'Start Building Free')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
            </div>
          </div>
        </section>
        <section className="py-20 md:py-28 bg-white px-6 lg:px-12 border-y-4 border-[#0A0A0A] relative z-10">
          <div className="max-w-7xl mx-auto relative z-20">
            <div className="text-left mb-12 border-l-8 border-[#0A0A0A] pl-6">
              <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
                {t('landing.how.title', 'How It Works')}
              </h2>
              <p className="text-base sm:text-lg text-[#0A0A0A] font-bold">
                {t('landing.how.subtitle', 'Launch your first automation in three simple steps.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative z-10 flex flex-col items-start text-left bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 space-y-3">
                <div className="w-14 h-14 bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center font-['Anybody',sans-serif] text-2xl font-black border-2 border-white shadow-[3px_3px_0px_#0A0A0A]">
                  01
                </div>
                <h3 className="font-['Anybody',sans-serif] text-xl font-extrabold text-[#0A0A0A] uppercase leading-tight">
                  {t('landing.how.step1_title', 'Connect Your Bot')}
                </h3>
                <p className="text-sm font-medium text-[#0A0A0A] leading-relaxed">
                  {t('landing.how.step1_desc', 'Link your Telegram channels in seconds with zero coding required.')}
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-start text-left bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 space-y-3">
                <div className="w-14 h-14 bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center font-['Anybody',sans-serif] text-2xl font-black border-2 border-white shadow-[3px_3px_0px_#0A0A0A]">
                  02
                </div>
                <h3 className="font-['Anybody',sans-serif] text-xl font-extrabold text-[#0A0A0A] uppercase leading-tight">
                  {t('landing.how.step2_title', 'Build Your Flow')}
                </h3>
                <p className="text-sm font-medium text-[#0A0A0A] leading-relaxed">
                  {t('landing.how.step2_desc', 'Use the visual drag-and-drop canvas to map out the perfect automated user journey.')}
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-start text-left bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 space-y-3">
                <div className="w-14 h-14 bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center font-['Anybody',sans-serif] text-2xl font-black border-2 border-white shadow-[3px_3px_0px_#0A0A0A]">
                  03
                </div>
                <h3 className="font-['Anybody',sans-serif] text-xl font-extrabold text-[#0A0A0A] uppercase leading-tight">
                  {t('landing.how.step3_title', 'Start Receiving Payments')}
                </h3>
                <p className="text-sm font-medium text-[#0A0A0A] leading-relaxed">
                  {t('landing.how.step3_desc', 'Launch your bot and watch subscriber engagement and automated revenue roll in.')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-[#F2EBDD] border-b-4 border-[#0A0A0A] px-6 lg:px-12 relative z-10">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-left border-l-8 border-[#0A0A0A] pl-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg mb-3">
                <Users size={14} className="text-amber-400" />
                <span>{t('landing.testimonials.badge', 'Відгуки та Історії Успіху')}</span>
              </div>
              <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
                {t('landing.testimonials.title', 'Що кажуть наші клієнти')}
              </h2>
              <p className="text-base sm:text-lg text-[#0A0A0A] font-bold max-w-2xl">
                {t('landing.testimonials.subtitle', 'Понад 5,000+ бізнесів та агентств автоматизують продажі та підтримку за допомогою Launchly.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 flex flex-col justify-between space-y-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t1_text')}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t1_name')}
                    className="w-12 h-12 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
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

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 flex flex-col justify-between space-y-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t2_text')}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t2_name')}
                    className="w-12 h-12 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
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

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 flex flex-col justify-between space-y-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t3_text')}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t3_name')}
                    className="w-12 h-12 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
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

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 flex flex-col justify-between space-y-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t4_text')}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t4_name')}
                    className="w-12 h-12 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
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

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 flex flex-col justify-between space-y-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t5_text')}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t5_name')}
                    className="w-12 h-12 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
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

              <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-8 flex flex-col justify-between space-y-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} className="fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                    {t('landing.testimonials.t6_text')}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-[#0A0A0A]/10">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80"
                    alt={t('landing.testimonials.t6_name')}
                    className="w-12 h-12 rounded-full border-2 border-[#0A0A0A] object-cover shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
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

        <section className="py-20 md:py-28 px-6 lg:px-12 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-12 space-y-4">
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
            {LAUNCHLY_PLANS.map((plan) => {
              const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
              const isPro = plan.id === 'pro';

              return (
                <div
                  key={plan.id}
                  className={`border-2 border-[#0A0A0A] p-6 sm:p-8 flex flex-col justify-between relative transition-all ${
                    isPro
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[8px_8px_0px_#0A0A0A] ring-2 ring-indigo-500 lg:-translate-y-2'
                      : 'bg-[#F2EBDD] text-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-widest font-black border-l-2 border-b-2 border-[#0A0A0A]">
                      {t('landing.pricing.popular', 'MOST POPULAR')}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-['Anybody',sans-serif] text-2xl font-black uppercase ${isPro ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'}`}>
                          {plan.name}
                        </h3>
                        {plan.badge && (
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-bold">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-medium mt-1 leading-relaxed ${isPro ? 'text-slate-300' : 'text-slate-600'}`}>
                        {plan.subtitle}
                      </p>
                    </div>

                    <div className="py-2 border-t border-b border-current/20 space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-['Anybody',sans-serif] text-4xl font-black">${price}</span>
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest opacity-80">{t('landing.pricing.mo', '/mo')}</span>
                      </div>
                      <div className="pt-2">
                        <span className="font-['Anybody',sans-serif] text-xl font-extrabold">{plan.contactsLimit}</span>
                        <span className="text-[11px] font-bold block opacity-70">{t('landing.pricing.contacts_label', 'Active Contacts / mo')}</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs font-medium leading-tight">
                          <Check size={14} className={`shrink-0 mt-0.5 ${isPro ? 'text-indigo-400' : 'text-[#0A0A0A]'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleCta}
                      className={`w-full font-['JetBrains_Mono',monospace] text-xs font-extrabold uppercase tracking-wider py-3.5 border-2 transition-all cursor-pointer ${
                        isPro
                          ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD] shadow-[3px_3px_0px_rgba(242,235,221,0.4)] hover:bg-white hover:border-white hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                          : 'bg-white text-[#0A0A0A] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        <section className="my-20 px-6 lg:px-16 max-w-7xl mx-auto">
          <div className="bg-[#0A0A0A] text-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[10px_10px_0px_#0A0A0A] p-8 sm:p-14 lg:p-16 rounded-3xl relative overflow-hidden text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-black uppercase rounded-lg border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.3)]">
              <Zap size={15} className="text-amber-600 fill-amber-500" />
              <span>{t('landing.cta.badge', 'Готові автоматизувати свій бізнес?')}</span>
            </div>

            <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-tight max-w-4xl mx-auto">
              {t('landing.cta.title', 'Створіть свій перший бот безкоштовно вже сьогодні')}
            </h2>

            <p className="font-['JetBrains_Mono',monospace] text-sm sm:text-lg text-slate-300 font-bold max-w-2xl mx-auto leading-relaxed">
              {t('landing.cta.subtitle', "Без прив'язки банківської картки. Налаштування займе 3 хвилини.")}
            </p>

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleCta}
                className="bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-base sm:text-lg font-black uppercase tracking-wider px-8 sm:px-12 py-4 sm:py-5 border-4 border-white shadow-[6px_6px_0px_rgba(255,255,255,0.4)] hover:bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center gap-3"
              >
                <span>{t('landing.cta.button', 'Розпочати безкоштовно →')}</span>
              </button>
            </div>

          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
};

export default LandingPage;
