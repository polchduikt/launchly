import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import logoL from '../../../assets/logo-l.png';
import { ROUTES } from '../../../constants/routes';
import {
  BarChart3,
  Users,
  Workflow,
  Radio,
  Terminal,
  LogOut,
  ChevronRight,
  Globe
} from 'lucide-react';
import { getLanguage, changeLanguage, t } from '../../../i18n';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const currentLang = getLanguage();
  const [lang, setLang] = useState<'uk' | 'en'>(currentLang as 'uk' | 'en');
  const [avatarError, setAvatarError] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'ROLE_ADMIN';

  const navItems = [
    {
      id: 'stats',
      label: t('admin.statistics'),
      path: ROUTES.ADMIN_STATS,
      icon: BarChart3,
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

  const handleLanguageSelect = (selectedLang: 'uk' | 'en') => {
    if (selectedLang !== lang) {
      changeLanguage(selectedLang);
      setLang(selectedLang);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden select-none">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full z-30 shrink-0">
        <div>
          <div className="h-16 px-5 flex items-center border-b border-slate-100 bg-white">
            <div className="flex items-center space-x-3">
              <img src={logoL} alt="Launchly Logo" className="h-8 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">Launchly</span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">{t('admin.control_panel')}</span>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t('admin.management_modules')}
            </div>
            {navItems.filter(item => item.allowed).map((item) => {
              const isActive = location.pathname === item.path || (item.path === ROUTES.ADMIN_STATS && location.pathname === ROUTES.ADMIN_HOME);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-indigo-600" />}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {user.avatar && !avatarError ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-xs shrink-0">
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-semibold truncate">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50 overflow-hidden">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {t('admin.control_panel')}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
              <Globe size={14} className="text-slate-400 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => handleLanguageSelect('uk')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  lang === 'uk'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                UK
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSelect('en')}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 text-slate-800">
          {children}
        </main>
      </div>
    </div>
  );
};
