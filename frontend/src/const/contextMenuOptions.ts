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
  get label() { return t(`context_menu.${cfg.type}`).replace(/^\+\s*/, ''); },
  color: FLOW_BLOCK_COLORS[cfg.type] || 'text-slate-500 bg-slate-50',
  icon: NODE_ICON_COMPONENTS[cfg.type],
}));
