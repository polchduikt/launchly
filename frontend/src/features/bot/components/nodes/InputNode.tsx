import React from 'react';
import { Position, useEdges } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';

export const InputNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const text = data?.text || 'Please enter a value:';
  const variableName = data?.variableName || 'input';
  return (
    <div
      className={`w-64 bg-white/75 backdrop-blur-[2px] border-2 rounded-2xl p-4 shadow-sm transition-all relative overflow-visible isolate ${
        selected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
      }`}
    >
      <div className="relative flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id)}
          padded={true}
        />
        <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <MessageSquare size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">Input Prompt</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Save to Variable</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed break-words">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prompt Message</p>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 text-xs text-amber-900 flex justify-between items-center font-semibold">
          <span className="text-[9px] uppercase font-bold text-amber-500">Variable:</span>
          <span>{`{${variableName}}`}</span>
        </div>
      </div>

      <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100 relative">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">Next Step</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && edges.some((e) => e.source === id && (e.sourceHandle === 'next' || e.sourceHandle == null))}
          padded={true}
        />
      </div>
    </div>
  );
};
