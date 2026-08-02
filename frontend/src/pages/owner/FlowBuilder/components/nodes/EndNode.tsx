import React, { useMemo } from 'react';
import { Position, useNodeConnections, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Octagon } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const EndNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected }) => {
  let targetConns: any[] = [];
  try {
    targetConns = useNodeConnections({ handleType: 'target' }) || [];
  } catch (e) {
    targetConns = [];
  }
  let connection: any = { inProgress: false };
  try {
    connection = useConnection() || { inProgress: false };
  } catch (e) {
    connection = { inProgress: false };
  }
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
      className={`w-64 bg-white border-2 border-[#0A0A0A] rounded-2xl transition-all relative overflow-visible isolate ${
        selected 
          ? 'shadow-lg ring-2 ring-[#0A0A0A]' 
          : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      <div className="relative flex items-center gap-2 px-4 py-3 bg-slate-200 select-none rounded-t-[22px]">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <Octagon size={14} strokeWidth={2.5} />
        </span>
        <div>
          <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block leading-none">{t('node.end.flow_end')}</span>
          <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">{t('node.end.terminate')}</span>
        </div>
      </div>

      <div className="p-3.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 leading-relaxed text-center font-semibold select-none">
          {t('node.end.description')}
        </div>
      </div>
    </div>
  );
};
EndNodeInner.displayName = 'EndNode';
export const EndNode = React.memo(EndNodeInner);
