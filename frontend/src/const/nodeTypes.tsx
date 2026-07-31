import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  StartNode,
  MessageNode,
  ConditionNode,
  ApiCallNode,
  EndNode,
  ActionNode,
  SmartDelayNode,
  RandomizerNode,
  CommentNode,
  StartAutomationNode,
  StartBroadcastNode,
  AiNode,
} from '../pages/owner/FlowBuilder/components/nodes';

const withCollaborationWrapper = <P extends { id: string; data?: Record<string, unknown>; selected?: boolean }>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithCollaboration: React.FC<P> = (props) => {
    const collaborator = (props.data as Record<string, any>)?._collaborator;
    const isEditing = !!collaborator;

    return (
      <div className="relative">
        {isEditing && collaborator && (
          <div className="absolute -top-7 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-violet-600 text-white text-[10px] font-extrabold rounded-full shadow-lg z-50 animate-in slide-in-from-bottom-2 duration-150 border border-white select-none">
            {collaborator.avatar ? (
              <img
                src={collaborator.avatar}
                alt={collaborator.name || 'User'}
                className="w-3.5 h-3.5 rounded-full object-cover border border-white/40"
              />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-violet-800 text-violet-200 flex items-center justify-center font-bold text-[8px] border border-white/40">
                {(collaborator.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[120px]">{collaborator.name || 'User'} is editing</span>
          </div>
        )}
        <div
          className={`transition-all duration-200 rounded-[24px] ${
            isEditing
              ? 'ring-4 ring-violet-500 ring-offset-2 shadow-lg shadow-violet-500/25'
              : ''
          }`}
        >
          <WrappedComponent {...props} />
        </div>
      </div>
    );
  };
  const MemoizedComponentWithCollaboration = React.memo(ComponentWithCollaboration);
  MemoizedComponentWithCollaboration.displayName = `withCollaborationWrapper(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return MemoizedComponentWithCollaboration;
};

export const TempNode: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: 10, height: 10, opacity: 0, pointerEvents: 'none' }}>
      <Handle
        type="target"
        position={Position.Left}
        id="temp_target"
        style={{ opacity: 0, width: 10, height: 10, minWidth: 10, minHeight: 10 }}
      />
    </div>
  );
};

const StartNodeWrapped = withCollaborationWrapper(StartNode);
const StartBroadcastNodeWrapped = withCollaborationWrapper(StartBroadcastNode);
const MessageNodeWrapped = withCollaborationWrapper(MessageNode);
const ConditionNodeWrapped = withCollaborationWrapper(ConditionNode);
const ApiCallNodeWrapped = withCollaborationWrapper(ApiCallNode);
const EndNodeWrapped = withCollaborationWrapper(EndNode);
const ActionNodeWrapped = withCollaborationWrapper(ActionNode);
const SmartDelayNodeWrapped = withCollaborationWrapper(SmartDelayNode);
const RandomizerNodeWrapped = withCollaborationWrapper(RandomizerNode);
const StartAutomationNodeWrapped = withCollaborationWrapper(StartAutomationNode);
const CommentNodeWrapped = withCollaborationWrapper(CommentNode);
const AiNodeWrapped = withCollaborationWrapper(AiNode);

export const NODE_TYPES = {
  START: StartNodeWrapped,
  start: StartNodeWrapped,
  Start: StartNodeWrapped,

  START_BROADCAST: StartBroadcastNodeWrapped,
  start_broadcast: StartBroadcastNodeWrapped,
  StartBroadcast: StartBroadcastNodeWrapped,

  MESSAGE: MessageNodeWrapped,
  message: MessageNodeWrapped,
  Message: MessageNodeWrapped,

  CONDITION: ConditionNodeWrapped,
  condition: ConditionNodeWrapped,
  Condition: ConditionNodeWrapped,

  API_CALL: ApiCallNodeWrapped,
  api_call: ApiCallNodeWrapped,
  ApiCall: ApiCallNodeWrapped,

  END: EndNodeWrapped,
  end: EndNodeWrapped,
  End: EndNodeWrapped,

  ACTION: ActionNodeWrapped,
  action: ActionNodeWrapped,
  Action: ActionNodeWrapped,

  SMART_DELAY: SmartDelayNodeWrapped,
  smart_delay: SmartDelayNodeWrapped,
  SmartDelay: SmartDelayNodeWrapped,

  RANDOMIZER: RandomizerNodeWrapped,
  randomizer: RandomizerNodeWrapped,
  Randomizer: RandomizerNodeWrapped,

  START_AUTOMATION: StartAutomationNodeWrapped,
  start_automation: StartAutomationNodeWrapped,
  StartAutomation: StartAutomationNodeWrapped,

  COMMENT: CommentNodeWrapped,
  comment: CommentNodeWrapped,
  Comment: CommentNodeWrapped,

  AI: AiNodeWrapped,
  ai: AiNodeWrapped,
  Ai: AiNodeWrapped,

  TEMP: TempNode,
  temp: TempNode,
};


