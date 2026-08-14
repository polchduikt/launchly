import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import logoL from '../../assets/images/logo-l.png';
import { NAV_ITEMS } from './config/navItems';
import { useTranslation } from '../../i18n/config';
import type { DashboardLayoutProps } from '../../types/shared';
import { HelpCircle, Layers, ChevronDown } from 'lucide-react';
import { useAllBotUsersQuery } from '../../hooks/crm/useCrmQueries';
import { useSubscriptionQuery } from '../../hooks/bot/useBillingQueries';
import { PendingInvitationsBanner } from '../common/PendingInvitationsBanner';
import { PricingModal } from '../common/PricingModal';
import { ManageSignInOptionsModal } from '../common/ManageSignInOptionsModal';
import { SafeAvatar } from '../common/SafeAvatar';
import { ROUTES } from '../../routes/paths';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { currentLanguage: language, changeLanguage, t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const logout = useAuthStore((state) => state.logout);
  const [showPricing, setShowPricing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [] } = useAllBotUsersQuery();
  const { data: subscription } = useSubscriptionQuery();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (helpMenuRef.current && !helpMenuRef.current.contains(event.target as Node)) {
        setShowHelpMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);

  if (!user) return null;

  const planName = subscription?.plan?.displayName || 'Free';
  const maxBotUsers = subscription?.plan?.maxBotUsers || 100;
  const contactsCount = contacts?.length || 0;
  const percentage = Math.min(100, Math.round((contactsCount / maxBotUsers) * 100));

  return (
    <div data-theme={theme} className="dashboard-themed flex h-screen bg-[#F2EBDD] text-[#0A0A0A] font-['Geist',sans-serif] antialiased overflow-hidden selection:bg-[#0A0A0A] selection:text-[#F2EBDD] relative">
      
      <aside className="w-16 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] flex flex-col justify-between h-full z-30 shrink-0 relative select-none">
        <div className="flex flex-col overflow-y-auto flex-1">
          <div className="h-16 flex items-center justify-center border-b-2 border-[#0A0A0A]">
            <Link to={ROUTES.HOME} className="flex items-center">
              <img src={logoL} alt="Launchly Logo" className="h-8 w-auto object-contain" />
            </Link>
          </div>

          <nav className="flex-1 py-4 flex flex-col items-center gap-2.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const localizedLabel = t(item.label.toLowerCase().replace(/\s+/g, '_'));
              
              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 cursor-not-allowed select-none opacity-50"
                    title={`${localizedLabel} (Coming Soon)`}
                  >
                    <Icon size={18} />
                  </div>
                );
              }
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  title={localizedLabel}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                      : 'text-[#0A0A0A] hover:bg-[#0A0A0A]/10 border-2 border-transparent'
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t-2 border-[#0A0A0A] flex flex-col items-center gap-3.5 bg-[#F2EBDD]">
          
          <div ref={profileMenuRef} className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="cursor-pointer hover:opacity-90 transition-all shrink-0"
            >
              <SafeAvatar
                src={user?.avatar}
                name={user?.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-[#0A0A0A]"
                fallbackClassName="w-9 h-9 rounded-full bg-white text-[#0A0A0A] font-bold text-sm flex items-center justify-center border-2 border-[#0A0A0A] shrink-0"
              />
            </div>

            {showProfileMenu && (
              <div className="absolute left-14 bottom-[-10px] w-72 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] z-50 p-4 space-y-4 font-['JetBrains_Mono',monospace] text-left">
                
                <div className="flex items-center gap-3.5 pb-1">
                  <SafeAvatar
                    src={user?.avatar}
                    name={user?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#0A0A0A] shrink-0"
                    fallbackClassName="w-12 h-12 rounded-full bg-white text-[#0A0A0A] font-bold text-base flex items-center justify-center border-2 border-[#0A0A0A] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#0A0A0A] truncate leading-snug">{user.name}</p>
                    <p className="text-[10px] text-slate-600 font-bold truncate max-w-[150px]">{user.email || 'Account email'}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER') && (
                    <button
                      onClick={() => navigate(ROUTES.ADMIN_HOME)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] transition-all text-left cursor-pointer uppercase tracking-wider mb-2"
                    >
                      <HelpCircle size={16} className="text-[#F2EBDD] shrink-0" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  <div className="pt-3 border-t-2 border-[#0A0A0A] flex items-center justify-between px-1">
                    <span 
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/templates');
                      }}
                      className="text-xs font-bold text-[#0A0A0A] hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      {t('common.my_templates', 'My Templates')}
                    </span>
                    <div 
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/templates');
                      }}
                      className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-white flex items-center justify-center text-[#0A0A0A] shrink-0 shadow-[1px_1px_0px_#0A0A0A] cursor-pointer transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                    >
                      <Layers size={12} />
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-[#0A0A0A] flex items-center justify-between px-1">
                    <span 
                      onClick={() => setShowSignInOptions(true)}
                      className="text-xs font-bold text-[#0A0A0A] hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      {t('common.add_signin_options', 'Add sign-in options')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowSignInOptions(true)}
                        className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-white flex items-center justify-center cursor-pointer transition-all shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                        title="Google"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowSignInOptions(true)}
                        className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-white flex items-center justify-center cursor-pointer transition-all shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                        title="Telegram"
                      >
                        <svg className="w-3.5 h-3.5 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.27-2.03-.49-.82-.27-1.47-.41-1.42-.87.03-.24.36-.49.99-.74 3.89-1.69 6.48-2.8 7.77-3.32 3.7-1.52 4.47-1.78 4.97-1.79.11 0 .36.03.52.16.14.12.18.28.2.45-.02.07-.02.13-.02.2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-[#0A0A0A] flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#0A0A0A] uppercase">{t('common.theme', 'Theme:')}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTheme('yellow')}
                        className={`w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-[#F2EBDD] flex items-center justify-center cursor-pointer transition-all shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                          theme === 'yellow' ? 'ring-2 ring-[#0A0A0A] ring-offset-1 scale-105' : ''
                        }`}
                        title={t('common.theme_yellow', 'Yellow')}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#0A0A0A]" />
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-white flex items-center justify-center cursor-pointer transition-all shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                          theme === 'light' ? 'ring-2 ring-[#0A0A0A] ring-offset-1 scale-105' : ''
                        }`}
                        title={t('common.theme_light', 'Light')}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-[#0A0A0A]" />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-[#0A0A0A] flex items-center justify-center cursor-pointer transition-all shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                          theme === 'dark' ? 'ring-2 ring-amber-400 ring-offset-1 scale-105' : ''
                        }`}
                        title={t('common.theme_dark', 'Dark')}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-500" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-[#0A0A0A] flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#0A0A0A] uppercase">{t('common.language', 'Language')}</span>
                    <div className="relative">
                      <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="text-xs font-black uppercase text-[#0A0A0A] border-2 border-[#0A0A0A] px-2.5 py-1 bg-white shadow-[1px_1px_0px_#0A0A0A] cursor-pointer flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
                      >
                        <span>{language.toUpperCase()}</span>
                        <ChevronDown size={12} className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showLangMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-20 bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] z-50 overflow-hidden divide-y-2 divide-[#0A0A0A]">
                          <button
                            onClick={() => {
                              changeLanguage('en');
                              setShowLangMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-black uppercase transition-colors cursor-pointer ${
                              language === 'en' ? 'bg-amber-300 text-[#0A0A0A]' : 'bg-white hover:bg-amber-100 text-[#0A0A0A]'
                            }`}
                          >
                            EN
                          </button>
                          <button
                            onClick={() => {
                              changeLanguage('uk');
                              setShowLangMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-black uppercase transition-colors cursor-pointer ${
                              language === 'uk' ? 'bg-amber-300 text-[#0A0A0A]' : 'bg-white hover:bg-amber-100 text-[#0A0A0A]'
                            }`}
                          >
                            UK
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => logout()}
                    className="w-full text-center py-2 text-xs font-black uppercase text-rose-600 hover:bg-rose-600 hover:text-white border-2 border-rose-600 transition-all cursor-pointer"
                  >
                    {t('common.sign_out', 'SIGN OUT')}
                  </button>
                </div>

              </div>
            )}
          </div>

          <div ref={helpMenuRef} className="relative">
            <button
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] font-bold text-xs hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors cursor-pointer"
              title="Help & Legal"
            >
              ?
            </button>

            {showHelpMenu && (
              <div className="absolute left-14 bottom-0 w-60 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] z-50 p-3 space-y-2 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider">
                <Link
                  to={ROUTES.TERMS}
                  className="block px-3 py-2 border-2 border-transparent hover:border-[#0A0A0A] hover:bg-white transition-all text-[#0A0A0A]"
                >
                  Terms of Service
                </Link>
                <Link
                  to={ROUTES.PRIVACY}
                  className="block px-3 py-2 border-2 border-transparent hover:border-[#0A0A0A] hover:bg-white transition-all text-[#0A0A0A]"
                >
                  Privacy Policy
                </Link>
                <Link
                  to={ROUTES.FAQ}
                  className="block px-3 py-2 border-2 border-transparent hover:border-[#0A0A0A] hover:bg-white transition-all text-[#0A0A0A]"
                >
                  FAQ &amp; Guides
                </Link>
              </div>
            )}
          </div>

          <div
            onClick={() => setShowPricing(true)}
            className="relative group flex items-center justify-center cursor-pointer select-none"
          >
            <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-300"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-500 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>

            <div className="absolute left-14 bottom-1/2 translate-y-1/2 hidden group-hover:flex flex-col bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] p-3 z-50 min-w-[160px] pointer-events-none select-none font-['JetBrains_Mono',monospace]">
              <div className="text-[#0A0A0A]/70 text-[11px] font-bold uppercase leading-none">
                {planName} contacts limit
              </div>
              <div className="text-[#0A0A0A] text-lg font-black mt-1.5 leading-none">
                {contactsCount}/{maxBotUsers}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowPricing(true)}
            className="px-2 py-0.5 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest border border-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            {planName}
          </button>

        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <PendingInvitationsBanner />
        <main className="flex-1 overflow-y-auto custom-scrollbar z-10 relative">
          {children}
        </main>
      </div>

      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      <ManageSignInOptionsModal isOpen={showSignInOptions} onClose={() => setShowSignInOptions(false)} />
    </div>
  );
};
