import { MarkerType } from '@xyflow/react';

export const FLOW_EDGE_DEFAULTS = {
  type: 'default',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: '#7b8794',
  },
  style: {
    strokeWidth: 1.6,
    stroke: '#7b8794',
  },
};
