import type { Position } from '@xyflow/react';

export interface FlowSchemaResponse {
  id: number;
  version: number;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
}


export interface BotResponse {
  id: number;
  name: string;
  description: string | null;
  avatar: string | null;
  avatarPublicId: string | null;
  active: boolean;
  createdAt: string;
}

export interface BotDetailResponse extends BotResponse {
  telegramToken: string;
  flowSchema: FlowSchemaResponse | null;
}

export interface BotCreateRequest {
  name: string;
  description?: string;
  telegramToken: string;
}

export interface BotUpdateRequest {
  name: string;
  description?: string;
  telegramToken?: string;
}

export interface AutomationFlow {
  id: number;
  name: string;
  runs: string | number;
  ctr: string;
  modified: string;
  status: 'draft' | 'active';
}

export interface ApiCallNodeProps {
  selected?: boolean;
  data?: {
    url?: string;
    method?: string;
  };
}

export interface ConditionNodeProps {
  selected?: boolean;
  data?: {
    variable?: string;
    operator?: string;
    value?: string;
  };
}

export interface InputNodeProps {
  selected?: boolean;
  data?: {
    text?: string;
    variableName?: string;
  };
}

export interface ButtonData {
  label: string;
  value: string;
  actionType?: string;
  actionTarget?: string;
}

export interface EditButtonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  button: ButtonData | null;
  onSave: (updated: ButtonData) => void;
  onRemove: () => void;
}

export interface EndNodeProps {
  selected?: boolean;
}

export interface LeadNodeProps {
  selected?: boolean;
  data?: {
    name?: string;
    email?: string;
    phone?: string;
    text?: string;
  };
}

export interface MessageNodeProps {
  selected?: boolean;
  data?: {
    text?: string;
    imageUrl?: string;
    buttons?: ButtonData[];
  };
}

export interface OrderNodeProps {
  selected?: boolean;
  data?: {
    productName?: string;
    price?: string;
    currency?: string;
    text?: string;
  };
}

export interface StartNodeProps {
  selected?: boolean;
}

export interface CustomNodeData {
  text?: string;
  imageUrl?: string;
  buttons?: Array<{ label: string; value: string }>;
  variableName?: string;
  variable?: string;
  operator?: string;
  value?: string;
  productName?: string;
  price?: string;
  currency?: string;
  name?: string;
  email?: string;
  phone?: string;
  url?: string;
  method?: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
  automationName?: string;
  [key: string]: unknown;
}

export interface BotState {
  activeBotId: number | null;
  setActiveBotId: (id: number | null) => void;
  clearBots: () => void;
}

export interface NodeHandleProps {
  type: 'source' | 'target';
  position: Position;
  id?: string;
  isConnected?: boolean;
  className?: string;
  padded?: boolean;
}

