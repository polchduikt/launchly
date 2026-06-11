export interface AutomationTab {
  id: 'my' | 'basic' | 'sequences';
  label: string;
}

export const AUTOMATION_TABS: AutomationTab[] = [
  { id: 'my', label: 'My Automations' },
  { id: 'basic', label: 'Basic' },
  { id: 'sequences', label: 'Sequences' },
];
