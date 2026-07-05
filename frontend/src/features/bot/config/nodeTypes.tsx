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
} from '../components/nodes';

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
  START: StartNode,
  MESSAGE: MessageNode,
  CONDITION: ConditionNode,
  API_CALL: ApiCallNode,
  END: EndNode,
  ACTION: ActionNode,
  SMART_DELAY: SmartDelayNode,
  RANDOMIZER: RandomizerNode,
  START_AUTOMATION: StartAutomationNode,
  COMMENT: CommentNode,
  TEMP: TempNode,
};

