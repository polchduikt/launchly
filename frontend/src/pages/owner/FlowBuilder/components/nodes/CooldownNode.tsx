import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Hourglass } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const CooldownNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isGrayedOut = isConnecting && isSelfSource;
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const duration = data?.duration !== undefined ? Number(data.duration) : 1;
  const unit = (data?.unit as string) || 'MINUTES';
  const blockMessage = (data?.blockMessage as string) || 'Зачекайте ще {remaining} перед повторною спробою!';
  const cooldownKey = (data?.cooldownKey as string) || '';

  const getUnitLabel = (u: string, d: number) => {
    switch (u.toUpperCase()) {
      case 'SECONDS':
        return d === 1 ? 'секунда' : d >= 2 && d <= 4 ? 'секунди' : 'секунд';
      case 'HOURS':
        return d === 1 ? 'година' : d >= 2 && d <= 4 ? 'години' : 'годин';
      case 'DAYS':
        return d === 1 ? 'день' : d >= 2 && d <= 4 ? 'дні' : 'днів';
      default:
        return d === 1 ? 'хвилина' : d >= 2 && d <= 4 ? 'хвилини' : 'хвилин';
    }
  };

  const formattedInterval = `${duration} ${getUnitLabel(unit, duration)}`;

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

      <div className="relative flex items-center gap-2 bg-amber-100/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
          <Hourglass size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-amber-800/80 uppercase tracking-wider block leading-none">
            {t('node.cooldown.category', 'Ліміт часу')}
          </span>
          <span className="text-xs font-bold text-amber-950 truncate block mt-0.5">
            {t('node.title.cooldown', 'Таймаут')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-amber-900 truncate select-none">
            {formattedInterval}
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                {t('node.cooldown.duration_label', 'Очікування:')}
              </span>
              <span className="px-2 py-0.5 bg-amber-200/80 border border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A]">
                {formattedInterval}
              </span>
            </div>

            {cooldownKey && (
              <div className="flex items-center justify-between pt-1 border-t border-[#0A0A0A]/10">
                <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                  {t('node.cooldown.key_label', 'Ключ:')}
                </span>
                <span className="px-1.5 py-0.5 bg-white border border-[#0A0A0A]/30 rounded text-[10px] font-bold text-[#0A0A0A]">
                  {cooldownKey}
                </span>
              </div>
            )}

            <div className="pt-1.5 border-t border-[#0A0A0A]/10">
              <span className="text-[9px] font-black uppercase text-[#0A0A0A]/60 block mb-1">
                {t('node.cooldown.block_msg_label', 'Якщо зарано:')}
              </span>
              <div className="p-1.5 bg-white/80 border border-[#0A0A0A]/20 rounded-lg text-[10px] font-medium text-[#0A0A0A] line-clamp-2 leading-snug">
                {blockMessage}
              </div>
            </div>
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

CooldownNodeInner.displayName = 'CooldownNode';
export const CooldownNode = React.memo(CooldownNodeInner);
