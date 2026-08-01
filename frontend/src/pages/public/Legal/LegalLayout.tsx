import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import { useTranslation } from '../../../i18n/config';
import logo from '../../../assets/images/logo.png';
import { ShieldCheck, Lock } from 'lucide-react';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  effectiveDate: string;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ children, title, effectiveDate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navItems = [
    { label: t('legal.nav.terms', 'Terms of Service'), path: ROUTES.TERMS },
    { label: t('legal.nav.privacy', 'Privacy Policy'), path: ROUTES.PRIVACY },
    { label: t('legal.nav.acceptable_use', 'Acceptable Use Policy'), path: ROUTES.ACCEPTABLE_USE },
    { label: t('legal.nav.ai_terms', 'AI Supplementary Terms'), path: ROUTES.AI_TERMS },
  ];

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
            <Link 
              to={`${ROUTES.LANDING}#features`} 
              className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
            >
              {t('landing.nav.product', 'PRODUCT')}
            </Link>
            <Link 
              to={`${ROUTES.LANDING}#features`} 
              className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
            >
              {t('landing.nav.features', 'FEATURES')}
            </Link>
            <Link 
              to={`${ROUTES.LANDING}#pricing`} 
              className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
            >
              {t('landing.nav.pricing', 'PRICING')}
            </Link>
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

        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <aside className="lg:col-span-3 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-4 lg:sticky lg:top-28">
              <div className="font-['JetBrains_Mono',monospace] text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 px-2 border-b border-[#0A0A0A]/20 pb-2">
                {t('legal.nav.section_title', 'Legal Documents')}
              </div>
              <nav className="space-y-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-3.5 py-2.5 border-2 transition-all text-left ${
                        isActive
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] font-black shadow-[2px_2px_0px_#0A0A0A]'
                          : 'border-transparent text-[#0A0A0A] hover:border-[#0A0A0A] hover:bg-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <main className="lg:col-span-9 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] p-6 sm:p-10 lg:p-12">
              
              <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-4 mb-8 font-['JetBrains_Mono',monospace] text-xs font-bold tracking-widest text-[#0A0A0A] uppercase">
                <span>{t('legal.effective_date', { date: effectiveDate })}</span>
                <span className="bg-[#0A0A0A] text-[#F2EBDD] px-2.5 py-0.5 text-[10px]">{t('legal.badge', 'LAUNCHLY LEGAL')}</span>
              </div>

              <h1 className="font-['Anybody',sans-serif] text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A0A0A] uppercase tracking-tight mb-8 leading-tight">
                {title}
              </h1>

              <div className="space-y-6 font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] leading-relaxed font-medium">
                {children}
              </div>

            </main>

          </div>
        </div>
      </div>

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

export default LegalLayout;
