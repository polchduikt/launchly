import { MarkerType } from '@xyflow/react';
import { InteractiveEdge } from '../pages/owner/FlowBuilder/components/edges/InteractiveEdge';

export const FLOW_EDGE_DEFAULTS = {
  type: 'default',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: '#7b8794',
  },
  style: {
    strokeWidth: 2.2,
    stroke: '#7b8794',
  },
};

export const EDGE_TYPES = {
  default: InteractiveEdge,
  smoothstep: InteractiveEdge,
};

