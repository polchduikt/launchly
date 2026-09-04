import { FLOW_BLOCKS, FLOW_BLOCK_COLORS } from './flowBlocks';
import { NODE_ICON_COMPONENTS } from './nodeDisplay';
import { t } from '../i18n/config';

export const BROADCAST_BLOCKS = [
  ...FLOW_BLOCKS,
];

export const BROADCAST_CONTEXT_MENU_OPTIONS = [
  { type: 'MESSAGE', get label() { return t('context_menu.MESSAGE').replace(/^\+\s*/, ''); }, isPro: false, isAi: false, color: FLOW_BLOCK_COLORS.MESSAGE, icon: NODE_ICON_COMPONENTS.MESSAGE },
  { type: 'API_CALL', get label() { return t('context_menu.API_CALL').replace(/^\+\s*/, ''); }, isPro: false, isAi: false, color: FLOW_BLOCK_COLORS.API_CALL, icon: NODE_ICON_COMPONENTS.API_CALL },
  { type: 'ACTION', get label() { return t('context_menu.ACTION').replace(/^\+\s*/, ''); }, isPro: false, isAi: false, color: FLOW_BLOCK_COLORS.ACTION, icon: NODE_ICON_COMPONENTS.ACTION },
  { type: 'CONDITION', get label() { return t('context_menu.CONDITION').replace(/^\+\s*/, ''); }, isPro: true, isAi: false, color: FLOW_BLOCK_COLORS.CONDITION, icon: NODE_ICON_COMPONENTS.CONDITION },
  { type: 'RANDOMIZER', get label() { return t('context_menu.RANDOMIZER').replace(/^\+\s*/, ''); }, isPro: true, isAi: false, color: FLOW_BLOCK_COLORS.RANDOMIZER, icon: NODE_ICON_COMPONENTS.RANDOMIZER },
  { type: 'SMART_DELAY', get label() { return t('context_menu.SMART_DELAY').replace(/^\+\s*/, ''); }, isPro: true, isAi: false, color: FLOW_BLOCK_COLORS.SMART_DELAY, icon: NODE_ICON_COMPONENTS.SMART_DELAY },
  { type: 'START_AUTOMATION', get label() { return t('context_menu.START_AUTOMATION').replace(/^\+\s*/, ''); }, isPro: false, isAi: false, color: FLOW_BLOCK_COLORS.START_AUTOMATION, icon: NODE_ICON_COMPONENTS.START_AUTOMATION },
  { type: 'AI', get label() { return t('context_menu.AI').replace(/^\+\s*/, ''); }, isPro: false, isAi: true, color: FLOW_BLOCK_COLORS.AI, icon: NODE_ICON_COMPONENTS.AI },
];
