import { FLOW_BLOCKS } from './flowBlocks';
import { t } from '../i18n/config';

export const BROADCAST_BLOCKS = [
  ...FLOW_BLOCKS,
];

export const BROADCAST_CONTEXT_MENU_OPTIONS = [
  { type: 'MESSAGE', get label() { return t('context_menu.MESSAGE'); }, isPro: false, isAi: false },
  { type: 'API_CALL', get label() { return t('context_menu.API_CALL'); }, isPro: false, isAi: false },
  { type: 'ACTION', get label() { return t('context_menu.ACTION'); }, isPro: false, isAi: false },
  { type: 'CONDITION', get label() { return t('context_menu.CONDITION'); }, isPro: true, isAi: false },
  { type: 'RANDOMIZER', get label() { return t('context_menu.RANDOMIZER'); }, isPro: true, isAi: false },
  { type: 'SMART_DELAY', get label() { return t('context_menu.SMART_DELAY'); }, isPro: true, isAi: false },
  { type: 'START_AUTOMATION', get label() { return t('context_menu.START_AUTOMATION'); }, isPro: false, isAi: false },
  { type: 'AI', get label() { return t('context_menu.AI'); }, isPro: false, isAi: true },
];
