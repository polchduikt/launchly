import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { SETTINGS_SECTIONS } from '../../../const/settingsSections';
import { useLogoutMutation } from '../../../hooks/auth/useLogoutMutation';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { IntegrationsPanel } from '../../../components/common/IntegrationsPanel';
import { SubscriptionsPanel } from '../../../components/common/SubscriptionsPanel';
import { TelegramSettingsPanel } from '../FlowBuilder/components/TelegramSettingsPanel';
import { PaymentsPanel } from '../../../components/common/PaymentsPanel';
import { NotificationsPanel } from '../FlowBuilder/components/NotificationsPanel';
import { TeamMembersPanel } from '../FlowBuilder/components/TeamMembersPanel';
import { DisplayPanel } from '../FlowBuilder/components/DisplayPanel';
import { UserFieldsPanel } from '../FlowBuilder/components/UserFieldsPanel';
import { TagsSettingsPanel } from '../FlowBuilder/components/TagsSettingsPanel';
import { TelegramLoginModal } from '../../public/Login/components/TelegramLoginModal';
import { PricingModal } from '../../../components/common/PricingModal';
import { LeaveAccountModal } from './components/LeaveAccountModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { CreateTemplateModal } from './components/CreateTemplateModal';
import { t } from '../../../i18n/config';
import { Loader2, AlertCircle, CheckCircle2, X, Check } from 'lucide-react';
import { TimezoneSelect } from '../../../components/ui/TimezoneSelect/TimezoneSelect';
import { updateTimezoneApi } from '../../../api/auth';
import { useAuthStore } from '../../../store/useAuthStore';

export const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();
  const botId = activeBotId || (bots[0]?.id || 0);
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam || (location.pathname === '/integrations' ? 'integrations' : 'general')
  );
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [timeZone, setTimeZone] = useState(user?.timezone || 'Europe/Kyiv');
  const [timezoneSaved, setTimezoneSaved] = useState(false);

  const timezoneMutation = useMutation({
    mutationFn: updateTimezoneApi,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setTimezoneSaved(true);
      setTimeout(() => setTimezoneSaved(false), 2000);
    },
  });

  // Sync with user when it loads
  useEffect(() => {
    if (user?.timezone) setTimeZone(user.timezone);
  }, [user?.timezone]);

  const handleTimezoneChange = (tz: string) => {
    setTimeZone(tz);
    timezoneMutation.mutate(tz);
  };
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const logoutMutation = useLogoutMutation();

  const [isTelegramOpen, setIsTelegramOpen] = useState(false);

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
      <div className="flex min-h-full w-full bg-[#F2EBDD] font-['Geist',sans-serif] items-stretch">
        <aside className="w-60 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] p-4 shrink-0 font-['JetBrains_Mono',monospace] self-stretch min-h-[calc(100vh-2rem)]">
          <div className="sticky top-4 space-y-6 pb-20 select-none">
            {SETTINGS_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-2 px-2 select-none">
                  {t('settings.section.' + section.title.toLowerCase())}
                </h3>
                <nav className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        navigate(`/settings?tab=${item.id}`, { replace: true });
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                        activeTab === item.id
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                          : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
                      }`}
                    >
                      {t('settings.section.' + item.id)}
                    </button>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#0A0A0A]">
            <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight select-none">{t('settings.settings')}</h1>
          </div>

          {showSuccessBanner && (
            <div className="bg-emerald-200 border-2 border-[#0A0A0A] text-[#0A0A0A] p-4 rounded-2xl flex items-center justify-between font-['JetBrains_Mono',monospace]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#0A0A0A] shrink-0" />
                <span className="text-xs font-bold">Google Sheets account successfully connected!</span>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-[#0A0A0A] hover:opacity-75 p-1 rounded-lg transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {activeTab === 'general' ? (
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl divide-y-2 divide-[#0A0A0A]/15 overflow-hidden font-['JetBrains_Mono',monospace]">

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-[#0A0A0A] uppercase">{t('settings.general.account_timezone')}</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-full md:max-w-[300px]">
                    <TimezoneSelect
                      value={timeZone}
                      onChange={handleTimezoneChange}
                      disabled={timezoneMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {timezoneMutation.isPending && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A]/50">
                        <Loader2 size={11} className="animate-spin" /> Збереження...
                      </span>
                    )}
                    {timezoneSaved && !timezoneMutation.isPending && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <Check size={11} /> Збережено
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed flex-1">
                    {t('settings.general.timezone_desc')}
                  </p>
                </div>
              </div>


              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-[#0A0A0A] uppercase">{t('settings.general.use_template')}</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-center">
                  <button
                    onClick={() => navigate('/templates/create')}
                    className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 min-w-[200px] h-10 px-5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
                  >
                    {t('settings.general.template_btn')}
                  </button>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed md:max-w-xs">
                    {t('settings.general.template_desc')}
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-[#0A0A0A] uppercase">{t('settings.general.leave_account')}</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-center">
                  <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 min-w-[200px] h-10 px-5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
                  >
                    {t('settings.general.leave_btn')}
                  </button>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed md:max-w-xs">
                    {t('settings.general.leave_desc')}
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-[#0A0A0A] uppercase">{t('settings.general.sign_out')}</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-center">
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 min-w-[200px] h-10 px-5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-bold rounded-xl transition-all cursor-pointer gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <span>{t('settings.general.sign_out')}</span>
                    )}
                  </button>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed md:max-w-xs">
                    {t('settings.general.sign_out_desc')}
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-rose-700 uppercase">{t('settings.general.delete_account')}</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-center">
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 min-w-[200px] h-10 px-5 bg-rose-200 hover:bg-rose-300 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {t('settings.general.delete_btn')}
                  </button>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed md:max-w-xs">
                    {t('settings.general.delete_desc')}
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'fields' ? (
            <UserFieldsPanel />
          ) : activeTab === 'tags' ? (
            <TagsSettingsPanel />
          ) : activeTab === 'integrations' ? (
            botId ? (
              <IntegrationsPanel botId={botId} onOpenPricing={() => setShowPricing(true)} />
            ) : (
              <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 font-['JetBrains_Mono',monospace]">
                <AlertCircle size={40} className="text-[#0A0A0A] mx-auto" />
                <h3 className="font-bold text-[#0A0A0A] text-sm uppercase">No active bot found</h3>
                <p className="text-xs text-slate-700 font-medium">Please connect a Telegram bot first to access integrations.</p>
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
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-12 text-center text-sm font-bold text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
              This section is currently under development. Settings will be linked here soon.
            </div>
          )}
        </div>
      </div>
      <TelegramLoginModal isOpen={isTelegramOpen} onClose={() => setIsTelegramOpen(false)} onSuccess={() => {}} />
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      <LeaveAccountModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onNavigateToTeam={() => {
          setActiveTab('members');
          navigate('/settings?tab=members', { replace: true });
        }}
      />
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
      <CreateTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        botId={botId}
      />
    </DashboardLayout>
  );
};
