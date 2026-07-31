import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import logoL from '../../assets/images/logo-l.png';
import { NAV_ITEMS } from './config/navItems';
import { useTranslation } from '../../i18n/config';
import type { DashboardLayoutProps } from '../../types/shared';
import { HelpCircle, BookOpen, ClipboardList, FileText } from 'lucide-react';
import { useBotStore } from '../../store/useBotStore';
import { useBotUsersQuery } from '../../hooks/crm/useCrmQueries';
import { useSubscriptionQuery } from '../../hooks/bot/useBillingQueries';
import { PricingModal } from '../common/PricingModal';
import { useBotsQuery } from '../../hooks/bot/useBotsQuery';
import { ManageSignInOptionsModal } from '../common/ManageSignInOptionsModal';
import {
  getMyPendingInvitationsApi,
  acceptInvitationApi,
  declineInvitationApi
} from '../../api/teamApi';
import type { TeamMemberResponse } from '../../api/teamApi';
import { isValidAvatarUrl, getInitials } from '../../utils/avatar';
import { ROUTES } from '../../routes/paths';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { currentLanguage: language, changeLanguage, t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const [showPricing, setShowPricing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<TeamMemberResponse[]>([]);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const activeBotId = useBotStore((state) => state.activeBotId);

  const fetchPendingInvites = async () => {
    try {
      const data = await getMyPendingInvitationsApi();
      setPendingInvites(data);
    } catch (err) {
      console.error(err);
    }
  };

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
    fetchPendingInvites();
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);

  const botsQuery = useBotsQuery(true);
  const bots = botsQuery.data || [];
  const refetchBots = botsQuery.refetch;

  const handleAcceptInvite = async (inviteId: number) => {
    try {
      await acceptInvitationApi(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      refetchBots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineInvite = async (inviteId: number) => {
    try {
      await declineInvitationApi(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err) {
      console.error(err);
    }
  };

  const targetBotId = activeBotId || (bots[0]?.id || 0);
  const { data: contacts = [] } = useBotUsersQuery(targetBotId, !!targetBotId);
  const { data: subscription } = useSubscriptionQuery();
  if (!user) return null;
  const planName = subscription?.plan?.displayName || 'Free';
  const maxBotUsers = subscription?.plan?.maxBotUsers || 100;
  const contactsCount = contacts?.length || 0;
  const percentage = Math.min(100, Math.round((contactsCount / maxBotUsers) * 100));
  const isFreePlan = (subscription?.plan?.name || 'FREE').toUpperCase() === 'FREE';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden">
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col justify-between h-full z-30 shrink-0">
        <div className="flex flex-col overflow-y-auto flex-1">
          <div className="h-16 flex items-center justify-center border-b border-slate-100 select-none">
            <img src={logoL} alt="L Logo" className="h-8 w-auto object-contain" />
          </div>

          <nav className="flex-1 py-4 flex flex-col items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const localizedLabel = t(item.label.toLowerCase().replace(/\s+/g, '_'));
              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 cursor-not-allowed select-none"
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
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100 flex flex-col items-center gap-4 bg-slate-50/50 select-none">
          <div ref={profileMenuRef} className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm overflow-hidden select-none shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              {isValidAvatarUrl(user.avatar) ? (
                <img src={user.avatar!} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
            </div>

            {showProfileMenu && (
              <div className="absolute left-14 bottom-[-40px] w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-4 animate-in slide-in-from-left-2 duration-150 text-left">
                <div className="absolute left-[-6px] bottom-[52px] w-2.5 h-2.5 bg-white border-l border-b border-slate-200 rotate-45"></div>

                <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {isValidAvatarUrl(user.avatar) ? (
                      <img src={user.avatar!} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-base text-slate-700 bg-slate-200">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-800 truncate leading-snug">{user.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 group cursor-pointer">
                      <p className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{user.email || 'Account email unavailable'}</p>
                      <svg className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-650 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER') && (
                    <button
                      onClick={() => navigate(ROUTES.ADMIN_HOME)}
                      className="w-full flex items-center gap-3 px-2.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all text-left cursor-pointer"
                    >
                      <HelpCircle size={16} className="text-purple-600 shrink-0" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  <button className="w-full flex items-center gap-3 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-650 rounded-xl transition-all text-left cursor-pointer">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('common.manage_accounts')}
                  </button>
                  <button className="w-full flex items-center gap-3 px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-650 rounded-xl transition-all text-left cursor-pointer">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('common.message_reports')}
                  </button>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 px-2">
                  <span className="text-xs font-bold text-slate-400">{t('common.language')}</span>
                  <select
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value as 'en' | 'uk')}
                    className="text-xs font-bold text-slate-700 border border-slate-200 hover:border-slate-355 rounded-xl px-2.5 py-1 bg-white outline-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="uk">Ukrainian</option>
                  </select>
                </div>

                 <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between px-2">
                    <span
                      onClick={() => setShowSignInOptions(true)}
                      className="text-xs font-bold text-slate-700 cursor-pointer hover:text-indigo-650 transition-colors"
                    >
                      {t('common.add_signin_options')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSignInOptions(true)}
                        className="w-6 h-6 rounded-full border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-center cursor-pointer transition-all shadow-sm"
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
                        className="w-6 h-6 rounded-full border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-center cursor-pointer transition-all shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.27-2.03-.49-.82-.27-1.47-.41-1.42-.87.03-.24.36-.49.99-.74 3.89-1.69 6.48-2.8 7.77-3.32 3.7-1.52 4.47-1.78 4.97-1.79.11 0 .36.03.52.16.14.12.18.28.2.45-.02.07-.02.13-.02.2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('common.log_out')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div ref={helpMenuRef} className="relative">
            <button
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              title={t('help.menu.tooltip')}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <HelpCircle size={20} />
            </button>

            {showHelpMenu && (
              <div className="absolute left-14 bottom-[-10px] w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in slide-in-from-left-2 duration-150 text-left">
                <div className="absolute left-[-6px] bottom-[20px] w-2.5 h-2.5 bg-white border-l border-b border-slate-200 rotate-45"></div>

                <div className="space-y-1.5 pb-2 border-b border-slate-100">
                  <a
                    href="https://knowledgebase.launchly.so"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-655 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <BookOpen size={16} className="text-slate-400 shrink-0" />
                    {t('help.menu.knowledge_base')}
                  </a>
                  <a
                    href="https://changelog.launchly.so"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-655 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <ClipboardList size={16} className="text-slate-400 shrink-0" />
                    {t('help.menu.changelog')}
                  </a>
                  <Link
                    to={ROUTES.BLOG}
                    target="_blank"
                    className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-655 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <FileText size={16} className="text-slate-400 shrink-0" />
                    {t('help.menu.blog')}
                  </Link>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <Link
                    to={ROUTES.TERMS}
                    target="_blank"
                    className="block px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-indigo-655 transition-colors text-left"
                  >
                    {t('help.menu.terms')}
                  </Link>
                  <Link
                    to={ROUTES.PRIVACY}
                    target="_blank"
                    className="block px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-indigo-655 transition-colors text-left"
                  >
                    {t('help.menu.privacy_policy')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="w-8 border-t border-slate-200" />

          <div className="relative group flex items-center justify-center cursor-pointer">
            <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
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

            <div className="absolute left-14 bottom-1/2 translate-y-1/2 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-xl p-3 shadow-lg z-50 min-w-[160px] pointer-events-none select-none animate-fade-in">
              <div className="text-slate-500 text-[11px] font-medium leading-none">
                {planName} contacts limit
              </div>
              <div className="text-slate-800 text-lg font-bold mt-1.5 leading-none">
                {contactsCount}/{maxBotUsers}
              </div>
              <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-l border-b border-slate-200 rotate-45"></div>
            </div>
          </div>

          <button
            onClick={() => setShowPricing(true)}
            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-emerald-600/10 cursor-pointer text-center"
          >
            {isFreePlan ? 'PRO' : planName}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {pendingInvites.map((invite) => (
          <div key={invite.id} className="bg-indigo-600 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 z-40 select-none animate-in slide-in-from-top duration-300 shrink-0 text-left">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span>You have been invited to join the workspace <strong className="text-white underline">{invite.name}</strong> as <strong className="text-white uppercase">{invite.role}</strong>!</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAcceptInvite(invite.id)}
                className="px-4 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Accept Invite
              </button>
              <button
                onClick={() => handleDeclineInvite(invite.id)}
                className="px-4 py-1.5 bg-indigo-700/50 hover:bg-indigo-700/80 text-white border border-indigo-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
        <div className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </div>
      </main>
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      <ManageSignInOptionsModal isOpen={showSignInOptions} onClose={() => setShowSignInOptions(false)} />
    </div>
  );
};
