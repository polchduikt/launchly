import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { SETTINGS_SECTIONS } from '../config/settingsSections';
import { useLogoutMutation } from '../../auth/hooks/useLogoutMutation';
import { useBotStore } from '../../../store/useBotStore';
import { IntegrationsPanel } from '../../integration/components/IntegrationsPanel';
import { SubscriptionsPanel } from '../../billing/components/SubscriptionsPanel';
import { TelegramSettingsPanel } from '../components/TelegramSettingsPanel';
import { PaymentsPanel } from '../../billing/components/PaymentsPanel';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { TeamMembersPanel } from '../components/TeamMembersPanel';
import { DisplayPanel } from '../components/DisplayPanel';
import { UserFieldsPanel } from '../components/UserFieldsPanel';
import { TagsSettingsPanel } from '../components/TagsSettingsPanel';
import { useAuthStore } from '../../../store/useAuthStore';
import { TelegramLoginModal } from '../../auth/components/TelegramLoginModal';
import { unlinkTelegramApi } from '../../auth/api/auth';
import { Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam || (location.pathname === '/integrations' ? 'integrations' : 'general')
  );
  const [timeZone, setTimeZone] = useState('UTC+07:00');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const logoutMutation = useLogoutMutation();

  const { user, setUser } = useAuthStore();
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);

  const handleUnlinkTelegram = async () => {
    try {
      await unlinkTelegramApi();
      if (user) {
        setUser({ ...user, telegramUserId: null, telegramUsername: null });
      }
    } catch (err) {
      console.error('Failed to unlink telegram', err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('googleAuth') === 'success') {
      setShowSuccessBanner(true);
      setActiveTab('integrations');
      navigate('/settings?tab=integrations', { replace: true });
    } else {
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      } else if (location.pathname === '/integrations') {
        setActiveTab('integrations');
      } else {
        setActiveTab('general');
      }
    }
  }, [location.pathname, location.search, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-screen bg-slate-50 font-sans md:pl-60">
        <aside className="w-60 bg-slate-50 border-r border-slate-200 p-4 shrink-0 hidden md:block fixed left-16 top-0 bottom-0 overflow-y-auto pb-10 z-20">
          <div className="space-y-6">
            {SETTINGS_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 select-none">
                  {section.title}
                </h3>
                <nav className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        navigate(`/settings?tab=${item.id}`, { replace: true });
                      }}
                      className={`w-full flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all ${
                        activeTab === item.id
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          </div>

          {showSuccessBanner && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">Google Sheets account successfully connected!</span>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-emerald-500 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {activeTab === 'general' ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm divide-y divide-slate-100 overflow-hidden">

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Account Time Zone</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full md:max-w-md px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all bg-slate-50/50"
                  >
                    <option value="UTC+07:00">(UTC+07:00) - Barnaul Time</option>
                    <option value="UTC+03:00">(UTC+03:00) - Kyiv, Moscow Time</option>
                    <option value="UTC+00:00">(UTC+00:00) - London, GMT</option>
                    <option value="UTC-05:00">(UTC-05:00) - New York, EST</option>
                  </select>
                  <div className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    All the data in Launchly will be displayed and exported according to this timezone.{' '}
                    <button className="text-indigo-600 font-bold hover:underline">Learn more</button>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Clone to Another Account</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100">
                    Clone This Account
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Copy all content to another account
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Use as Template</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100">
                    Create Account Template
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Create a snapshot of this account and share it via link
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Leave Account</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-5 py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl transition-all select-none cursor-not-allowed border border-slate-200">
                    Leave
                  </button>
                  <p className="text-xs text-slate-500 leading-relaxed md:max-w-xs">
                    Transfer your ownership to another team member if you want to leave this account
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Sign Out</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <span>Sign Out</span>
                    )}
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Sign out of your Launchly account from this device
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-rose-600">Delete Account</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-5 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer">
                    Delete
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Continue to account deletion
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'fields' ? (
            <UserFieldsPanel />
          ) : activeTab === 'tags' ? (
            <TagsSettingsPanel />
          ) : activeTab === 'integrations' ? (
            activeBotId ? (
              <IntegrationsPanel botId={activeBotId} onOpenPricing={() => setShowPricing(true)} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 shadow-sm select-none">
                <AlertCircle size={40} className="text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No active bot found</h3>
                <p className="text-xs text-slate-400">Please connect a Telegram bot first to access integrations.</p>
              </div>
            )
          ) : activeTab === 'subscriptions' ? (
            <SubscriptionsPanel />
          ) : activeTab === 'payments' ? (
            <PaymentsPanel />
          ) : activeTab === 'notifications' ? (
            <NotificationsPanel />
          ) : activeTab === 'members' ? (
            <TeamMembersPanel />
          ) : activeTab === 'display' ? (
            <DisplayPanel />
          ) : activeTab === 'telegram' ? (
            <TelegramSettingsPanel />
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center text-sm text-slate-400">
              This section is currently under development. Settings will be linked here soon.
            </div>
          )}
        </div>
      </div>
      <TelegramLoginModal isOpen={isTelegramOpen} onClose={() => setIsTelegramOpen(false)} onSuccess={() => {}} />
    </DashboardLayout>
  );
};
