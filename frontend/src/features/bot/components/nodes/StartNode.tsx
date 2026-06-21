import React, { useState, useEffect } from 'react';
import { Position, useEdges, useConnection, useNodes } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Zap, Plus } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';

export const StartNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const nodes = useNodes();
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const connection = useConnection();
  const isConnecting = connection.inProgress;
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
      className={`w-72 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected 
          ? 'border-emerald-500 ring-4 ring-emerald-100' 
          : isHighlighted 
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm' 
            : 'border-slate-200'
      } ${isConnecting ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 select-none rounded-t-[22px]">
        <span className="text-emerald-500 shrink-0">
          <Zap size={15} fill="currentColor" />
        </span>
        <span className="font-extrabold text-xs text-slate-800 tracking-wider">When...</span>
      </div>

      <div className="p-3.5 space-y-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex gap-2.5 items-start">
          <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
            tg
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              User subscribes by clicking the Subscribe button
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase">
              Welcome Message
            </p>
          </div>
        </div>

        <button className="w-full py-2 border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm">
          <Plus size={13} />
          <span>New Trigger</span>
        </button>
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Then</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="then"
          isConnected={data?._tempSourceHandle !== 'then' && edges.some((e) => e.source === id && e.sourceHandle === 'then' && nodes.some((n) => n.id === e.target))}
          padded={false}
        />
      </div>
    </div>
  );
};
