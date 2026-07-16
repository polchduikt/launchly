import React, { useState, useEffect, useMemo } from 'react';
import { Position, useEdges, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { API_METHOD_COLORS } from '../../config/editorOptions';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../i18n';

export const ApiCallNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const url = data?.url || 'https://api.example.com/endpoint';
  const method = data?.method || 'GET';

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
      className={`w-[380px] bg-white/75 backdrop-blur-[2px] border-2 rounded-2xl p-4 shadow-sm transition-all relative overflow-visible isolate ${
        selected 
          ? 'border-indigo-400 ring-2 ring-indigo-100' 
          : isHighlighted 
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm' 
            : 'border-slate-200'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <div className="relative flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id && e.source !== 'temp_menu_node')}
          padded={true}
        />
        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
          <Globe size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">{t('node.api_call.title')}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('node.api_call.integration')}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2.5">
            <span>{t('node.api_call.request_info')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded border shrink-0 ${API_METHOD_COLORS[method.toUpperCase()] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              {method}
            </span>
            <div className="flex-1 text-slate-850 truncate text-[11px] font-mono select-all bg-white border border-slate-100 p-1.5 rounded-lg leading-tight" title={url}>
              {url || 'https://api.example.com/endpoint'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100 relative">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">{t('node.api_call.next_step')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && edges.some((e) => e.source === id && e.sourceHandle === 'next' && e.target !== 'temp_menu_node')}
          padded={true}
        />
      </div>
    </div>
  );
};
ApiCallNode.displayName = 'ApiCallNode';
