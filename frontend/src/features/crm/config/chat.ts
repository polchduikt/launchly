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
