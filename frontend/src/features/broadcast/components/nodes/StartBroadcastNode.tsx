import React from 'react';
import { Position, useConnection, useNodeConnections } from '@xyflow/react';
import { Send } from 'lucide-react';
import { NodeHandle } from '../../../bot/components/nodes/NodeHandle';
import { t } from '../../../../i18n';

const StartBroadcastNodeInner: React.FC = () => {
  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const sourceConns = useNodeConnections({ handleType: 'source' });
  const isConnected = sourceConns.length > 0;

  return (
    <div className={`w-60 bg-white border-2 rounded-2xl p-4 shadow-xs select-none transition-all border-slate-200 ${
      isConnecting ? 'opacity-40 grayscale pointer-events-none' : ''
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Send size={14} className="fill-indigo-100" />
        </span>
        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{t('broadcast.builder.node.when')}</span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-600 text-center">
        {t('broadcast.builder.node.you_send_broadcast')}
      </div>
      <NodeHandle
        type="source"
        position={Position.Right}
        id="then"
        isConnected={isConnected}
      />
    </div>
  );
};

export const StartBroadcastNode = React.memo(StartBroadcastNodeInner);
