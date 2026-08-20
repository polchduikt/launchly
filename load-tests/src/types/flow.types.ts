export type NodeType =
  | 'START'
  | 'MESSAGE'
  | 'BUTTON'
  | 'INPUT'
  | 'CONDITION'
  | 'ACTION'
  | 'SMART_DELAY'
  | 'RANDOMIZER'
  | 'AI'
  | 'API_CALL'
  | 'LEAD'
  | 'ORDER'
  | 'END'
  | 'COMMENT'
  | 'START_BROADCAST'
  | 'START_AUTOMATION';

export interface Position {
  x: number;
  y: number;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  data: Record<string, any>;
  position: Position;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export interface FlowDiagram {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface BotResponse {
  id: string;
  name: string;
  telegramBotUsername: string;
  telegramBotToken: string;
  flowDiagram: FlowDiagram;
  active: boolean;
  ownerId: string;
  createdAt: string;
}

export interface SaveFlowRequest {
  flowDiagram: FlowDiagram;
}
