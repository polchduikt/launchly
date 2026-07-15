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
  AiNode,
} from '../components/nodes';

const withCollaborationWrapper = <P extends { id: string; data?: any; selected?: boolean }>(
  WrappedComponent: React.ComponentType<P>
) => {
  const ComponentWithCollaboration: React.FC<P> = (props) => {
    const collaborator = props.data?._collaborator;
    const isEditing = !!collaborator;

    return (
      <div className="relative">
        {isEditing && (
          <div className="absolute -top-7 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-violet-600 text-white text-[10px] font-extrabold rounded-full shadow-lg z-50 animate-in slide-in-from-bottom-2 duration-150 border border-white select-none">
            {collaborator.avatar ? (
              <img
                src={collaborator.avatar}
                alt={collaborator.name}
                className="w-3.5 h-3.5 rounded-full object-cover border border-white/40"
              />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-violet-800 text-violet-200 flex items-center justify-center font-bold text-[8px] border border-white/40">
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[120px]">{collaborator.name} is editing</span>
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

export const NODE_TYPES = {
  START: withCollaborationWrapper(StartNode),
  MESSAGE: withCollaborationWrapper(MessageNode),
  CONDITION: withCollaborationWrapper(ConditionNode),
  API_CALL: withCollaborationWrapper(ApiCallNode),
  END: withCollaborationWrapper(EndNode),
  ACTION: withCollaborationWrapper(ActionNode),
  SMART_DELAY: withCollaborationWrapper(SmartDelayNode),
  RANDOMIZER: withCollaborationWrapper(RandomizerNode),
  START_AUTOMATION: withCollaborationWrapper(StartAutomationNode),
  COMMENT: withCollaborationWrapper(CommentNode),
  AI: withCollaborationWrapper(AiNode),
  TEMP: TempNode,
};


