import { t } from '../i18n/config';

export interface FlowBlockConfig {
  type: string;
  labelKey: string;
  color: string;
}

const FLOW_BLOCK_COLORS: Record<string, string> = {
  MESSAGE: 'text-sky-500 bg-sky-50',
  CONDITION: 'text-purple-700 bg-purple-50',
  ACTION: 'text-amber-600 bg-amber-50',
  API_CALL: 'text-indigo-500 bg-indigo-50',
  SMART_DELAY: 'text-rose-500 bg-rose-50',
  RANDOMIZER: 'text-purple-600 bg-purple-50',
  START_AUTOMATION: 'text-lime-600 bg-lime-50',
  COMMENT: 'text-amber-500 bg-amber-50',
  AI: 'text-emerald-600 bg-emerald-50',
  END: 'text-slate-500 bg-slate-50',
};

const FLOW_BLOCK_TYPES = ['MESSAGE', 'CONDITION', 'ACTION', 'API_CALL', 'SMART_DELAY', 'RANDOMIZER', 'START_AUTOMATION', 'COMMENT', 'AI', 'END'];

export const getFlowBlocks = (): Array<{ type: string; label: string; color: string }> =>
  FLOW_BLOCK_TYPES.map((type) => ({
    type,
    label: t(`flow_block.${type}`),
    color: FLOW_BLOCK_COLORS[type] || 'text-slate-500 bg-slate-50',
  }));

// Legacy export for backward compatibility — static labels (English fallback)
export const FLOW_BLOCKS = FLOW_BLOCK_TYPES.map((type) => ({
  type,
  get label() { return t(`flow_block.${type}`); },
  color: FLOW_BLOCK_COLORS[type] || 'text-slate-500 bg-slate-50',
}));

export const createDefaultNodeData = (type: string): Record<string, unknown> => {
  switch (type) {
    case 'MESSAGE':
      return { text: 'Hello! Enter your text here.', buttons: [] };
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

