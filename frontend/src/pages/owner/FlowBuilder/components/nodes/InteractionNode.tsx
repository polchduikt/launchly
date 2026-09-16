import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { HeartHandshake } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const InteractionNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isGrayedOut = isConnecting && isSelfSource;
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const interactionType = (data?.interactionType as string) || 'like';
  const checkMutual = data?.checkMutual !== undefined ? Boolean(data.checkMutual) : true;

  const isMutualConnected = data?._tempSourceHandle !== 'mutual' && sourceConns.some((c) => c.sourceHandle === 'mutual');
  const isSavedConnected = data?._tempSourceHandle !== 'saved' && sourceConns.some((c) => c.sourceHandle === 'saved');

  const getInteractionBadge = () => {
    switch (interactionType) {
      case 'like':
        return { label: t('editor.interaction.type_like', 'Лайк'), bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'dislike':
        return { label: t('editor.interaction.type_dislike', 'Пропустити'), bg: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'favorite':
        return { label: t('editor.interaction.type_favorite', 'В обране'), bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'viewed':
        return { label: t('editor.interaction.type_viewed', 'Переглянуто'), bg: 'bg-sky-100 text-sky-800 border-sky-300' };
      default:
        return { label: interactionType, bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    }
  };

  const badge = getInteractionBadge();

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected ? 'shadow-lg ring-2 ring-[#0A0A0A]' : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#FCE7F3]/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-pink-200 text-pink-800 flex items-center justify-center shrink-0">
          <HeartHandshake size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-pink-800/80 uppercase tracking-wider block leading-none">
            {t('node.interaction.category', 'Взаємодія')}
          </span>
          <span className="text-xs font-bold text-pink-950 truncate block mt-0.5">
            {t('node.title.interaction', 'Взаємодія')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-pink-800 truncate select-none">
            {badge.label}
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                {t('node.interaction.action_type', 'Дія')}
              </span>
              <span className={`px-2 py-0.5 border rounded-lg text-[11px] font-black ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          {checkMutual && (
            <div className="relative flex items-center justify-between bg-slate-100 border-2 border-slate-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 select-none">
              <span>{t('node.interaction.mutual', 'Якщо взаємно')}</span>
              <NodeHandle
                type="source"
                position={Position.Right}
                id="mutual"
                isConnected={isMutualConnected}
                className={isMutualConnected ? '!bg-rose-600 !border-rose-600' : '!bg-white !border-rose-600'}
              />
            </div>
          )}

          <div className="relative flex items-center justify-between bg-slate-100 border-2 border-slate-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 select-none">
            <span>{t('node.interaction.saved', 'Збережено')}</span>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="saved"
              isConnected={isSavedConnected}
              className={isSavedConnected ? '!bg-slate-600 !border-slate-600' : '!bg-white !border-slate-600'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const InteractionNode = React.memo(InteractionNodeInner);
