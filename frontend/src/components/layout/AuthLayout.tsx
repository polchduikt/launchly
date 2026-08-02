import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { ROUTES } from '../../routes/paths';
import { useTranslation } from '../../i18n/config';
import { useAuthStore } from '../../store/useAuthStore';
import { ChevronDown } from 'lucide-react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  return (
    <div className="bg-[#F2EBDD] text-[#0A0A0A] font-['Geist',sans-serif] antialiased min-h-screen w-full relative overflow-y-auto selection:bg-[#0A0A0A] selection:text-[#F2EBDD]">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(#0A0A0A_1px,transparent_1px)] [background-size:18px_18px]" />
      <header className="relative z-20 h-20 flex items-center justify-between px-6 md:px-12 lg:px-16 border-b-2 border-[#0A0A0A] shadow-[0_4px_0px_#0A0A0A] bg-[#F2EBDD]/85 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.LANDING} className="flex items-center select-none">
            <img src={logo} alt="Launchly" className="h-10 sm:h-12 w-auto object-contain cursor-pointer" />
          </Link>

          <div className="relative ml-2">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
              className="flex items-center gap-1 font-['JetBrains_Mono',monospace] text-sm font-bold text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-0.5 transition-all cursor-pointer select-none"
            >
              <span>{currentLanguage === 'uk' ? 'Uk' : 'En'}</span>
              <ChevronDown size={12} strokeWidth={3} />
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
          <a href="/#features" className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1">
            {t('landing.nav.product', 'PRODUCT')}
          </a>
          <a href="/#features" className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1">
            {t('landing.nav.features', 'FEATURES')}
          </a>
          <a href="/#pricing" className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1">
            {t('landing.nav.pricing', 'PRICING')}
          </a>
          <Link to={ROUTES.BLOG} className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1">
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

      <main className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};
