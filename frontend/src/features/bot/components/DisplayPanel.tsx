import React, { useState, useEffect } from 'react';
import { t } from '../../../i18n';

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
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800">
              {t('settings.display.templates_title')}
            </h3>
          </div>
          <div className="lg:col-span-5 flex items-center">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTemplatesModal}
                onChange={(e) => handleToggleTemplates(e.target.checked)}
                className="sr-only peer animate-none"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                {t('settings.display.templates_toggle')}
              </span>
            </label>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              {t('settings.display.templates_desc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800">
              {t('settings.display.contacts_title')}
            </h3>
          </div>
          <div className="lg:col-span-5 flex items-center">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlySubscribed}
                onChange={(e) => handleToggleSubscribed(e.target.checked)}
                className="sr-only peer animate-none"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                {t('settings.display.contacts_toggle')}
              </span>
            </label>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              {t('settings.display.contacts_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
