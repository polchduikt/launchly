import type { CSSProperties } from 'react';
import type { Position, Node, Edge } from '@xyflow/react';

export interface FlowSchemaResponse {
  id: number;
  version: number;
  nodes: Node[];
  edges: Edge[];
}

export interface BotResponse {
  id: number;
  name: string;
  username?: string | null;
  description: string | null;
  avatar: string | null;
  avatarPublicId: string | null;
  active: boolean;
  blocked?: boolean;
  blockReason?: string | null;
  blockedAt?: string;
  createdAt: string;
  updatedAt?: string;
  totalUsers: number;
  runs?: number;
  stats?: {
    users?: number;
    messages?: number;
    broadcasts?: number;
    [key: string]: unknown;
  };
  hasTelegramToken: boolean;
  role?: string | null;
  isTemplate?: boolean;
  templateName?: string | null;
}

export interface BotDetailResponse extends BotResponse {
  telegramToken: string;
  flowSchema: FlowSchemaResponse | null;
  isTemplate?: boolean;
  templateName?: string | null;
}

export interface BotCreateRequest {
  name: string;
  description?: string;
  telegramToken?: string;
  copyTokenFromBotId?: number;
}

export interface BotUpdateRequest {
  name: string;
  description?: string;
  telegramToken?: string;
  copyTokenFromBotId?: number;
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
  row?: string;
  productName?: string;
  price?: string;
  currency?: string;
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
  pickEveryTime?: boolean;
  variations?: Array<{ id: string; label: string; percentage: number; color: string; }>;
  noteSize?: 'S' | 'M' | 'L';
  fontSize?: 'S' | 'L';
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
  style?: CSSProperties;
}

export interface EditButtonDrawerProps {
  onClose: () => void;
  button: ButtonData | null;
  onSave: (updated: ButtonData) => void;
  onRemove: () => void;
  edges?: Edge[];
  nodes?: Node[];
  nodeId?: string;
  onUnlinkConnection?: (btnValue: string) => void;
}

export interface FlowBlock {
  [key: string]: unknown;
  id: string;
  type: string;
  text?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  audioUrl?: string;
  videoUrl?: string;
  delaySeconds?: number;
  variableName?: string;
  buttons?: ButtonData[];
}

export interface BotUserResponse {
  id: number;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  currentNodeId: string | null;
  photoUrl: string | null;
  metadata: string;
  tags: string[];
  createdAt: string;
}

export interface BotUserUpdateRequest {
  firstName?: string;
  lastName?: string;
  metadata?: string;
  tags?: string[];
}

export interface BotUserCreateRequest {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  tags?: string[];
}

export interface ActionItem {
  type: string;
  tagId?: string;
  tagName?: string;
  fieldName?: string;
  fieldValue?: string;
  spreadsheetId?: string;
  sheetName?: string;
  columnMappings?: Array<{ column: string; value: string }>;
  lookupColumn?: string;
  lookupValue?: string;
}

export type ConditionBranch = {
  id?: string;
  matchType?: string;
  conditions?: Array<{
    id?: string;
    variable?: string;
    operator?: string;
    value?: string;
    caseSensitive?: boolean;
  }>;
};

export interface EditorState {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

export interface ConditionNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
  editorState?: EditorState;
}

export interface RandomizerNodeEditorProps {
  nodeId: string;
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
  editorState?: EditorState;
}

export interface SmartDelayNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
  editorState?: EditorState;
}

export interface ActionNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
  editorState?: EditorState;
}

export interface ChooseNextStepDrawerProps {
  onClose: () => void;
  onSelectStep: (type: string) => void;
  isNested?: boolean;
}

export interface GoogleSheetsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsAction: ActionItem;
  isGoogleSheetsConnected: boolean;
  isLoadingSpreadsheets: boolean;
  spreadsheets: { id: string; name: string }[];
  spreadsheetsError: string;
  isLoadingWorksheets: boolean;
  worksheets: string[];
  worksheetsError: string;
  isLoadingHeaders: boolean;
  headers: string[];
  tags: Array<{ id: number | string; name: string }>;
  customFields: string[];
  handleSpreadsheetChange: (id: string) => void;
  handleWorksheetChange: (name: string) => void;
  handleRefreshHeaders: () => void;
  handleMappingValueChange: (header: string, val: string) => void;
  handleSaveSheetsConfig: () => void;
  handleReconnectGoogleSheets: () => void;
  handleLookupColumnChange: (lookupColumn: string) => void;
  handleLookupValueChange: (lookupValue: string) => void;
}

export interface SetUserFieldPopoverProps {
  fieldName: string;
  fieldValue: string;
  userFields: Array<{ name: string; type: string; description: string }>;
  tags: Array<{ id: number | string; name: string }>;
  onClose: () => void;
  onSave: (fields: { fieldName?: string; fieldValue?: string }) => void;
  onCreateNewField: () => void;
  hideValue?: boolean;
}

export interface TagSearchSelectProps {
  tagName: string;
  tags: Array<{ id: number | string; name: string }>;
  onChange: (tag: { id: number | string; name: string }) => void;
  onCreateTag: () => void;
}

export interface Folder {
  id: number | string;
  name: string;
}

export interface TagFolder {
  id: string;
  name: string;
  tagsCount?: number;
}

export interface UserField {
  id?: number | string;
  name: string;
  type: string;
  value?: string;
  description?: string;
  folderId?: string | null;
  folder?: string | null;
}

export interface UserFieldFolder {
  id: string;
  name: string;
  fieldsCount?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string;
  buttons?: ButtonData[];
  buttonsConsumed?: boolean;
  isUser?: boolean;
  nodeId?: string;
}

export interface PathChoice {
  title: string;
  subtitle: string;
  options: Array<{ label: string; value: string; percentage?: number; color?: string }>;
  sourceNodeId: string;
}






