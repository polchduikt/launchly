import React from 'react';
import { Position, useConnection, useNodeConnections } from '@xyflow/react';
import { Send } from 'lucide-react';
import { NodeHandle } from '../../../FlowBuilder/components/nodes/NodeHandle';
import { t } from '../../../../../i18n/config';

const StartBroadcastNodeInner: React.FC = () => {
  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const sourceConns = useNodeConnections({ handleType: 'source' });
  const isConnected = sourceConns.length > 0;

  return (
    <div className={`w-60 bg-white border-2 rounded-2xl p-4 shadow-xs select-none transition-all border-ink ${
      isConnecting ? 'opacity-40 grayscale pointer-events-none' : ''
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-white text-ink border border-ink flex items-center justify-center shrink-0">
          <Send size={14} />
        </span>
        <span className="font-bold text-xs text-ink uppercase tracking-wider">{t('broadcast.builder.node.when')}</span>
      </div>
      <div className="bg-white border border-ink/25 rounded-xl py-2 px-3 text-xs font-bold text-ink/70 text-center">
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
