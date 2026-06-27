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
      { id: 'logs', label: 'Logs' },
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
      { id: 'invoices', label: 'Invoices' },
      { id: 'payment', label: 'Payment Details' },
    ],
  },
  {
    title: 'Inbox',
    items: [
      { id: 'live-chat', label: 'Live Chat Behavior' },
      { id: 'assignment', label: 'Auto-Assignment' },
    ],
  },
  {
    title: 'Channels',
    items: [
      { id: 'email', label: 'Email' },
      { id: 'telegram', label: 'Telegram' },
    ],
  },
];
