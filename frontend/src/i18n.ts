import { useState, useEffect } from 'react';
import ukFallback from './locales/uk.json';
import enFallback from './locales/en.json';

const fallbacks: Record<'en' | 'uk', Record<string, string>> = {
  en: enFallback,
  uk: ukFallback
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
currentLanguage = (savedLang === 'uk' || savedLang === 'en') ? savedLang : 'en';
translations = loadInitialTranslations(currentLanguage);

export async function initTranslations() {
  const saved = localStorage.getItem('launchly_language');
  const lang = (saved === 'uk' || saved === 'en') ? saved : 'en';
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

export function t(key: string, replacementsOrDefault?: Record<string, string | number> | string): string {
  let val = translations[key];
  if (val === undefined) {
    val = fallbacks[currentLanguage]?.[key];
  }
  if (val === undefined) {
    if (typeof replacementsOrDefault === 'string') {
      return replacementsOrDefault;
    }
    return key;
  }
  if (replacementsOrDefault && typeof replacementsOrDefault === 'object') {
    Object.entries(replacementsOrDefault).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }
  return val;
}

export function subscribeLanguageChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTranslation() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(tick => tick + 1);
    listeners.add(handler);
    window.addEventListener('launchly_language_changed', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('launchly_language_changed', handler);
    };
  }, []);

  return { t, currentLanguage, changeLanguage, getLanguage };
}
