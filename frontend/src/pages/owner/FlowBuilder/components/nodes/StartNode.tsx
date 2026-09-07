import React from 'react';
import { Position, useNodeConnections, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { t } from '../../../../../i18n/config';

const StartNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ selected, data = {} }) => {
  let sourceConns: any[] = [];
  try {
    sourceConns = useNodeConnections({ handleType: 'source' }) || [];
  } catch (e) {
    sourceConns = [];
  }
  let connection: any = { inProgress: false };
  try {
    connection = useConnection() || { inProgress: false };
  } catch (e) {
    connection = { inProgress: false };
  }
  const isConnecting = connection.inProgress;

  return (
    <div
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-ink rounded-3xl transition-all relative overflow-visible isolate ${
        selected 
          ? 'shadow-lg ring-2 ring-ink' 
          : 'shadow-md'
      } ${isConnecting ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-100/75 select-none rounded-t-[22px]">
        <span className="text-emerald-700 shrink-0 font-bold">
          <Zap size={15} fill="currentColor" />
        </span>
        <span className="font-black text-xs text-ink uppercase tracking-wider font-['Anybody',sans-serif]">{t('node.start.when')}</span>
      </div>

      <div className="p-3.5 space-y-3 font-['JetBrains_Mono',monospace]">
        <div className="bg-canvas border-2 border-ink rounded-2xl p-3 flex gap-2.5 items-start">
          <span className="w-5 h-5 rounded-full bg-ink text-canvas flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">
            tg
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink leading-tight">
              {t('node.start.user_subscribes')}
            </p>
            <p className="text-[10px] text-ink/60 font-black mt-1 uppercase">
              {t('node.start.welcome')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-canvas select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-black text-ink uppercase tracking-wider mr-2 font-['Anybody',sans-serif]">{t('node.start.then')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="then"
          isConnected={data?._tempSourceHandle !== 'then' && sourceConns.some((c) => c.sourceHandle === 'then')}
          padded={false}
        />
      </div>
    </div>
  );
};
StartNodeInner.displayName = 'StartNode';
export const StartNode = React.memo(StartNodeInner);
