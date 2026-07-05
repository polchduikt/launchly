import React, { useState, useEffect, useMemo } from 'react';
import { Position, useEdges, useConnection, useNodes, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { SquareArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { useBotStore } from '../../../../store/useBotStore';

export const StartAutomationNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const nodes = useNodes();
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const navigate = useNavigate();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);
  const { setNodes } = useReactFlow();

  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const isGrayedOut = useMemo(() => {
    if (!isConnecting) return false;
    if (connection.fromNode?.id === id) return true;
    return false;
  }, [isConnecting, id]);

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

  const targetBotName = typeof data?.targetBotName === 'string'
    ? data.targetBotName
    : typeof data?.automationName === 'string'
      ? data.automationName
      : '';

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              targetBotId: null,
              targetBotName: '',
              automationName: '',
            },
          };
        }
        return n;
      })
    );
  };

  const handleOpenAutomation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.targetBotId) {
      setActiveBotId(Number(data.targetBotId));
      navigate('/builder');
    }
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-pick-automation', { detail: { nodeId: id } }));
  };

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected
          ? 'border-indigo-500 ring-4 ring-indigo-500/10'
          : isHighlighted
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm'
            : 'border-slate-200 hover:border-slate-355'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#e6fc9c]/75 border-b border-[#cde080]/60 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id && nodes.some((n) => n.id === e.source))}
        />
        <span className="w-7 h-7 rounded-lg bg-lime-100/60 text-lime-700 flex items-center justify-center shrink-0">
          <SquareArrowRight size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-lime-700/70 uppercase tracking-wider block leading-none">
            Start Automation
          </span>
          <span className="text-xs font-bold text-lime-800 truncate block mt-0.5">
            Trigger Flow
          </span>
        </div>
      </div>

      <div className="p-4 select-none">
        {targetBotName ? (
          <div className="space-y-3">
            <div 
              onClick={handleSelectClick}
              className="relative flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 truncate pr-6 select-all">
                {targetBotName}
              </span>
              <button
                onClick={handleClear}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-150/50 rounded-md transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            <button
              onClick={handleOpenAutomation}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Open Automation
            </button>
          </div>
        ) : (
          <div 
            onClick={handleSelectClick}
            className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-slate-400 hover:text-slate-500"
          >
            <SquareArrowRight size={20} className="stroke-[1.5] mb-1.5" />
            <span className="text-[11px] font-bold tracking-tight">Click to Select Automation</span>
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
