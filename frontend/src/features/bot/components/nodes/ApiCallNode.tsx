import React, { useMemo } from 'react';
import { Position, useNodeConnections, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../types/bot';
import { API_METHOD_COLORS } from '../../config/editorOptions';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../i18n';

const ApiCallNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ handleType: 'source' });
  const targetConns = useNodeConnections({ handleType: 'target' });
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

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected 
          ? 'border-indigo-400 ring-2 ring-indigo-100' 
          : 'border-slate-200'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-indigo-50/50 border-b border-indigo-100/60 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-indigo-100/60 text-indigo-500 flex items-center justify-center shrink-0">
          <Globe size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-indigo-500/70 uppercase tracking-wider block leading-none">{t('node.api_call.title')}</span>
          <span className="text-xs font-bold text-indigo-900 truncate block mt-0.5">{t('node.api_call.integration')}</span>
        </div>
      </div>

      <div className="p-4">
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
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">{t('node.api_call.next_step')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && sourceConns.some((c) => c.sourceHandle === 'next')}
          padded={false}
        />
      </div>
    </div>
  );
};
ApiCallNodeInner.displayName = 'ApiCallNode';
export const ApiCallNode = React.memo(ApiCallNodeInner);
