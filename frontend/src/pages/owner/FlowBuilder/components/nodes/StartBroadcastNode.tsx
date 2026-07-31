import React from 'react';
import { Position, useConnection, useNodeConnections } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Send } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { t } from '../../../../../i18n/config';

const StartBroadcastNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ data = {} }) => {
  let connection: any = { inProgress: false };
  try {
    connection = useConnection() || { inProgress: false };
  } catch (e) {
    connection = { inProgress: false };
  }
  const isConnecting = connection.inProgress;
  let sourceConns: any[] = [];
  try {
    sourceConns = useNodeConnections({ handleType: 'source' }) || [];
  } catch (e) {
    sourceConns = [];
  }
  const isConnected = data?._tempSourceHandle !== 'then' && sourceConns.some((c) => c.sourceHandle === 'then');

  return (
    <div className={`w-64 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl p-4 shadow-md select-none transition-all border-indigo-200 relative overflow-visible isolate ${
      isConnecting ? 'opacity-40 grayscale pointer-events-none' : ''
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Send size={14} className="fill-indigo-100" />
        </span>
        <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">{t('broadcast.builder.node.when')}</span>
      </div>
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-700 text-center">
        {t('broadcast.builder.node.you_send_broadcast')}
      </div>
      <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100 relative">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">{t('node.start.then')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="then"
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

StartBroadcastNodeInner.displayName = 'StartBroadcastNode';
export const StartBroadcastNode = React.memo(StartBroadcastNodeInner);
