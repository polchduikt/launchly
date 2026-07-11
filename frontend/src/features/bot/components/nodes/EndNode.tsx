import React, { useState, useEffect, useMemo } from 'react';
import { Position, useEdges, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Octagon } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';

export const EndNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected }) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
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
      className={`w-64 bg-white/75 backdrop-blur-[2px] border-2 rounded-2xl shadow-sm transition-all relative overflow-visible isolate ${
        selected 
          ? 'border-slate-400 ring-2 ring-slate-100' 
          : isHighlighted 
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm' 
            : 'border-slate-200'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <NodeHandle
        type="target"
        position={Position.Left}
        isConnected={edges.some((e) => e.target === id && e.source !== 'temp_menu_node')}
      />
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 select-none rounded-t-[22px]">
        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <Octagon size={14} strokeWidth={2.5} />
        </span>
        <div>
          <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block leading-none">Flow End</span>
          <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">Terminate Walk</span>
        </div>
      </div>

      <div className="p-3.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 leading-relaxed text-center font-semibold select-none">
          Bot stops executing and closes session.
        </div>
      </div>
    </div>
  );
};
EndNode.displayName = 'EndNode';
