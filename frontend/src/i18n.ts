let translations: Record<string, string> = {};
let currentLanguage: 'en' | 'uk' = 'en';

export async function initTranslations() {
  const saved = localStorage.getItem('launchly_language');
  const lang = (saved === 'uk' || saved === 'en') ? saved : 'en';
  currentLanguage = lang;

  try {
    const response = await fetch(`/api/i18n/translations?lang=${lang}`);
    if (response.ok) {
      translations = await response.json();
    } else {
      console.error('Failed to load translations from backend');
    }
  } catch (error) {
    console.error('Error fetching translations:', error);
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function changeLanguage(lang: 'en' | 'uk') {
  localStorage.setItem('launchly_language', lang);
  window.location.reload();
}

export function t(key: string, replacements?: Record<string, string | number>): string {
  let val = translations[key];
  if (val === undefined) {
    return key;
  }
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }
  return val;
}
