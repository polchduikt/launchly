import React, { useState, useEffect } from 'react';
import { Handle, Position, useConnection } from '@xyflow/react';
import { Grid } from 'lucide-react';
import { useNodeHover } from '../../../bot/hooks/useNodeHover';
import { NodeToolbar } from '../../../bot/components/nodes/NodeToolbar';

interface StartAutomationNodeProps {
  selected?: boolean;
  data?: {
    automationName?: string;
    onSelectClick?: () => void;
    id?: string;
  };
  id: string;
}

export const StartAutomationBroadcastNode: React.FC<StartAutomationNodeProps> = ({ id, selected, data = {} }) => {
  const name = data?.automationName || '';
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

  return (
    <div
      {...bindHover}
      className={`w-60 bg-white border-2 rounded-2xl p-4 shadow-xs transition-all select-none relative overflow-visible isolate ${
        selected 
          ? 'border-emerald-500 ring-2 ring-emerald-50' 
          : isHighlighted 
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm' 
            : 'border-slate-200'
      } ${isSelf ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
          <Grid size={14} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">Start Automation</span>
        </div>
      </div>

      {name ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-750 font-extrabold text-center">
          {name}
        </div>
      ) : (
        <button
          onClick={data.onSelectClick}
          className="w-full py-2.5 border border-dashed border-slate-300 hover:border-indigo-450 text-slate-500 hover:text-indigo-650 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
        >
          Click to Select Automation
        </button>
      )}
    </div>
  );
};
