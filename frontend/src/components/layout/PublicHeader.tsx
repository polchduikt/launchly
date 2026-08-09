import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import logo from '../../assets/images/logo.png';
import { ROUTES } from '../../routes/paths';
import { useTranslation } from '../../i18n/config';

export interface PublicHeaderProps {
  simple?: boolean;
  redirectUrl?: string;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  simple = false,
  redirectUrl,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isBlogPage = location.pathname.startsWith(ROUTES.BLOG);
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isDarkHeader, setIsDarkHeader] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
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

  const navItems = [
    { href: '#features', key: 'landing.nav.features', fallback: 'FEATURES' },
    { href: '#ai-automation', key: 'landing.nav.ai', fallback: 'AI' },
    { href: '#how-it-works', key: 'landing.nav.how_it_works', fallback: 'HOW IT WORKS' },
    { href: '#use-cases', key: 'landing.nav.use_cases', fallback: 'SOLUTIONS' },
    { href: '#comparison', key: 'landing.nav.comparison', fallback: 'WHY US' },
    { href: '#testimonials', key: 'landing.nav.testimonials', fallback: 'REVIEWS' },
    { href: '#trust', key: 'landing.nav.trust', fallback: 'SECURITY' },
    { href: '#pricing', key: 'landing.nav.pricing', fallback: 'PRICING' },
    { href: '#faq', key: 'landing.nav.faq', fallback: 'FAQ' },
  ];

  return (
    <header
      className={`sticky top-0 w-full z-50 flex justify-between items-center h-20 px-4 sm:px-6 md:px-12 lg:px-16 backdrop-blur-md transition-all duration-300 ${
        isDarkHeader
          ? 'bg-[#0A0A0A]/95 border-b-2 border-[#F2EBDD] shadow-[0_4px_0px_#F2EBDD] text-[#F2EBDD]'
          : 'bg-[#F2EBDD]/90 border-b-2 border-[#0A0A0A] shadow-[0_4px_0px_#0A0A0A] text-[#0A0A0A]'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to={ROUTES.LANDING} className="flex items-center">
          <img
            src={logo}
            alt="Launchly Logo"
            className={`h-9 sm:h-11 w-auto object-contain cursor-pointer transition-all duration-300 ${
              isDarkHeader ? 'brightness-0 invert' : ''
            }`}
          />
        </Link>
        <div className="relative ml-1 sm:ml-2">
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
            className={`flex items-center gap-1 font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-bold border-b-2 pb-0.5 transition-all cursor-pointer select-none ${
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
                    ? 'hover:bg-[#F2EBDD] hover:text-[#0A0A0A] ' +
                      (currentLanguage === 'en' ? 'bg-[#F2EBDD]/20 font-black' : 'text-[#F2EBDD]')
                    : 'hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ' +
                      (currentLanguage === 'en' ? 'bg-[#0A0A0A]/10 font-black' : 'text-[#0A0A0A]')
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
                    ? 'hover:bg-[#F2EBDD] hover:text-[#0A0A0A] ' +
                      (currentLanguage === 'uk' ? 'bg-[#F2EBDD]/20 font-black' : 'text-[#F2EBDD]')
                    : 'hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ' +
                      (currentLanguage === 'uk' ? 'bg-[#0A0A0A]/10 font-black' : 'text-[#0A0A0A]')
                }`}
              >
                Uk
              </button>
            </div>
          )}
        </div>
      </div>

      {!simple && (
        <nav className="hidden lg:flex items-center gap-3 xl:gap-4 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={`${ROUTES.LANDING}${item.href}`}
              className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider transition-colors duration-200 px-2 py-1 ${
                isDarkHeader
                  ? 'text-[#F2EBDD] hover:bg-[#F2EBDD] hover:text-[#0A0A0A]'
                  : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
              }`}
            >
              {t(item.key, item.fallback)}
            </Link>
          ))}
          {!isBlogPage && (
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
          )}
        </nav>
      )}

      <div className="hidden lg:flex items-center gap-4">
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
              onClick={() => navigate(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : ROUTES.LOGIN)}
              className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:underline underline-offset-4 cursor-pointer ${
                isDarkHeader ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'
              }`}
            >
              {t('landing.nav.login', 'LOGIN')}
            </button>
            <button
              onClick={() => navigate(redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : ROUTES.REGISTER)}
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

      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`p-2 border-2 rounded-lg transition-all cursor-pointer ${
            isDarkHeader
              ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#F2EBDD]'
              : 'bg-[#F2EBDD] text-[#0A0A0A] border-[#0A0A0A]'
          }`}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className={`absolute top-full left-0 right-0 border-b-4 py-6 px-6 shadow-2xl flex flex-col space-y-4 lg:hidden z-50 transition-all ${
            isDarkHeader
              ? 'bg-[#0A0A0A] border-[#F2EBDD] text-[#F2EBDD]'
              : 'bg-[#F2EBDD] border-[#0A0A0A] text-[#0A0A0A]'
          }`}
        >
          {!simple && (
            <div className="flex flex-col space-y-3 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider border-b pb-4 border-current/20">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={`${ROUTES.LANDING}${item.href}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 hover:underline underline-offset-4 transition-all"
                >
                  {t(item.key, item.fallback)}
                </Link>
              ))}
              {!isBlogPage && (
                <Link
                  to={ROUTES.BLOG}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 hover:underline underline-offset-4 transition-all"
                >
                  {t('landing.nav.blog', 'BLOG')}
                </Link>
              )}
            </div>
          )}

          <div className="pt-2 flex flex-col space-y-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate(ROUTES.HOME);
                }}
                className={`w-full py-3 border-2 font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_currentColor] cursor-pointer ${
                  isDarkHeader ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD]' : 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]'
                }`}
              >
                {t('landing.nav.dashboard', 'DASHBOARD')}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : ROUTES.LOGIN);
                  }}
                  className={`py-3 border-2 font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider text-center cursor-pointer ${
                    isDarkHeader ? 'border-[#F2EBDD] text-[#F2EBDD]' : 'border-[#0A0A0A] text-[#0A0A0A]'
                  }`}
                >
                  {t('landing.nav.login', 'LOGIN')}
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate(redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : ROUTES.REGISTER);
                  }}
                  className={`py-3 border-2 font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_currentColor] text-center cursor-pointer ${
                    isDarkHeader ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD]' : 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]'
                  }`}
                >
                  {t('landing.nav.signup', 'SIGN UP')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
