import type { Node, Edge } from '@xyflow/react';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  message: string;
  history?: GroqMessage[];
}

export interface AiChatResponse {
  reply: string;
  requestsUsed: number;
  requestsLimit: number;
}

export interface AiSchemaRequest {
  description: string;
  history?: GroqMessage[];
}

export interface AiSchemaResponse {
  nodes: Node[];
  edges: Edge[];
  requestsUsed: number;
  requestsLimit: number;
}

export interface AiUsageResponse {
  requestsUsed: number;
  requestsLimit: number;
  resetsAt: string;
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
  onGenerate: ((nodes: any[], edges: any[]) => void) | null;
  hasExistingNodes: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addMessage: (message: GroqMessage) => void;
  clearMessages: () => void;
  setActiveTab: (tab: 'chat' | 'generator') => void;
  setOnGenerate: (onGenerate: ((nodes: any[], edges: any[]) => void) | null) => void;
  setHasExistingNodes: (hasExistingNodes: boolean) => void;
}
