export const AutomationStatus = {
  Draft: 'draft',
  Active: 'active',
} as const;

export type AutomationStatus = (typeof AutomationStatus)[keyof typeof AutomationStatus];

export const NodeType = {
  StartBroadcast: 'START_BROADCAST',
  Message: 'MESSAGE',
  Input: 'INPUT',
  Condition: 'CONDITION',
  Order: 'ORDER',
  Lead: 'LEAD',
  ApiCall: 'API_CALL',
  End: 'END',
  Action: 'ACTION',
  SmartDelay: 'SMART_DELAY',
  Randomizer: 'RANDOMIZER',
  Comment: 'COMMENT',
  StartAutomation: 'START_AUTOMATION',
  Ai: 'AI',
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];
