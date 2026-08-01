import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import { LAUNCHLY_PLANS } from '../../../const/plans';
import logo from '../../../assets/images/logo.png';
import { useTranslation } from '../../../i18n/config';
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
  Check
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  const handleCta = () => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME);
    } else {
      navigate(ROUTES.REGISTER);
    }
  };

  const toolsList = ['TELEGRAM', 'STRIPE', 'PAYPAL', 'OPENAI', 'GEMINI', 'CLAUDE'];

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
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] p-4 relative z-10">
              
              <div className="bg-[#0A0A0A] text-[#F2EBDD] p-3 flex items-center justify-between font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider border-b-2 border-[#0A0A0A]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="ml-2 text-[11px] text-slate-300">Telegram Sales Funnel #1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px]">LIVE WORKFLOW</span>
                </div>
              </div>

              <div className="bg-[#0F172A] text-slate-100 p-6 rounded-b-lg font-mono text-xs space-y-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                
                <div className="relative z-10 bg-slate-900 border-2 border-indigo-500 rounded-xl p-4 shadow-md space-y-1.5 max-w-sm">
                  <div className="flex items-center justify-between text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Zap size={14} /> TRIGGER NODE</span>
                    <span className="text-slate-400">Telegram Bot</span>
                  </div>
                  <p className="text-slate-200 font-sans text-xs">User sends <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">/start</code> command</p>
                </div>

                <div className="h-6 w-0.5 bg-indigo-500 ml-8 relative z-10" />

                <div className="relative z-10 bg-slate-900 border-2 border-purple-500 rounded-xl p-4 shadow-md space-y-1.5 max-w-sm ml-4">
                  <div className="flex items-center justify-between text-purple-400 font-bold text-[11px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Sparkles size={14} /> AI ASSISTANT NODE</span>
                    <span className="text-slate-400">ChatGPT 4o</span>
                  </div>
                  <p className="text-slate-200 font-sans text-xs">Qualify lead &amp; recommend product package</p>
                </div>

                <div className="h-6 w-0.5 bg-purple-500 ml-12 relative z-10" />

                <div className="relative z-10 bg-slate-900 border-2 border-emerald-500 rounded-xl p-4 shadow-md space-y-1.5 max-w-sm ml-8">
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><CreditCard size={14} /> STRIPE PAYMENT NODE</span>
                    <span className="text-slate-400">Stripe API</span>
                  </div>
                  <p className="text-slate-200 font-sans text-xs">Checkout $49 Pro License &amp; Auto-tag Subscriber</p>
                </div>

              </div>

            </div>
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

      </main>

      <footer className="bg-[#0A0A0A] text-[#F2EBDD] w-full py-12 px-6 lg:px-16 border-t-8 border-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="flex flex-col gap-3">
            <Link to={ROUTES.LANDING} className="flex items-center">
              <img src={logo} alt="Launchly Logo" className="h-9 w-auto object-contain brightness-200 invert" />
            </Link>
            <span className="font-['JetBrains_Mono',monospace] text-xs text-slate-400">
              © {new Date().getFullYear()} {t('landing.footer.copyright', 'Launchly Inc. All rights reserved.')}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              to={ROUTES.TERMS} 
              className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              {t('landing.footer.terms', 'Terms of Service')}
            </Link>
            <Link 
              to={ROUTES.PRIVACY} 
              className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              {t('landing.footer.privacy', 'Privacy Policy')}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              to={ROUTES.BLOG} 
              className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              {t('landing.footer.blog', 'Blog')}
            </Link>
            <a 
              href="mailto:support@launchly.app" 
              className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
            >
              {t('landing.footer.support', 'Support & Contact')}
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>{t('landing.footer.gdpr', 'GDPR Compliant')}</span>
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Lock size={16} className="text-indigo-400" />
              <span>{t('landing.footer.ssl', 'SSL Encrypted')}</span>
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
