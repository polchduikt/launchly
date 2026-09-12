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
  MATH: 'text-cyan-700 bg-cyan-100',
  LEADERBOARD: 'text-fuchsia-700 bg-fuchsia-100',
  COOLDOWN: 'text-amber-700 bg-amber-100',
  API_CALL: 'text-indigo-600 bg-indigo-100',
  SMART_DELAY: 'text-rose-600 bg-rose-100',
  RANDOMIZER: 'text-purple-700 bg-purple-100',
  START_AUTOMATION: 'text-lime-700 bg-lime-100',
  COMMAND: 'text-teal-700 bg-teal-100',
  COMMENT: 'text-amber-600 bg-amber-100',
  AI: 'text-emerald-700 bg-emerald-100',
  SCHEDULER: 'text-orange-700 bg-orange-100',
  END: 'text-slate-600 bg-slate-200',
};

export const FLOW_BLOCK_TYPES = ['MESSAGE', 'CONDITION', 'ACTION', 'MATH', 'LEADERBOARD', 'COOLDOWN', 'SCHEDULER', 'API_CALL', 'SMART_DELAY', 'RANDOMIZER', 'START_AUTOMATION', 'COMMAND', 'COMMENT', 'AI', 'END'];

export const getFlowBlocks = (): Array<{ type: string; label: string; color: string; icon?: LucideIcon | React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> =>
  FLOW_BLOCK_TYPES.map((type) => ({
    type,
    label: t(`flow_block.${type}`),
    color: FLOW_BLOCK_COLORS[type] || 'text-slate-500 bg-slate-50',
    icon: NODE_ICON_COMPONENTS[type],
  }));

export const FLOW_BLOCK_GROUPS = [
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
    types: ['CONDITION', 'RANDOMIZER', 'SMART_DELAY', 'COOLDOWN', 'SCHEDULER'],
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
    types: ['COMMAND', 'COMMENT', 'END'],
  },
];

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
    case 'MATH':
      return {
        targetField: '',
        valueField: '',
        operationMode: 'RANDOM',
        operationType: 'ADD',
        staticValue: 1,
        randomMin: 1,
        randomMax: 10,
        randomStep: 1,
      };
    case 'LEADERBOARD':
      return {
        targetField: '',
        limit: 10,
        showRank: true,
        showScores: true,
        sortOrder: 'DESC',
        customHeader: '',
      };
    case 'COOLDOWN':
      return {
        duration: 1,
        unit: 'MINUTES',
        blockMessage: 'Зачекайте ще {remaining} перед повторною спробою!',
        cooldownKey: '',
      };
    case 'SCHEDULER':
      return {
        frequency: 'daily',
        time: '00:00',
        daysOfWeek: ['MONDAY'],
        dayOfMonth: 1,
        intervalValue: 1,
        intervalUnit: 'hours',
        cronExpression: '0 0 9 * * *',
        targetScope: 'system',
        targetTag: '',
        timezone: 'Europe/Kyiv',
        isActive: true,
      };
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
    case 'COMMAND':
      return {
        command: '/start',
        description: ''
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

