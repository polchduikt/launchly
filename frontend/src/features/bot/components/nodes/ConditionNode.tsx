import React, { useState, useEffect } from 'react';
import { Position, useEdges, useConnection, useNodes } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Filter } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { getOperatorLabel } from '../../config/editorOptions';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';

export const ConditionNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const nodes = useNodes();
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');

  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const isSelf = isConnecting && connection.fromNode?.id === id;
  const { showToolbar, bindHover } = useNodeHover();
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const handleHoverEdge = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { source, target } = customEvent.detail;
        setIsHighlighted(source === id || target === id);
      } else {
        setIsHighlighted(false);
      }
    };
    window.addEventListener('flow-hover-edge', handleHoverEdge);
    return () => {
      window.removeEventListener('flow-hover-edge', handleHoverEdge);
    };
  }, [id]);

  const rawBranches = data?.branches;
  const branches = Array.isArray(rawBranches)
    ? rawBranches
    : (data?.variable
        ? [{ id: 'branch_0', matchType: 'all', conditions: [{ id: 'legacy', variable: data.variable, operator: data.operator, value: data.value }] }]
        : [{ id: 'branch_0', matchType: 'all', conditions: [] }]);

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/95 border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected
          ? 'border-indigo-500 ring-4 ring-indigo-500/10'
          : isHighlighted
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm'
            : 'border-slate-200 hover:border-slate-350'
      } ${isSelf ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#C6F8ED] border-b border-[#A1F0DC]/60 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id && nodes.some((n) => n.id === e.source))}
        />
        <span className="w-7 h-7 rounded-lg bg-teal-100/60 text-[#0F766E] flex items-center justify-center shrink-0">
          <Filter size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#0F766E]/70 uppercase tracking-wider block leading-none">
            Condition
          </span>
          <span className="text-xs font-bold text-[#095244] truncate block mt-0.5">
            Filter Flow
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 bg-white rounded-b-[22px]">
        <div className="space-y-3">
          {branches.map((branch, idx) => {
            const conds = Array.isArray(branch.conditions) ? branch.conditions : [];
            return (
              <div key={branch.id || idx} className="relative">
                {conds.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center text-[11px] text-slate-400 font-semibold select-none italic bg-slate-50/50 cursor-pointer">
                    Click to add a condition
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-50/75 border border-slate-150 rounded-xl p-2.5 pr-6">
                    {conds.map((cond, cIdx) => {
                      const displayVar = cond.variable
                        ? (cond.variable.charAt(0).toUpperCase() + cond.variable.slice(1).replace(/_/g, ' '))
                        : 'Select Field';
                      return (
                        <div key={cond.id || cIdx} className="text-[11px] font-extrabold text-slate-700 leading-normal flex flex-wrap gap-1 items-center">
                          <span className="text-indigo-650">{displayVar}</span>
                          <span className="text-slate-400 font-semibold lowercase">{getOperatorLabel(cond.operator || 'is')}</span>
                          {cond.operator !== 'has_any_value' && cond.operator !== 'not_empty' && cond.operator !== 'is_unknown' && cond.operator !== 'empty' && (
                            <span className="text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md font-bold text-[10px] truncate max-w-[120px]">
                              {cond.value || '(empty)'}
                            </span>
                          )}
                          {cIdx < conds.length - 1 && (
                            <div className="w-full text-[9px] font-bold text-slate-455 uppercase tracking-wider my-0.5">
                              {branch.matchType === 'any' ? 'OR' : 'AND'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {(() => {
                  const isBranchConnected = data?._tempSourceHandle !== `branch_${idx}` && edges.some((e) => e.source === id && e.sourceHandle === `branch_${idx}` && nodes.some((n) => n.id === e.target));
                  return (
                    <NodeHandle
                      type="source"
                      position={Position.Right}
                      id={`branch_${idx}`}
                      isConnected={isBranchConnected}
                      className={isBranchConnected ? '!bg-[#10B981] !border-[#10B981]' : '!bg-white !border-[#10B981] hover:!bg-teal-50'}
                    />
                  );
                })()}
              </div>
            );
          })}
        </div>

        <div className="relative pt-3 border-t border-slate-100 flex flex-col gap-1">
          <div className="text-[10px] font-extrabold text-slate-400 leading-normal pr-6">
            The contact doesn't match any of these conditions
          </div>
          {(() => {
            const isFallbackConnected = data?._tempSourceHandle !== 'fallback' && edges.some((e) => e.source === id && e.sourceHandle === 'fallback' && nodes.some((n) => n.id === e.target));
            return (
              <NodeHandle
                type="source"
                position={Position.Right}
                id="fallback"
                isConnected={isFallbackConnected}
                className={isFallbackConnected ? '!bg-[#EF4444] !border-[#EF4444]' : '!bg-white !border-[#EF4444] hover:!bg-rose-50'}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
};
