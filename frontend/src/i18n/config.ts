import React, { useState, useEffect, createContext, useContext } from 'react';
import enAdmin       from './locales/en/admin.json';
import enAi          from './locales/en/ai.json';
import enAuth        from './locales/en/auth.json';
import enAutomations from './locales/en/automations.json';
import enBilling     from './locales/en/billing.json';
import enBroadcasts  from './locales/en/broadcasts.json';
import enCommon      from './locales/en/common.json';
import enCrm         from './locales/en/crm.json';
import enDashboard   from './locales/en/dashboard.json';
import enEditor      from './locales/en/editor.json';
import enFlowBuilder from './locales/en/flow_builder.json';
import enSettings    from './locales/en/settings.json';
import enLanding    from './locales/en/landing.json';
import enLegal      from './locales/en/legal.json';
import enBlog       from './locales/en/blog.json';
import ukAdmin       from './locales/uk/admin.json';
import ukAi          from './locales/uk/ai.json';
import ukAuth        from './locales/uk/auth.json';
import ukAutomations from './locales/uk/automations.json';
import ukBilling     from './locales/uk/billing.json';
import ukBroadcasts  from './locales/uk/broadcasts.json';
import ukCommon      from './locales/uk/common.json';
import ukCrm         from './locales/uk/crm.json';
import ukDashboard   from './locales/uk/dashboard.json';
import ukEditor      from './locales/uk/editor.json';
import ukFlowBuilder from './locales/uk/flow_builder.json';
import ukSettings    from './locales/uk/settings.json';
import ukLanding    from './locales/uk/landing.json';
import ukLegal      from './locales/uk/legal.json';
import ukBlog       from './locales/uk/blog.json';

const fallbacks: Record<'en' | 'uk', Record<string, string>> = {
  en: {
    ...enAdmin, ...enAi, ...enAuth, ...enAutomations, ...enBilling,
    ...enBroadcasts, ...enCommon, ...enCrm, ...enDashboard,
    ...enEditor, ...enFlowBuilder, ...enSettings,
    ...enLanding, ...enLegal, ...enBlog,
  },
  uk: {
    ...ukAdmin, ...ukAi, ...ukAuth, ...ukAutomations, ...ukBilling,
    ...ukBroadcasts, ...ukCommon, ...ukCrm, ...ukDashboard,
    ...ukEditor, ...ukFlowBuilder, ...ukSettings,
    ...ukLanding, ...ukLegal, ...ukBlog,
  },
};

let currentLanguage: 'en' | 'uk' = 'en';
let translations: Record<string, string> = {};
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('launchly_language_changed'));
  }
}

function loadInitialTranslations(lang: 'en' | 'uk'): Record<string, string> {
  const fallback = fallbacks[lang] || fallbacks.en;
  try {
    const cached = localStorage.getItem(`launchly_translations_cache_${lang}`);
    if (cached) {
      return { ...fallback, ...JSON.parse(cached) };
    }
  } catch (e) {
  }
  return { ...fallback };
}

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('launchly_language') : null;
currentLanguage = (savedLang === 'uk' || savedLang === 'en') ? savedLang : 'uk';
translations = loadInitialTranslations(currentLanguage);

export async function initTranslations() {
  const saved = localStorage.getItem('launchly_language');
  const lang = (saved === 'uk' || saved === 'en') ? saved : 'uk';
  currentLanguage = lang;
  translations = loadInitialTranslations(lang);
  notifyListeners();

  try {
    const response = await fetch(`/api/i18n/translations?lang=${lang}`);
    if (response.ok) {
      const data = await response.json();
      translations = { ...fallbacks[lang], ...data };
      localStorage.setItem(`launchly_translations_cache_${lang}`, JSON.stringify(data));
      notifyListeners();
    }
  } catch (error) {
  }
}

export function getLanguage(): 'en' | 'uk' {
  return currentLanguage;
}

export async function changeLanguage(lang: 'en' | 'uk') {
  if (currentLanguage === lang) return;
  localStorage.setItem('launchly_language', lang);
  currentLanguage = lang;
  translations = loadInitialTranslations(lang);
  notifyListeners();

  try {
    const response = await fetch(`/api/i18n/translations?lang=${lang}`);
    if (response.ok) {
      const data = await response.json();
      translations = { ...fallbacks[lang], ...data };
      localStorage.setItem(`launchly_translations_cache_${lang}`, JSON.stringify(data));
      notifyListeners();
    }
  } catch (error) {
  }
}

export function t(
  key: string,
  fallbackOrReplacements?: Record<string, string | number> | string,
  replacements?: Record<string, string | number>
): string {
  let val = translations[key];
  if (val === undefined) {
    val = fallbacks[currentLanguage]?.[key];
  }
  if (val === undefined) {
    if (typeof fallbackOrReplacements === 'string') {
      val = fallbackOrReplacements;
    } else {
      return key;
    }
  }

  const params =
    replacements ||
    (typeof fallbackOrReplacements === 'object' ? fallbackOrReplacements : undefined);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(new RegExp(`\\{${k}\\}|\\{\\{${k}\\}\\}`, 'g'), String(v));
    });
  }
  return val;
}



export const LanguageContext = createContext<{
  currentLanguage: 'en' | 'uk';
  changeLanguage: (lang: 'en' | 'uk') => Promise<void>;
  t: typeof t;
}>({
  currentLanguage,
  changeLanguage,
  t,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<'en' | 'uk'>(currentLanguage);

  useEffect(() => {
    const handler = () => {
      setLang(currentLanguage);
    };
    listeners.add(handler);
    window.addEventListener('launchly_language_changed', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('launchly_language_changed', handler);
    };
  }, []);

  return React.createElement(
    LanguageContext.Provider,
    { value: { currentLanguage: lang, changeLanguage, t } },
    children
  );
};

export function subscribeLanguageChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((tick) => tick + 1);
    listeners.add(handler);
    window.addEventListener('launchly_language_changed', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('launchly_language_changed', handler);
    };
  }, []);

  const activeLang = ctx?.currentLanguage || currentLanguage;

  return {
    t,
    currentLanguage: activeLang,
    changeLanguage,
    getLanguage,
  };
}
