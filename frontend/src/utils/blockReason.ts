import { t, getLanguage } from '../i18n/config';

export const translateBlockReason = (reason?: string | null): string => {
  if (!reason) return '';
  const lang = getLanguage();
  const ukMap: Record<string, string> = {
    'Suspicious activity': 'Підозріла активність',
    'Violation of platform rules': 'Порушення правил платформи',
    'Spam or unauthorized bulk messaging': 'Спам або несанкціонована розсилка',
    'Спам або несанкціоновані розсилки': 'Спам або несанкціонована розсилка',
    'Other reason': 'Інша причина',
    'Підозріла активність': 'Підозріла активність',
    'Порушення правил платформи': 'Порушення правил платформи',
    'Інша причина': 'Інша причина',
  };
  const enMap: Record<string, string> = {
    'Suspicious activity': 'Suspicious activity',
    'Violation of platform rules': 'Violation of platform rules',
    'Spam or unauthorized bulk messaging': 'Spam or unauthorized bulk messaging',
    'Спам або несанкціоновані розсилки': 'Spam or unauthorized bulk messaging',
    'Other reason': 'Other reason',
    'Підозріла активність': 'Suspicious activity',
    'Порушення правил платформи': 'Violation of platform rules',
    'Спам або несанкціонована розсилка': 'Spam or unauthorized bulk messaging',
    'Інша причина': 'Other reason',
  };

  if (lang === 'uk') {
    return ukMap[reason] || t(reason) || reason;
  }
  return enMap[reason] || t(reason) || reason;
};
