import React from 'react';
import { Position, useEdges } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { GitFork } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { getOperatorLabel } from '../../config/editorOptions';

export const ConditionNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const variable = data?.variable || 'variable';
  const operator = data?.operator || 'equals';
  const value = data?.value || '';

  return (
    <div
      className={`w-64 bg-white/75 backdrop-blur-[2px] border-2 rounded-2xl p-4 shadow-sm transition-all relative overflow-visible isolate ${
        selected ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200'
      }`}
    >
      <div className="relative flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id)}
          padded={true}
        />
        <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <GitFork size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">Condition</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Branch Execution</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            <span>Check variable</span>
          </div>
          <div className="text-slate-800 font-bold">{`{${variable}}`}</div>
          <div className="text-indigo-600 text-[10px] uppercase font-bold tracking-wider my-0.5">
            {getOperatorLabel(operator)}
          </div>
          {operator !== 'not_empty' && operator !== 'empty' && (
            <div className="text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-lg text-center truncate">
              {value || '(empty)'}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-3 mt-2 border-t border-slate-100">
        <div className="relative flex justify-end items-center text-xs font-bold text-emerald-600 py-1 pr-6">
          <span>True / Yes</span>
          <NodeHandle
            type="source"
            position={Position.Right}
            id="true"
            isConnected={data?._tempSourceHandle !== 'true' && edges.some((e) => e.source === id && e.sourceHandle === 'true')}
            padded={true}
          />
        </div>
        <div className="relative flex justify-end items-center text-xs font-bold text-rose-600 py-1 pr-6">
          <span>False / No</span>
          <NodeHandle
            type="source"
            position={Position.Right}
            id="false"
            isConnected={data?._tempSourceHandle !== 'false' && edges.some((e) => e.source === id && e.sourceHandle === 'false')}
            padded={true}
          />
        </div>
      </div>
    </div>
  );
};
