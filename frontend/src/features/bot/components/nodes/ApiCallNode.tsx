import React from 'react';
import { Position, useEdges } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { API_METHOD_COLORS } from '../../config/editorOptions';

export const ApiCallNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const url = data?.url || 'https://api.example.com/endpoint';
  const method = data?.method || 'GET';

  return (
    <div
      className={`w-64 bg-white/75 backdrop-blur-[2px] border-2 rounded-2xl p-4 shadow-sm transition-all relative overflow-visible isolate ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <div className="relative flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id)}
          padded={true}
        />
        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
          <Globe size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">API Call</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">HTTP Integration</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            <span>Request info</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border ${API_METHOD_COLORS[method.toUpperCase()] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              {method}
            </span>
          </div>
          <div className="text-slate-800 break-all text-[11px] font-mono select-all bg-white border border-slate-100 p-1.5 rounded-lg">
            {url}
          </div>
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
