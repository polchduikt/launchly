import { t } from '../i18n/config';
import { NODE_ICON_COMPONENTS } from './nodeDisplay';
import { FLOW_BLOCK_COLORS } from './flowBlocks';
import type { LucideIcon } from 'lucide-react';

export interface ContextMenuOption {
  type: string;
  label: string;
  isPro: boolean;
  isAi: boolean;
  color: string;
  icon?: LucideIcon | React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const CONTEXT_MENU_CONFIGS = [
  { type: 'MESSAGE', isPro: false, isAi: false },
  { type: 'CONDITION', isPro: true, isAi: false },
  { type: 'ACTION', isPro: false, isAi: false },
  { type: 'MATH', isPro: false, isAi: false },
  { type: 'LEADERBOARD', isPro: false, isAi: false },
  { type: 'COOLDOWN', isPro: false, isAi: false },
  { type: 'API_CALL', isPro: false, isAi: false },
  { type: 'RANDOMIZER', isPro: true, isAi: false },
  { type: 'SMART_DELAY', isPro: true, isAi: false },
  { type: 'START_AUTOMATION', isPro: false, isAi: false },
  { type: 'COMMAND', isPro: false, isAi: false },
  { type: 'AI', isPro: false, isAi: true },
];

export const CONTEXT_MENU_GROUPS = [
  {
    id: 'messaging',
    titleKey: 'flow_builder.cat_messaging',
    defaultTitle: 'Повідомлення',
    types: ['MESSAGE', 'AI'],
  },
  {
    id: 'logic',
    titleKey: 'flow_builder.cat_logic',
    defaultTitle: 'Логіка та затримки',
    types: ['CONDITION', 'RANDOMIZER', 'SMART_DELAY', 'COOLDOWN'],
  },
  {
    id: 'operations',
    titleKey: 'flow_builder.cat_operations',
    defaultTitle: 'Операції та рейтинг',
    types: ['ACTION', 'MATH', 'LEADERBOARD'],
  },
  {
    id: 'integrations',
    titleKey: 'flow_builder.cat_integrations',
    defaultTitle: 'Інтеграції',
    types: ['API_CALL', 'START_AUTOMATION'],
  },
  {
    id: 'utilities',
    titleKey: 'flow_builder.cat_utilities',
    defaultTitle: 'Службові',
    types: ['COMMAND'],
  },
];

export const CONTEXT_MENU_OPTIONS: ContextMenuOption[] = CONTEXT_MENU_CONFIGS.map((cfg) => ({
  ...cfg,
  get label() { return t(`context_menu.${cfg.type}`).replace(/^\+\s*/, ''); },
  color: FLOW_BLOCK_COLORS[cfg.type] || 'text-slate-500 bg-slate-50',
  icon: NODE_ICON_COMPONENTS[cfg.type],
}));
