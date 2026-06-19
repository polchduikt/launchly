export type SortOrder = 'newest' | 'oldest';
export type BottomTab = 'reply' | 'note';
export type ChatFilter = 'open' | 'closed' | 'all';
export type SidebarTab = 'all' | 'reminders' | 'favorites';

export interface ParsedButtons {
  text: string;
  buttons: string[];
}
