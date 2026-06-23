import React, { useState, useEffect } from 'react';
import { Position, useEdges, useConnection, useNodes } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Shuffle } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';

export const RandomizerNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
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

  const variations = data.variations || [
    { id: 'variation_0', label: 'A', percentage: 50, color: '#7C3AED' },
    { id: 'variation_1', label: 'B', percentage: 50, color: '#B45309' }
  ];

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

      <div className="relative flex items-center gap-2 bg-[#EBE5FB] border-b border-[#dbd1f7]/65 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id && nodes.some((n) => n.id === e.source))}
        />
        <span className="w-7 h-7 rounded-lg bg-purple-100/70 text-[#6D28D9] flex items-center justify-center shrink-0">
          <Shuffle size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#6D28D9]/75 uppercase tracking-wider block leading-none">
            Split Traffic
          </span>
          <span className="text-xs font-bold text-[#4C1D95] truncate block mt-0.5">
            Randomizer
          </span>
        </div>
      </div>

      <div className="bg-white rounded-b-[22px] divide-y divide-slate-100/70">
        {variations.map((v) => {
          const isVarConnected = edges.some(
            (e) => e.source === id && e.sourceHandle === v.id && nodes.some((n) => n.id === e.target)
          );

          return (
            <div key={v.id} className="relative flex justify-between items-center px-4 py-3 select-none last:rounded-b-[22px]">
              <span className="text-xs font-bold" style={{ color: v.color }}>
                {v.label}
              </span>
              <span className="text-xs font-semibold text-slate-500 mr-2">
                {v.percentage}%
              </span>
              <NodeHandle
                type="source"
                position={Position.Right}
                id={v.id}
                isConnected={isVarConnected}
                style={{
                  borderColor: v.color,
                  borderWidth: '1.5px',
                  backgroundColor: isVarConnected ? v.color : '#ffffff'
                }}
                className="!w-2.5 !h-2.5 hover:scale-110"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
