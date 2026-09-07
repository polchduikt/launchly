import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import logoL from '../../assets/images/logo-l.png';
import { ROUTES } from '../../routes/paths';
import {
  BarChart3,
  MessageSquare,
  Users,
  Workflow,
  Radio,
  Terminal,
  LogOut,
  ChevronRight,
  Globe
} from 'lucide-react';
import { useTranslation } from '../../i18n/config';
import { isValidAvatarUrl, getInitials } from '../../utils/avatar';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface AdminLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, noPadding = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { currentLanguage, changeLanguage, t } = useTranslation();
  const [avatarError, setAvatarError] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'ROLE_ADMIN';
  const isManager = user.role === 'ROLE_MANAGER';

  const navItems = [
    {
      id: 'stats',
      label: t('admin.statistics'),
      path: ROUTES.ADMIN_STATS,
      icon: BarChart3,
      allowed: true,
    },
    {
      id: 'chats',
      label: t('admin.support_chats'),
      path: ROUTES.ADMIN_CHATS,
      icon: MessageSquare,
      allowed: isManager,
    },
    {
      id: 'blog',
      label: t('admin.blog_nav', 'Блог'),
      path: ROUTES.ADMIN_BLOG,
      icon: Globe,
      allowed: true,
    },
    {
      id: 'users',
      label: t('admin.users'),
      path: ROUTES.ADMIN_USERS,
      icon: Users,
      allowed: true,
    },
    {
      id: 'automations',
      label: t('admin.automations'),
      path: ROUTES.ADMIN_AUTOMATIONS,
      icon: Workflow,
      allowed: true,
    },
    {
      id: 'broadcasts',
      label: t('admin.broadcasts'),
      path: ROUTES.ADMIN_BROADCASTS,
      icon: Radio,
      allowed: true,
    },
    {
      id: 'logs',
      label: t('admin.system_logs'),
      path: ROUTES.ADMIN_LOGS,
      icon: Terminal,
      allowed: isAdmin,
    },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case ROUTES.ADMIN_CHATS:
        return t('admin.chats_title');
      case ROUTES.ADMIN_BLOG:
        return t('admin.blog_title', 'Керування блогом');
      case ROUTES.ADMIN_USERS:
        return t('admin.users_title');
      case ROUTES.ADMIN_AUTOMATIONS:
        return t('admin.automations_title');
      case ROUTES.ADMIN_BROADCASTS:
        return t('admin.broadcasts_title');
      case ROUTES.ADMIN_LOGS:
        return t('admin.logs_title');
      case ROUTES.ADMIN_STATS:
      case ROUTES.ADMIN_HOME:
      default:
        return t('admin.system_stats_title');
    }
  };

  const handleLanguageSelect = (selectedLang: 'uk' | 'en') => {
    if (selectedLang !== currentLanguage) {
      changeLanguage(selectedLang);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex h-screen bg-canvas text-ink font-['JetBrains_Mono',monospace] overflow-hidden select-none">
      <aside className="w-64 bg-canvas border-r-4 border-ink flex flex-col justify-between h-full z-30 shrink-0">
        <div>
          <div className="h-16 px-5 flex items-center border-b-4 border-ink bg-canvas">
            <div className="flex items-center space-x-3">
              <img src={logoL} alt="Launchly Logo" className="h-8 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-['Anybody',sans-serif] font-black text-sm text-ink tracking-tight uppercase">Launchly</span>
                <span className="text-[9px] uppercase font-black text-slate-700 tracking-wider font-['Anybody',sans-serif]">{t('admin.control_panel')}</span>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            {navItems.filter(item => item.allowed).map((item) => {
              const isActive = location.pathname === item.path || (item.path === ROUTES.ADMIN_STATS && location.pathname === ROUTES.ADMIN_HOME);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all duration-150 border-2 ${
                    isActive
                      ? 'bg-ink text-canvas border-ink shadow-brutal-md'
                      : 'text-ink border-transparent hover:bg-white hover:border-ink'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent size={18} className={isActive ? 'text-canvas' : 'text-ink'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-canvas" />}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t-4 border-ink bg-canvas">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {isValidAvatarUrl(user.avatar) && !avatarError ? (
                <img
                  src={user.avatar!}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-8 h-8 rounded-full border-2 border-ink object-cover shrink-0 select-none"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white border-2 border-ink flex items-center justify-center text-ink font-black text-xs shrink-0 select-none">
                  {getInitials(user.name, 'A')}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="text-xs font-bold text-ink truncate">{user.name}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white border border-ink text-ink text-[9px] font-black uppercase shrink-0">
                      Super Admin
                    </span>
                  )}
                  {isManager && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white border border-ink text-ink text-[9px] font-black uppercase shrink-0">
                      Manager
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-700 font-bold truncate">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl border-2 border-ink bg-white text-ink hover:bg-ink hover:text-canvas transition-all cursor-pointer shrink-0 ml-1"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full bg-canvas overflow-hidden">
        <header className="h-16 border-b-4 border-ink px-8 flex items-center justify-between bg-canvas shrink-0 font-['JetBrains_Mono',monospace]">
          <div className="flex items-center space-x-3">
            <h1 className="font-['Anybody',sans-serif] text-base font-black uppercase text-ink tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white p-1 rounded-xl border-2 border-ink shadow-brutal-sm">
              <Globe size={14} className="text-ink ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => handleLanguageSelect('uk')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  currentLanguage === 'uk'
                    ? 'bg-ink text-canvas'
                    : 'text-ink hover:bg-canvas'
                }`}
              >
                UK
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  currentLanguage === 'en'
                    ? 'bg-ink text-canvas'
                    : 'text-ink hover:bg-canvas'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto bg-canvas text-ink ${noPadding ? 'p-0 flex h-full min-h-0 overflow-hidden' : 'p-8'}`}>
          <ErrorBoundary
            inline
            fallbackTitle="Admin View Error"
            fallbackDescription="An unexpected error occurred in this view. Click retry to attempt reloading."
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
