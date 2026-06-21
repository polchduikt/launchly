import React, { useState, useEffect } from 'react';
import { Handle, Position, useConnection, useEdges, useNodes } from '@xyflow/react';
import { Send } from 'lucide-react';

export const StartBroadcastNode: React.FC = () => {
  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const edges = useEdges();
  const nodes = useNodes();
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const handleHoverEdge = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { source, target } = customEvent.detail;
        setIsHighlighted(source === 'start' || target === 'start');
      } else {
        setIsHighlighted(false);
      }
    };
    window.addEventListener('flow-hover-edge', handleHoverEdge);
    return () => {
      window.removeEventListener('flow-hover-edge', handleHoverEdge);
    };
  }, []);

  const isConnected = edges.some((e) => e.source === 'start' && nodes.some((n) => n.id === e.target));

  return (
    <div className={`w-60 bg-white border-2 rounded-2xl p-4 shadow-xs select-none transition-all ${
      isHighlighted 
        ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm' 
        : 'border-slate-200'
    } ${isConnecting ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Send size={14} className="fill-indigo-100" />
        </span>
        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">When...</span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-600 text-center">
        You send a Broadcast
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="then"
        className={`w-2.5 h-2.5 border-2 border-white transition-all ${
          isConnected ? '!bg-[#7b8794]' : '!bg-indigo-600'
        }`}
      />
    </div>
  );
};
