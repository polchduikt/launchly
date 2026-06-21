import React, { useState, useEffect } from 'react';
import { Position, useEdges, useConnection, useNodes } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { UserCheck } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';

export const LeadNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const nodes = useNodes();
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const name = data?.name || '{name}';
  const email = data?.email || '{email}';
  const phone = data?.phone || '{phone}';

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
      className={`w-64 bg-white/75 backdrop-blur-[2px] border-2 rounded-2xl p-4 shadow-sm transition-all relative overflow-visible isolate ${
        selected 
          ? 'border-sky-500 ring-2 ring-sky-100' 
          : isHighlighted 
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm' 
            : 'border-slate-200'
      } ${isSelf ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <div className="relative flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id && nodes.some((n) => n.id === e.source))}
          padded={true}
        />
        <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <UserCheck size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">CRM Lead</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Capture Customer Info</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Name</span>
            <span className="text-slate-700 font-bold">{name}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Email</span>
            <span className="text-slate-700 font-bold">{email}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Phone</span>
            <span className="text-slate-700 font-bold">{phone}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100 relative">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">Next Step</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && edges.some((e) => e.source === id && e.sourceHandle === 'next' && nodes.some((n) => n.id === e.target))}
          padded={true}
        />
      </div>
    </div>
  );
};
