import React, { useState } from 'react';
import { t } from '../../../../i18n/config';

// Home keys
export const DISPLAY_KEY_HOME_TEMPLATES = 'launchly_display_home_templates';
export const DISPLAY_KEY_HOME_BLOG = 'launchly_display_home_blog';

// Contacts keys
export const DISPLAY_KEY_CONTACTS_HIDE_UNSUB = 'launchly_display_contacts_hide_unsub';

// Automations keys
export const DISPLAY_KEY_AUTO_RUNS = 'launchly_display_auto_runs';
export const DISPLAY_KEY_AUTO_CTR = 'launchly_display_auto_ctr';
export const DISPLAY_KEY_AUTO_BADGE = 'launchly_display_auto_badge';

function useDisplayToggle(storageKey: string, defaultVal: boolean) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : defaultVal;
  });
  const toggle = (val: boolean) => {
    setValue(val);
    localStorage.setItem(storageKey, String(val));
  };
  return [value, toggle] as const;
}

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-6 pt-5 pb-2">
    <span className="text-[10px] font-black text-[#0A0A0A]/40 uppercase tracking-[0.15em] font-['JetBrains_Mono',monospace]">
      {label}
    </span>
  </div>
);

const ToggleRow: React.FC<{
  titleKey: string;
  toggleKey: string;
  descKey: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ titleKey, toggleKey, descKey, value, onChange }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
    <div className="lg:col-span-3">
      <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">
        {t(titleKey)}
      </h3>
    </div>
    <div className="lg:col-span-5 flex items-center">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
        />
        <span className="text-xs font-bold text-[#0A0A0A]">{t(toggleKey)}</span>
      </label>
    </div>
    <div className="lg:col-span-4">
      <p className="text-xs text-slate-700 font-bold leading-relaxed">{t(descKey)}</p>
    </div>
  </div>
);

export const DisplayPanel: React.FC = () => {
  const [showHomeTemplates, setShowHomeTemplates] = useDisplayToggle(DISPLAY_KEY_HOME_TEMPLATES, true);
  const [showHomeBlog, setShowHomeBlog] = useDisplayToggle(DISPLAY_KEY_HOME_BLOG, true);
  const [showAutoRuns, setShowAutoRuns] = useDisplayToggle(DISPLAY_KEY_AUTO_RUNS, true);
  const [showAutoCtr, setShowAutoCtr] = useDisplayToggle(DISPLAY_KEY_AUTO_CTR, true);
  const [showAutoBadge, setShowAutoBadge] = useDisplayToggle(DISPLAY_KEY_AUTO_BADGE, true);
  const [hideUnsub, setHideUnsub] = useDisplayToggle(DISPLAY_KEY_CONTACTS_HIDE_UNSUB, false);

  return (
    <div className="space-y-6 font-['JetBrains_Mono',monospace]">
      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl divide-y-2 divide-[#0A0A0A]/15 overflow-hidden text-left">

        {/* ── Головна сторінка ── */}
        <SectionHeader label={t('settings.display.section_home')} />

        <ToggleRow
          titleKey="settings.display.home_templates_title"
          toggleKey="settings.display.home_templates_toggle"
          descKey="settings.display.home_templates_desc"
          value={showHomeTemplates}
          onChange={setShowHomeTemplates}
        />
        <ToggleRow
          titleKey="settings.display.home_blog_title"
          toggleKey="settings.display.home_blog_toggle"
          descKey="settings.display.home_blog_desc"
          value={showHomeBlog}
          onChange={setShowHomeBlog}
        />

        {/* ── Автоматизації ── */}
        <SectionHeader label={t('settings.display.section_automations')} />

        <ToggleRow
          titleKey="settings.display.auto_runs_title"
          toggleKey="settings.display.auto_runs_toggle"
          descKey="settings.display.auto_runs_desc"
          value={showAutoRuns}
          onChange={setShowAutoRuns}
        />
        <ToggleRow
          titleKey="settings.display.auto_ctr_title"
          toggleKey="settings.display.auto_ctr_toggle"
          descKey="settings.display.auto_ctr_desc"
          value={showAutoCtr}
          onChange={setShowAutoCtr}
        />
        <ToggleRow
          titleKey="settings.display.auto_badge_title"
          toggleKey="settings.display.auto_badge_toggle"
          descKey="settings.display.auto_badge_desc"
          value={showAutoBadge}
          onChange={setShowAutoBadge}
        />

        {/* ── Контакти ── */}
        <SectionHeader label={t('settings.display.section_contacts')} />

        <ToggleRow
          titleKey="settings.display.contacts_hide_unsub_title"
          toggleKey="settings.display.contacts_hide_unsub_toggle"
          descKey="settings.display.contacts_hide_unsub_desc"
          value={hideUnsub}
          onChange={setHideUnsub}
        />

      </div>
    </div>
  );
};
