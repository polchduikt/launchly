import {
  MessageNode,
  InputNode,
  ConditionNode,
  OrderNode,
  LeadNode,
  ApiCallNode,
  EndNode,
} from '../../bot/components/nodes';
import { StartBroadcastNode, StartAutomationBroadcastNode } from '../components/nodes';

export const NODE_TYPES = {
  START_BROADCAST: StartBroadcastNode,
  MESSAGE: MessageNode,
  INPUT: InputNode,
  CONDITION: ConditionNode,
  ORDER: OrderNode,
  LEAD: LeadNode,
  API_CALL: ApiCallNode,
  END: EndNode,
  START_AUTOMATION: StartAutomationBroadcastNode,
};
