import { MarkerType } from '@xyflow/react';
import { InteractiveEdge } from '../pages/owner/FlowBuilder/components/edges/InteractiveEdge';

export const FLOW_EDGE_DEFAULTS = {
  type: 'default',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: '#64748b',
  },
  style: {
    strokeWidth: 2.4,
    stroke: '#64748b',
  },
};

export const EDGE_TYPES = {
  default: InteractiveEdge,
  smoothstep: InteractiveEdge,
};

