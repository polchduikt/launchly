import React, { useState, useEffect } from 'react';
import { t } from '../../../../i18n/config';

export const DisplayPanel: React.FC = () => {
  const [showTemplatesModal, setShowTemplatesModal] = useState(true);
  const [showOnlySubscribed, setShowOnlySubscribed] = useState(false);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('launchly_display_show_templates');
    if (savedTemplates !== null) {
      setShowTemplatesModal(savedTemplates === 'true');
    }
    const savedSubscribed = localStorage.getItem('launchly_display_only_subscribed');
    if (savedSubscribed !== null) {
      setShowOnlySubscribed(savedSubscribed === 'true');
    }
  }, []);

  const handleToggleTemplates = (val: boolean) => {
    setShowTemplatesModal(val);
    localStorage.setItem('launchly_display_show_templates', String(val));
  };

  const handleToggleSubscribed = (val: boolean) => {
    setShowOnlySubscribed(val);
    localStorage.setItem('launchly_display_only_subscribed', String(val));
  };

  return (
    <div className="space-y-6 font-['JetBrains_Mono',monospace]">
      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl divide-y-2 divide-[#0A0A0A]/15 overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
          <div className="lg:col-span-3">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">
              {t('settings.display.templates_title')}
            </h3>
          </div>
          <div className="lg:col-span-5 flex items-center">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTemplatesModal}
                onChange={(e) => handleToggleTemplates(e.target.checked)}
                className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
              />
              <span className="text-xs font-bold text-[#0A0A0A]">
                {t('settings.display.templates_toggle')}
              </span>
            </label>
          </div>
          <div className="lg:col-span-4">
            <p className="text-xs text-slate-700 font-bold leading-relaxed">
              {t('settings.display.templates_desc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
          <div className="lg:col-span-3">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">
              {t('settings.display.contacts_title')}
            </h3>
          </div>
          <div className="lg:col-span-5 flex items-center">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlySubscribed}
                onChange={(e) => handleToggleSubscribed(e.target.checked)}
                className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
              />
              <span className="text-xs font-bold text-[#0A0A0A]">
                {t('settings.display.contacts_toggle')}
              </span>
            </label>
          </div>
          <div className="lg:col-span-4">
            <p className="text-xs text-slate-700 font-bold leading-relaxed">
              {t('settings.display.contacts_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
