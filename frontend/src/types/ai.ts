import type { Node, Edge } from '@xyflow/react';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  message: string;
  history?: GroqMessage[];
}

export interface AiUsageResponse {
  tokensUsed: number;
  tokenLimit: number;
  tokensRemaining: number;
  remainingPercentage: number;
  resetsAt: string;
}

export interface AiChatResponse {
  reply: string;
  usage?: AiUsageResponse;
}

export interface AiSchemaRequest {
  prompt: string;
  description?: string;
}

export interface AiSchemaResponse {
  nodes: Node[];
  edges: Edge[];
  usage?: AiUsageResponse;
}

export interface AiFlowGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (nodes: Node[], edges: Edge[]) => void;
  hasExistingNodes: boolean;
}

export interface AiState {
  isOpen: boolean;
  messages: GroqMessage[];
  activeTab: 'chat' | 'generator';
  onGenerate: ((nodes: unknown[], edges: unknown[]) => void) | null;
  hasExistingNodes: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addMessage: (message: GroqMessage) => void;
  clearMessages: () => void;
  setActiveTab: (tab: 'chat' | 'generator') => void;
  setOnGenerate: (onGenerate: ((nodes: unknown[], edges: unknown[]) => void) | null) => void;
  setHasExistingNodes: (hasExistingNodes: boolean) => void;
}
