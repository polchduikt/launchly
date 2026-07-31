import { t } from '../i18n/config';

export interface ContextMenuOption {
  type: string;
  label: string;
  isPro: boolean;
  isAi: boolean;
}

const CONTEXT_MENU_CONFIGS = [
  { type: 'MESSAGE', isPro: false, isAi: false },
  { type: 'API_CALL', isPro: false, isAi: false },
  { type: 'ACTION', isPro: false, isAi: false },
  { type: 'CONDITION', isPro: true, isAi: false },
  { type: 'RANDOMIZER', isPro: true, isAi: false },
  { type: 'SMART_DELAY', isPro: true, isAi: false },
  { type: 'START_AUTOMATION', isPro: false, isAi: false },
  { type: 'AI', isPro: false, isAi: true },
];

export const CONTEXT_MENU_OPTIONS: ContextMenuOption[] = CONTEXT_MENU_CONFIGS.map((cfg) => ({
  ...cfg,
  get label() { return t(`context_menu.${cfg.type}`); },
}));
