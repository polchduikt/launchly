import type { ParsedButtons } from '../types/chat';
import { t } from '../../../i18n/config';

export const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('time.now');
  if (mins < 60) return t('time.mins', { mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('time.hrs', { hrs });
  const days = Math.floor(hrs / 24);
  return t('time.days', { days });
};

export const formatDateSeparator = (dateStr: string): string => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  if (d.toDateString() === today.toDateString()) return `${t('time.today')}, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `${t('time.yesterday')}, ${time}`;
  return `${dateFormatted}, ${time}`;
};

export const getDateKey = (dateStr: string) => new Date(dateStr).toDateString();

export const formatMessageTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const parseMessageButtons = (content: string | null): ParsedButtons => {
  if (!content) return { text: '', buttons: [] };
  const buttonRegex = /\s*\[([^\]]+)\]$/;
  let text = content;
  const buttons: string[] = [];
  while (true) {
    const match = text.match(buttonRegex);
    if (!match) break;
    buttons.unshift(match[1]);
    text = text.substring(0, match.index);
  }
  return { text: text.trim(), buttons };
};

export const lsGet = <T,>(key: string, fb: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
};

export const lsSet = (key: string, val: unknown) =>
  localStorage.setItem(key, JSON.stringify(val));
