import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Trophy } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const LeaderboardNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isGrayedOut = isConnecting && isSelfSource;
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const targetField = (data?.targetField as string) || '';
  const limit = data?.limit || 10;
  const showRank = data?.showRank !== undefined ? Boolean(data.showRank) : true;
  const showScores = data?.showScores !== undefined ? Boolean(data.showScores) : true;

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

      <div className="relative flex items-center gap-2 bg-fuchsia-100/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-fuchsia-200/70 text-fuchsia-800 flex items-center justify-center shrink-0">
          <Trophy size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-fuchsia-800/80 uppercase tracking-wider block leading-none">
            {t('node.leaderboard.category', 'Gamification')}
          </span>
          <span className="text-xs font-bold text-fuchsia-950 truncate block mt-0.5">
            {t('node.title.leaderboard', 'Leaderboard')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-fuchsia-800 truncate select-none">
            TOP {limit} {targetField ? `by ${targetField}` : ''}
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                {t('node.leaderboard.field', 'Rank by')}
              </span>
              {targetField ? (
                <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A]">
                  {targetField}
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-white/60 border border-dashed border-[#0A0A0A]/40 rounded-lg text-xs font-bold text-[#0A0A0A]/60 italic">
                  {t('node.leaderboard.no_field_selected', 'Не обрано')}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#0A0A0A]/10">
              <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                {t('node.leaderboard.limit', 'Count')}
              </span>
              <span className="text-xs font-bold text-[#0A0A0A]">
                ТОП-{limit}
              </span>
            </div>

            {(!showRank || !showScores) && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-[#0A0A0A]/10 text-[9px] font-black">
                {!showRank && (
                  <span className="px-1.5 py-0.5 bg-fuchsia-200/50 text-fuchsia-950 rounded border border-fuchsia-300">
                    Без нумерації
                  </span>
                )}
                {!showScores && (
                  <span className="px-1.5 py-0.5 bg-fuchsia-200/50 text-fuchsia-950 rounded border border-fuchsia-300">
                    Без балів
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-transparent select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2 select-none">
          {t('flow_builder.next_step')}
        </span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && sourceConns.some((c) => c.sourceHandle === 'next')}
        />
      </div>
    </div>
  );
};

LeaderboardNodeInner.displayName = 'LeaderboardNode';
export const LeaderboardNode = React.memo(LeaderboardNodeInner);