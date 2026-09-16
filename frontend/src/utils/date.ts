import { t } from '../i18n/config';

export const formatRelativeTime = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return t('common.not_applicable', 'N/A');

  try {
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      const trimmed = dateInput.trim();
      const hasTimezone = /[Zz]$|[+-]\d{2}(:?\d{2})?$/.test(trimmed);
      if (hasTimezone) {
        date = new Date(trimmed);
      } else {
        const dLocal = new Date(trimmed);
        const dUtc = new Date(`${trimmed}Z`);
        if (!isNaN(dLocal.getTime()) && !isNaN(dUtc.getTime())) {
          const nowMs = Date.now();
          const diffLocal = Math.abs(nowMs - dLocal.getTime());
          const diffUtc = Math.abs(nowMs - dUtc.getTime());
          date = diffLocal <= diffUtc ? dLocal : dUtc;
        } else {
          date = isNaN(dLocal.getTime()) ? dUtc : dLocal;
        }
      }
    }
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

export const formatEuroDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
};
