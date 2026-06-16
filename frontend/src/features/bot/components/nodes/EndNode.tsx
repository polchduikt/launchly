import React from 'react';
import { Position, useEdges } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Octagon } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';

export const EndNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected }) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  return (
    <div
      className={`w-64 bg-white/75 backdrop-blur-[2px] border-2 rounded-2xl p-4 shadow-sm transition-all relative overflow-visible isolate ${
        selected ? 'border-slate-400 ring-2 ring-slate-100' : 'border-slate-200'
      }`}
    >
      <div className="relative flex items-center gap-2 mb-3">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id)}
          padded={true}
        />
        <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
          <Octagon size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">Flow End</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Terminate Walk</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 leading-relaxed text-center font-semibold select-none">
        Bot stops executing and closes session.
      </div>
    </div>
  );
};
