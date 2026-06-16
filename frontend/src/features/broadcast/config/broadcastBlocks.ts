import { FLOW_BLOCKS } from '../../bot/config/flowBlocks';

export const BROADCAST_BLOCKS = [
  ...FLOW_BLOCKS,
  { type: 'START_AUTOMATION', label: 'Start Automation', color: 'text-emerald-500 bg-emerald-50' },
];
