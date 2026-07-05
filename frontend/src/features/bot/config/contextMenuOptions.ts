export interface ContextMenuOption {
  type: string;
  label: string;
  isPro: boolean;
  isAi: boolean;
}

export const CONTEXT_MENU_OPTIONS: ContextMenuOption[] = [
  { type: 'MESSAGE', label: '+ Telegram', isPro: false, isAi: false },
  { type: 'API_CALL', label: '+ AI Step', isPro: false, isAi: true },
  { type: 'ACTION', label: '+ Actions', isPro: false, isAi: false },
  { type: 'CONDITION', label: '+ Condition', isPro: true, isAi: false },
  { type: 'RANDOMIZER', label: '+ Randomizer', isPro: true, isAi: false },
  { type: 'SMART_DELAY', label: '+ Smart Delay', isPro: true, isAi: false },
  { type: 'START_AUTOMATION', label: '+ Start Automation', isPro: false, isAi: false },
];

