import {
  MessageNode,
  ConditionNode,
  ApiCallNode,
  EndNode,
  ActionNode,
  SmartDelayNode,
  RandomizerNode,
  CommentNode,
} from '../../bot/components/nodes';
import { StartBroadcastNode, StartAutomationBroadcastNode } from '../components/nodes';

export const NODE_TYPES = {
  START_BROADCAST: StartBroadcastNode,
  MESSAGE: MessageNode,
  INPUT: MessageNode,
  CONDITION: ConditionNode,
  ORDER: MessageNode,
  LEAD: MessageNode,
  API_CALL: ApiCallNode,
  END: EndNode,
  ACTION: ActionNode,
  SMART_DELAY: SmartDelayNode,
  RANDOMIZER: RandomizerNode,
  COMMENT: CommentNode,
  START_AUTOMATION: StartAutomationBroadcastNode,
};
