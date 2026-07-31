import React, { useState } from 'react';
import { X } from 'lucide-react';
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

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

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
        return activeBotId ? (
          <IntegrationsPanel botId={activeBotId} onOpenPricing={() => setShowPricing(true)} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 shadow-sm select-none">
            <AlertCircle size={40} className="text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No active bot found</h3>
            <p className="text-xs text-slate-400">Please connect a Telegram bot first to access integrations.</p>
          </div>
        );
      case 'subscriptions':
        return <SubscriptionsPanel />;
      case 'payments':
        return <PaymentsPanel />;
      default:
        return (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center text-sm text-slate-400">
            This section is currently under development.
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30"
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
          background: #cbd5e1;
          border-radius: 3px;
        }
        .settings-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .settings-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>
      <div
        className="relative w-full max-w-6xl h-[85vh] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-center relative">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t('settings.settings')}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-48 shrink-0 bg-white border-r border-slate-200 p-3 overflow-y-auto settings-scrollbar">
            <div className="space-y-5">
              {SETTINGS_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 select-none">
                    {t('settings.section.' + section.title.toLowerCase())}
                  </h3>
                  <nav className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-3 py-1.5 rounded text-xs text-left transition-all cursor-pointer ${
                          activeTab === item.id
                            ? 'text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-800'
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

          <div className="flex-1 overflow-y-auto p-6 space-y-4 settings-scrollbar bg-white">
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
