export interface MockBot {
  id: number;
  name: string;
  description: string;
  avatar: string | null;
  botStatus: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  hasTelegramToken: boolean;
  hasWebToken: boolean;
  createdAt: string;
}

export const MOCK_BOTS: MockBot[] = [
  {
    id: 1,
    name: 'E-commerce Bot',
    description: 'Automated sales assistant',
    avatar: null,
    botStatus: 'ACTIVE',
    hasTelegramToken: true,
    hasWebToken: false,
    createdAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Support Bot',
    description: 'Customer service flow',
    avatar: null,
    botStatus: 'PAUSED',
    hasTelegramToken: false,
    hasWebToken: false,
    createdAt: '2025-02-01T10:00:00Z',
  },
];

export const MOCK_FLOW_SCHEMA = {
  version: '1.0',
  nodes: [
    {
      id: 'start_node',
      type: 'startNode',
      position: { x: 100, y: 150 },
      data: { label: 'Start' },
    },
    {
      id: 'msg_node_1',
      type: 'messageNode',
      position: { x: 400, y: 150 },
      data: {
        blocks: [
          { id: 'b1', type: 'text', text: 'Welcome to our store!' },
        ],
        buttons: [
          { id: 'btn_1', text: 'View Catalog', actionType: 'quick_reply' },
        ],
      },
    },
  ],
  edges: [
    {
      id: 'edge_start_msg',
      source: 'start_node',
      target: 'msg_node_1',
    },
  ],
};
