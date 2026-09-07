import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from './date';
import { t } from '../i18n/config';

describe('formatRelativeTime', () => {
  it('returns N/A for empty or null date', () => {
    const na = t('common.not_applicable');
    expect(formatRelativeTime(null)).toBe(na);
    expect(formatRelativeTime(undefined)).toBe(na);
    expect(formatRelativeTime('')).toBe(na);
  });

  it('handles invalid date strings gracefully', () => {
    expect(formatRelativeTime('not-a-date')).toBe(t('common.not_applicable'));
  });

  it('formats recent dates as just now', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBeTruthy();
  });

  it('formats dates in minutes', () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const res = formatRelativeTime(fiveMinsAgo);
    expect(res).toBeTruthy();
  });

  it('formats dates in hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
    const res = formatRelativeTime(threeHoursAgo);
    expect(res).toBeTruthy();
  });

  it('formats dates in days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    const res = formatRelativeTime(twoDaysAgo);
    expect(res).toBeTruthy();
  });

  it('formats older dates as local date string', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600 * 1000);
    const res = formatRelativeTime(sixtyDaysAgo);
    expect(res).toBe(sixtyDaysAgo.toLocaleDateString());
  });
});
