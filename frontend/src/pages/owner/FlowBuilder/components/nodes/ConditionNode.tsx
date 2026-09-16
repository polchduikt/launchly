import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Filter } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData, ConditionBranch } from '../../../../../types/bot';
import { getOperatorLabel } from '../../../../../const/editorOptions';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const ConditionNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isReplyHandle = useConnection((s) => s.fromHandle?.id === 'reply');
  const isGrayedOut = isConnecting && (isSelfSource || isReplyHandle);
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const rawBranches = data?.branches;
  const branches: ConditionBranch[] = Array.isArray(rawBranches)
    ? rawBranches
    : (data?.variable
        ? [{ id: 'branch_0', matchType: 'all', conditions: [{ id: 'legacy', variable: data.variable, operator: data.operator, value: data.value }] }]
        : [{ id: 'branch_0', matchType: 'all', conditions: [] }]);

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected
          ? 'shadow-lg ring-2 ring-[#0A0A0A]'
          : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#C6F8ED]/75 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-teal-100/60 text-[#0F766E] flex items-center justify-center shrink-0">
          <Filter size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#0F766E]/70 uppercase tracking-wider block leading-none">
            {t('node.condition.category')}
          </span>
          <span className="text-xs font-bold text-[#095244] truncate block mt-0.5">
            {t('node.condition.filter_flow')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace] rounded-b-[22px]">
        {isZoomedOut ? (
          <div className="space-y-2 select-none pointer-events-none">
            {branches.map((branch: ConditionBranch, idx: number) => {
              const isBranchConnected = data?._tempSourceHandle !== `branch_${idx}` && sourceConns.some((c) => c.sourceHandle === `branch_${idx}`);
              return (
                <div key={branch.id || idx} className="relative bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-[11px] font-bold text-teal-800 flex items-center justify-between">
                  <span className="truncate">{branch.conditions?.[0]?.variable || `Branch ${idx + 1}`}</span>
                  <NodeHandle
                    type="source"
                    position={Position.Right}
                    id={`branch_${idx}`}
                    isConnected={isBranchConnected}
                    className={isBranchConnected ? '!bg-[#10B981] !border-[#10B981]' : '!bg-white !border-[#10B981]'}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((branch: ConditionBranch, idx: number) => {
              const conds = Array.isArray(branch.conditions) ? branch.conditions : [];
              return (
                <div key={branch.id || idx} className="relative">
                  {conds.length === 0 ? (
                    <div className="border-2 border-dashed border-[#0A0A0A]/40 rounded-2xl p-3 text-center text-[11px] text-[#0A0A0A]/60 font-bold select-none italic bg-[#F2EBDD]/40 cursor-pointer">
                      {t('node.condition.click_to_add')}
                    </div>
                  ) : (
                    <div className="space-y-2 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 pr-7">
                      {conds.map((cond, cIdx: number) => {
                        const displayVar = cond.variable
                          ? (cond.variable.charAt(0).toUpperCase() + cond.variable.slice(1).replace(/_/g, ' '))
                          : 'Select Field';
                        return (
                          <div key={cond.id || cIdx} className="text-xs font-extrabold text-[#0A0A0A] leading-normal flex flex-wrap gap-1.5 items-center">
                            <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A]">{displayVar}</span>
                            <span className="text-[#0A0A0A]/60 font-bold lowercase text-[11px]">{getOperatorLabel(cond.operator || 'is')}</span>
                            {cond.operator !== 'has_any_value' && cond.operator !== 'not_empty' && cond.operator !== 'is_unknown' && cond.operator !== 'empty' && (
                              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A] truncate max-w-[120px]">
                                {cond.value || '(empty)'}
                              </span>
                            )}
                            {cIdx < conds.length - 1 && (
                              <div className="w-full text-[9px] font-black text-[#0A0A0A]/40 uppercase tracking-wider my-0.5">
                                {branch.matchType === 'any' ? 'OR' : 'AND'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(() => {
                    const isBranchConnected = data?._tempSourceHandle !== `branch_${idx}` && sourceConns.some((c) => c.sourceHandle === `branch_${idx}`);
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
        )}

        <div className="relative pt-2.5 border-t border-[#0A0A0A]/10 flex flex-col gap-1">
          <div className="text-[10px] font-black uppercase text-[#0A0A0A]/60 leading-normal pr-6">
            {t('node.condition.does_not_match')}
          </div>
          {(() => {
            const isFallbackConnected = data?._tempSourceHandle !== 'fallback' && sourceConns.some((c) => c.sourceHandle === 'fallback');
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
ConditionNodeInner.displayName = 'ConditionNode';
export const ConditionNode = React.memo(ConditionNodeInner);
