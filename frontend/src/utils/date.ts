import { t } from '../i18n/config';

/**
 * Formats a date into a human-readable relative time string (e.g. 'just now', '5 mins ago').
 * Falls back to locale date string for dates older than 30 days or invalid dates.
 */
export const formatRelativeTime = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return t('common.not_applicable', 'N/A');

  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return t('common.not_applicable', 'N/A');

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return t('common.time.just_now', 'just now');

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return t('common.time.just_now', 'just now');
    if (diffMins < 60) return t('common.time.mins_ago', { count: diffMins }) || String(diffMins) + 'm ago';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return t('common.time.hours_ago', { count: diffHours }) || String(diffHours) + 'h ago';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return t('common.time.days_ago', { count: diffDays }) || String(diffDays) + 'd ago';

    return date.toLocaleDateString();
  } catch {
    return t('common.not_applicable', 'N/A');
  }
};
