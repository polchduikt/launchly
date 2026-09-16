import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { UserCheck } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const JoinRequestNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isReplyHandle = useConnection((s) => s.fromHandle?.id === 'reply');
  const isGrayedOut = isConnecting && (isSelfSource || isReplyHandle);
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const autoApprove = data?.autoApprove !== false;
  const channelId = (data?.channelId as string) || '';

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#FAF7EE] shadow-[6px_6px_0px_0px_#0A0A0A]' : 'shadow-[4px_4px_0px_0px_#0A0A0A]'
      } ${isGrayedOut ? 'opacity-30' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#FEF3C7]/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-sm border border-amber-300">
          <UserCheck size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-amber-900/80 uppercase tracking-wider block leading-none">
            {t('node.join_request.trigger', 'Тригер події')}
          </span>
          <span className="text-xs font-bold text-amber-950 truncate block mt-0.5">
            {t('node.join_request.title', 'Заявка на вступ')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-[11px] font-bold text-amber-900 flex items-center justify-between select-none">
            <span className="truncate">
              {t('node.join_request.zoomed_desc', 'Авто-схвалення заявок')}
            </span>
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#0A0A0A]/70">
              <span>{t('node.join_request.status_label', 'Схвалення')}:</span>
              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                {autoApprove ? t('common.enabled', 'Увімкнено') : t('common.disabled', 'Вимкнено')}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#0A0A0A]/70">
              <span>{t('node.join_request.channel_label', 'Канал')}:</span>
              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A] max-w-[120px] truncate">
                {channelId ? channelId : t('node.join_request.any_channel', 'Всі канали')}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-[#F2EBDD] select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider mr-2 font-['Anybody',sans-serif]">
          {t('node.start.then', 'Потім')}
        </span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && sourceConns.some((c) => c.sourceHandle === 'next')}
          padded={false}
        />
      </div>
    </div>
  );
};

JoinRequestNodeInner.displayName = 'JoinRequestNode';
export const JoinRequestNode = React.memo(JoinRequestNodeInner);