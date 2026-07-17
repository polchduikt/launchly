import React, { useMemo } from 'react';
import { Position, useNodeConnections, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../i18n';

const SmartDelayNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ handleType: 'source' });
  const targetConns = useNodeConnections({ handleType: 'target' });

  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const isGrayedOut = useMemo(() => {
    if (!isConnecting) return false;
    if (connection.fromNode?.id === id) return true;
    const sourceHandleId = connection.fromHandle?.id;
    if (sourceHandleId === 'reply') {
      return true;
    }
    return false;
  }, [isConnecting, connection, id]);
  const { showToolbar, bindHover } = useNodeHover();

  const mode = typeof data?.mode === 'string' ? data.mode : 'duration';
  const waitAmount = typeof data?.waitAmount === 'number' || typeof data?.waitAmount === 'string' ? data.waitAmount : 12;
  const waitUnit = typeof data?.waitUnit === 'string' ? data.waitUnit : 'Hours';
  const dateTimeStr = typeof data?.dateTime === 'string' ? data.dateTime : '';

  const formattedDateTime = useMemo(() => {
    const dateStr = dateTimeStr;
    if (!dateStr) return 'specific date';
    try {
      const parts = dateStr.trim().split(/\s+/);
      if (parts.length < 2) return dateStr;
      const datePart = parts[0];
      const timePart = parts[1];
      const dateSplit = datePart.split('/');
      if (dateSplit.length < 3) return dateStr;
      const m = Number(dateSplit[0]) - 1;
      const d = Number(dateSplit[1]);
      const y = Number(dateSplit[2]);
      const timeSplit = timePart.split(':');
      if (timeSplit.length < 2) return dateStr;
      const hr = Number(timeSplit[0]);
      const min = Number(timeSplit[1]);
      const date = new Date(y, m, d, hr, min);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${monthName} ${year}, ${hours}:${minutes} (UTC +03:00)`;
    } catch (e) {
      return dateStr;
    }
  }, [dateTimeStr]);

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected
          ? 'border-indigo-500 ring-4 ring-indigo-500/10'
          : 'border-slate-200 hover:border-slate-355'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#F9CBBF]/75 border-b border-[#f0a99c]/60 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-rose-100/60 text-[#C2410C] flex items-center justify-center shrink-0">
          <Clock size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#C2410C]/70 uppercase tracking-wider block leading-none">
            {t('node.smart_delay.category')}
          </span>
          <span className="text-xs font-bold text-[#7C2D12] truncate block mt-0.5">
            {t('node.smart_delay.delay_flow')}
          </span>
        </div>
      </div>

      <div className="p-4">
        {mode === 'date' ? (
          <div className="space-y-1 select-none">
            <p className="text-xs font-extrabold text-slate-800 leading-normal">{t('node.smart_delay.wait_until')}</p>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{formattedDateTime}</p>
          </div>
        ) : (
          <div className="text-xs text-slate-650 leading-relaxed font-semibold select-none">
            {t('node.smart_delay.wait', { amount: String(waitAmount), unit: waitUnit })}
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2 select-none">{t('node.smart_delay.next_step')}</span>
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
SmartDelayNodeInner.displayName = 'SmartDelayNode';
export const SmartDelayNode = React.memo(SmartDelayNodeInner);
