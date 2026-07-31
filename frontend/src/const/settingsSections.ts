export interface SettingsItem {
  id: string;
  label: string;
}

export interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Main',
    items: [
      { id: 'general', label: 'General' },
      { id: 'integrations', label: 'Integrations' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'members', label: 'Team Members' },
      { id: 'display', label: 'Display' },
    ],
  },
  {
    title: 'Audience',
    items: [
      { id: 'fields', label: 'User Fields' },
      { id: 'tags', label: 'Tags' },
    ],
  },
  {
    title: 'Billing',
    items: [
      { id: 'subscriptions', label: 'Subscriptions' },
      { id: 'payments', label: 'Payments' },
    ],
  },
  {
    title: 'Channels',
    items: [
      { id: 'telegram', label: 'Telegram' },
    ],
  },
];
