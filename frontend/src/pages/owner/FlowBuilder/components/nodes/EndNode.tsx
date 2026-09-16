import React from 'react';
import { Position, useNodeConnections, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Octagon } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const EndNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected }) => {
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isReplyHandle = useConnection((s) => s.fromHandle?.id === 'reply');
  const isGrayedOut = isConnecting && (isSelfSource || isReplyHandle);
  const { showToolbar, bindHover } = useNodeHover();

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected 
          ? 'shadow-lg ring-2 ring-[#0A0A0A]' 
          : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-rose-100/75 select-none rounded-t-[22px]">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-rose-200/80 text-rose-700 flex items-center justify-center shrink-0">
          <Octagon size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-rose-600/80 uppercase tracking-wider block leading-none">{t('node.end.flow_end')}</span>
          <span className="text-xs font-bold text-rose-950 truncate block mt-0.5">{t('node.end.terminate')}</span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 text-xs text-[#0A0A0A] font-bold leading-relaxed text-center select-none">
          {t('node.end.description')}
        </div>
      </div>
    </div>
  );
};
EndNodeInner.displayName = 'EndNode';
export const EndNode = React.memo(EndNodeInner);
