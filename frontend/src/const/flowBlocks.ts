import { t } from '../i18n/config';
import { NODE_ICON_COMPONENTS } from './nodeDisplay';
import type { LucideIcon } from 'lucide-react';

export interface FlowBlockConfig {
  type: string;
  labelKey: string;
  color: string;
}

export const FLOW_BLOCK_COLORS: Record<string, string> = {
  MESSAGE: 'text-sky-600 bg-sky-100',
  CONDITION: 'text-purple-700 bg-purple-100',
  ACTION: 'text-amber-700 bg-amber-100',
  API_CALL: 'text-indigo-600 bg-indigo-100',
  SMART_DELAY: 'text-rose-600 bg-rose-100',
  RANDOMIZER: 'text-purple-700 bg-purple-100',
  START_AUTOMATION: 'text-lime-700 bg-lime-100',
  COMMENT: 'text-amber-600 bg-amber-100',
  AI: 'text-emerald-700 bg-emerald-100',
  END: 'text-slate-600 bg-slate-200',
};

export const FLOW_BLOCK_TYPES = ['MESSAGE', 'CONDITION', 'ACTION', 'API_CALL', 'SMART_DELAY', 'RANDOMIZER', 'START_AUTOMATION', 'COMMENT', 'AI', 'END'];

export const getFlowBlocks = (): Array<{ type: string; label: string; color: string; icon?: LucideIcon | React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> =>
  FLOW_BLOCK_TYPES.map((type) => ({
    type,
    label: t(`flow_block.${type}`),
    color: FLOW_BLOCK_COLORS[type] || 'text-slate-500 bg-slate-50',
    icon: NODE_ICON_COMPONENTS[type],
  }));

// Legacy export for backward compatibility — static labels (English fallback)
export const FLOW_BLOCKS = FLOW_BLOCK_TYPES.map((type) => ({
  type,
  get label() { return t(`flow_block.${type}`); },
  color: FLOW_BLOCK_COLORS[type] || 'text-slate-500 bg-slate-50',
  icon: NODE_ICON_COMPONENTS[type],
}));

export const createDefaultNodeData = (type: string): Record<string, unknown> => {
  switch (type) {
    case 'MESSAGE':
      return { text: '', buttons: [] };
    case 'CONDITION':
      return {
        branches: [
          {
            id: 'branch_0',
            matchType: 'all',
            conditions: []
          }
        ]
      };
    case 'ACTION':
      return { actions: [] };
    case 'API_CALL':
      return { url: 'https://api.example.com/endpoint', method: 'GET' };
    case 'SMART_DELAY':
      return {
        mode: 'duration',
        waitAmount: 12,
        waitUnit: 'Hours',
        sendWithinSpecificHours: false,
        dateTime: ''
      };
    case 'RANDOMIZER':
      return {
        pickEveryTime: false,
        variations: [
          { id: 'variation_0', label: 'A', percentage: 50, color: '#7C3AED' },
          { id: 'variation_1', label: 'B', percentage: 50, color: '#B45309' }
        ]
      };
    case 'COMMENT':
      return {
        text: '',
        noteSize: 'M',
        fontSize: 'S'
      };
    case 'START_AUTOMATION':
      return {
        targetBotId: null,
        targetBotName: ''
      };
    case 'AI':
      return {
        prompt: '',
        context: '',
        generated: false,
        tasks: []
      };
    default:
      return {};
  }
};

