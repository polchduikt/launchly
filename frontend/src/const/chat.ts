export const LS_LABELS = 'launchly_chat_labels';
export const LS_FAVS = 'launchly_chat_favorites';
export const LS_TAGS = 'launchly_chat_tags';
export const LS_NOTES = 'launchly_chat_notes';
export const LS_UNREAD = 'launchly_chat_unread';
export const LS_LAST_SEEN = 'launchly_chat_last_seen';

export const CHAT_FILTER_OPTIONS: { value: 'open' | 'all' | 'closed'; label: string }[] = [
  { value: 'open', label: 'Open Chats' },
  { value: 'all', label: 'All Chats' },
  { value: 'closed', label: 'Closed Chats' },
];

export const CHAT_FILTER_LABELS: Record<string, string> = {
  open: 'Open Chats',
  closed: 'Closed Chats',
  all: 'All Chats',
};

export const PAUSE_OPTIONS = [
  { key: 'crm.panel.automations.duration.30m', value: 30 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.1h', value: 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.3h', value: 3 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.6h', value: 6 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.12h', value: 12 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.1d', value: 24 * 60 * 60 * 1000 },
  { key: 'crm.panel.automations.duration.forever', value: null },
];

export const REMINDER_OPTIONS = [
  { label: '20 minutes', value: 20 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
  { label: '12 hours', value: 12 * 60 * 60 * 1000 },
];

export const COUNTRIES = [
  { code: 'US', dial: '+1' },
  { code: 'UA', dial: '+380' },
  { code: 'GB', dial: '+44' },
  { code: 'DE', dial: '+49' },
  { code: 'PL', dial: '+48' },
  { code: 'FR', dial: '+33' },
  { code: 'ES', dial: '+34' },
  { code: 'IT', dial: '+39' },
  { code: 'CA', dial: '+1' },
  { code: 'AU', dial: '+61' },
];
