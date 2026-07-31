import type { Node } from '@xyflow/react';
import type { UseFormReturn } from 'react-hook-form';
import type { BotResponse } from './bot';

import type { FilterType, CampaignStatus } from '../enums/broadcast.enums';
export type { FilterType, CampaignStatus };

export interface CampaignResponse {
  id: number;
  name: string;
  message?: string;
  status: CampaignStatus;
  filterType: FilterType;
  filterValue?: string;
  scheduledAt?: string;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  botId: number;
  nodes?: string;
  edges?: string;
  targetAllBots: boolean;
  blocked?: boolean;
  blockReason?: string;
  blockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  message?: string;
  filterType: FilterType;
  filterValue?: string;
  scheduledAt?: string;
  nodes?: string;
  edges?: string;
  botId?: number;
  targetAllBots?: boolean;
}

export interface TagResponse {
  id: number | string;
  name: string;
  botId?: number;
}

export interface CreateTagRequest {
  name: string;
}

export interface AudienceCondition {
  id: string;
  field: 'tag' | 'opt_in' | 'order' | 'lead' | 'source' | 'paused' | 'optedInTelegram' | 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone' | 'id' | 'telegramUserId' | 'telegramUsername' | 'createdAt' | string;
  operator: 'is' | 'is_not' | 'contains' | 'begins with' | "doesn't contain" | 'has any value' | 'is unknown' | 'after' | 'before' | string;
  value: string;
}

export interface CustomNodeData {
  text?: string;
  imageUrl?: string;
  nodeTitle?: string;
  buttonLabel?: string;
  waitingForReply?: boolean;
  actionsList?: string[];
  automationName?: string;
  onSelectClick?: () => void;
  [key: string]: unknown;
}

export type CustomNode = Node<CustomNodeData>;

export interface CreateCampaignFields {
  name: string;
  message: string;
  filterType: 'ALL' | 'BY_TAG' | 'HAS_ORDERS' | 'HAS_LEADS';
  filterValue?: string;
  scheduledAt?: string;
}

export interface CreateBroadcastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  form: UseFormReturn<CreateCampaignFields>;
  isCreating: boolean;
  createError: Error | null;
  tags: TagResponse[];
  bots: BotResponse[];
}

export interface StatusBadgeProps {
  status: string;
}
