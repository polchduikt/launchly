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
  QUERY: 'text-blue-700 bg-blue-100',
  INTERACTION: 'text-pink-700 bg-pink-100',
  API_CALL: 'text-indigo-600 bg-indigo-100',
  SMART_DELAY: 'text-rose-600 bg-rose-100',
  RANDOMIZER: 'text-purple-700 bg-purple-100',
  START_AUTOMATION: 'text-lime-700 bg-lime-100',
  COMMAND: 'text-teal-700 bg-teal-100',
  COMMENT: 'text-amber-600 bg-amber-100',
  AI: 'text-emerald-700 bg-emerald-100',
  SCHEDULER: 'text-orange-700 bg-orange-100',
  SUBSCRIPTION_CHECK: 'text-green-700 bg-green-100',
  MODERATION: 'text-red-700 bg-red-100',
  JOIN_REQUEST: 'text-amber-700 bg-amber-100',
  END: 'text-slate-600 bg-slate-200',
};

export const FLOW_BLOCK_TYPES = ['MESSAGE', 'CONDITION', 'SUBSCRIPTION_CHECK', 'MODERATION', 'ACTION', 'MATH', 'LEADERBOARD', 'QUERY', 'INTERACTION', 'COOLDOWN', 'SCHEDULER', 'API_CALL', 'SMART_DELAY', 'RANDOMIZER', 'START_AUTOMATION', 'COMMAND', 'JOIN_REQUEST', 'COMMENT', 'AI', 'END'];

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
    defaultTitle: 'Логіка та перевірки',
    types: ['CONDITION', 'SUBSCRIPTION_CHECK', 'MODERATION', 'RANDOMIZER', 'SMART_DELAY', 'COOLDOWN', 'SCHEDULER'],
  },
  {
    id: 'operations',
    titleKey: 'flow_builder.cat_operations',
    defaultTitle: 'Операції та рейтинг',
    types: ['ACTION', 'MATH', 'LEADERBOARD', 'QUERY', 'INTERACTION'],
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
    types: ['COMMAND', 'JOIN_REQUEST', 'COMMENT', 'END'],
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
    case 'SUBSCRIPTION_CHECK':
      return {
        mode: 'all',
        channels: [
          {
            id: 'channel_0',
            channelId: '',
            name: '',
            url: '',
            isRequired: true,
          }
        ],
        passVariable: 'is_subscribed',
        unsubscribedVariable: 'unsubscribed_channels',
      };
    case 'MODERATION':
      return {
        isEnabled: true,
        isActive: true,
        antiForwardEnabled: true,
        antiLinkEnabled: false,
        whitelistedDomains: [],
        stopWords: [],
        filterProfanity: true,
        mediaMode: 'ALL',
        actionOnViolation: 'DELETE_AND_WARN',
        warningTemplate: '{first_name}, ваше повідомлення видалено через порушення правил чату!',
        warnAutoDeleteSeconds: 10,
        muteDurationMinutes: 60,
        passVariable: 'is_moderation_passed',
        violationReasonVariable: 'moderation_violation_reasons',
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
    case 'QUERY':
      return {
        outputPrefix: 'found_user',
        sortOrder: 'RANDOM',
        excludeSelf: true,
        excludeInteractions: ['like', 'dislike'],
        filters: [],
      };
    case 'INTERACTION':
      return {
        targetUserId: '{found_user.telegram_id}',
        interactionType: 'like',
        checkMutual: true,
        mutualType: 'like',
      };
    case 'COOLDOWN':
      return {
        duration: 1,
        unit: 'MINUTES',
        blockMessage: t('editor.cooldown.default_message', 'Зачекайте ще {remaining} перед повторною спробою!'),
        cooldownKey: '',
      };
    case 'SCHEDULER':
      return {
        isEnabled: true,
        isActive: true,
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
    case 'JOIN_REQUEST':
      return {
        autoApprove: true,
        channelId: '',
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

