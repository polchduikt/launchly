import type { Node, Edge } from '@xyflow/react';

export interface GroqMessage {
  id?: number;
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
  createdAt?: string;
}

export interface AiChatMessage {
  id: number;
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
  createdAt: string;
}

export interface AiChatSessionResponse {
  id: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string | null;
}

export interface AiChatSessionDetailResponse {
  id: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessage[];
}

export interface CreateAiSessionRequest {
  title?: string;
}

export interface UpdateAiSessionRequest {
  title: string;
}

export interface AiChatRequest {
  sessionId?: number;
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
  sessionId?: number;
  sessionTitle?: string;
  reply: string;
  usage?: AiUsageResponse;
  messages?: AiChatMessage[];
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

export interface AiChatSession {
  id: number | string;
  title: string;
  messages: GroqMessage[];
  createdAt: number;
}

export interface AiState {
  isOpen: boolean;
  activeTab: 'chat' | 'generator';
  onGenerate: ((nodes: unknown[], edges: unknown[]) => void) | null;
  hasExistingNodes: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'chat' | 'generator') => void;
  setOnGenerate: (onGenerate: ((nodes: unknown[], edges: unknown[]) => void) | null) => void;
  setHasExistingNodes: (hasExistingNodes: boolean) => void;
}
