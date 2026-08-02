import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SETTINGS_SECTIONS } from '../../const/settingsSections';
import { GeneralPanel } from '../../pages/owner/FlowBuilder/components/GeneralPanel';
import { NotificationsPanel } from '../../pages/owner/FlowBuilder/components/NotificationsPanel';
import { TelegramSettingsPanel } from '../../pages/owner/FlowBuilder/components/TelegramSettingsPanel';
import { DisplayPanel } from '../../pages/owner/FlowBuilder/components/DisplayPanel';
import { TeamMembersPanel } from '../../pages/owner/FlowBuilder/components/TeamMembersPanel';
import { UserFieldsPanel } from '../../pages/owner/FlowBuilder/components/UserFieldsPanel';
import { TagsSettingsPanel } from '../../pages/owner/FlowBuilder/components/TagsSettingsPanel';
import { IntegrationsPanel } from './IntegrationsPanel';
import { SubscriptionsPanel } from './SubscriptionsPanel';
import { PaymentsPanel } from './PaymentsPanel';
import { useBotStore } from '../../store/useBotStore';
import { useBotsQuery } from '../../hooks/bot/useBotsQuery';
import { AlertCircle } from 'lucide-react';
import { t } from '../../i18n/config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'notifications',
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPricing, setShowPricing] = useState(false);
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();
  const botId = activeBotId || (bots[0]?.id || 0);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleTabClick = (tabId: string) => {
    onClose();
    navigate(`/settings?tab=${tabId}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralPanel />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'telegram':
        return <TelegramSettingsPanel />;
      case 'display':
        return <DisplayPanel />;
      case 'members':
        return <TeamMembersPanel />;
      case 'fields':
        return <UserFieldsPanel />;
      case 'tags':
        return <TagsSettingsPanel />;
      case 'integrations':
        return botId ? (
          <IntegrationsPanel botId={botId} onOpenPricing={() => setShowPricing(true)} />
        ) : (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-8 text-center max-w-md mx-auto space-y-4 select-none">
            <AlertCircle size={40} className="text-[#0A0A0A] mx-auto" />
            <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-sm uppercase">No active bot found</h3>
            <p className="text-xs text-slate-500">Please connect a Telegram bot first to access integrations.</p>
          </div>
        );
      case 'subscriptions':
        return <SubscriptionsPanel />;
      case 'payments':
        return <PaymentsPanel />;
      default:
        return (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-12 text-center text-sm text-slate-500">
            This section is currently under development.
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 font-['JetBrains_Mono',monospace]"
      onClick={onClose}
    >
      <style>{`
        .settings-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .settings-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .settings-scrollbar::-webkit-scrollbar-thumb {
          background: #0A0A0A;
          border-radius: 3px;
        }
        .settings-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #0A0A0A transparent;
        }
      `}</style>
      <div
        className="relative w-full max-w-6xl h-[85vh] bg-[#F2EBDD] rounded-3xl border-2 border-[#0A0A0A] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b-2 border-[#0A0A0A] bg-[#F2EBDD] flex items-center justify-center relative">
          <h2 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase tracking-tight">
            {t('settings.settings')}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-52 shrink-0 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] p-4 overflow-y-auto settings-scrollbar">
            <div className="space-y-6">
              {SETTINGS_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-2 px-2 select-none">
                    {t('settings.section.' + section.title.toLowerCase())}
                  </h3>
                  <nav className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-black uppercase text-left transition-all cursor-pointer ${
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

          <div className="flex-1 overflow-y-auto p-6 space-y-4 settings-scrollbar bg-[#F2EBDD]">
            {renderContent()}
          </div>
        </div>
      </div>

      {showPricing && (
        <div className="hidden" onClick={() => setShowPricing(false)} />
      )}
    </div>
  );
};
