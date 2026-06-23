import React, { useState, useEffect } from 'react';
import { Position, useEdges, useConnection, useNodes } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';

export const SmartDelayNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
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

  const mode = data?.mode || 'duration';
  const waitAmount = data?.waitAmount || 12;
  const waitUnit = data?.waitUnit || 'Hours';
  const dateTimeStr = data?.dateTime || '';

  const formatDateTime = (dateStr: string) => {
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
  };

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

      <div className="relative flex items-center gap-2 bg-[#F9CBBF] border-b border-[#f0a99c]/60 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id && nodes.some((n) => n.id === e.source))}
        />
        <span className="w-7 h-7 rounded-lg bg-rose-100/60 text-[#C2410C] flex items-center justify-center shrink-0">
          <Clock size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#C2410C]/70 uppercase tracking-wider block leading-none">
            Smart Delay
          </span>
          <span className="text-xs font-bold text-[#7C2D12] truncate block mt-0.5">
            Delay Flow
          </span>
        </div>
      </div>

      <div className="p-4 bg-white">
        {mode === 'date' ? (
          <div className="space-y-1 select-none">
            <p className="text-xs font-extrabold text-slate-800 leading-normal">Wait Until</p>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{formatDateTime(dateTimeStr)}</p>
          </div>
        ) : (
          <div className="text-xs text-slate-650 leading-relaxed font-semibold select-none">
            Wait <strong className="font-extrabold text-slate-800">{waitAmount} {waitUnit}</strong> and then continue
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2 select-none">Next Step</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && edges.some((e) => e.source === id && e.sourceHandle === 'next' && nodes.some((n) => n.id === e.target))}
        />
      </div>
    </div>
  );
};
