import React, { useMemo } from 'react';
import { t } from '../../../../../i18n/config';
import { Position, useNodeConnections, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Shuffle } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';

const RandomizerNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  let sourceConns: any[] = [];
  try {
    sourceConns = useNodeConnections({ handleType: 'source' }) || [];
  } catch (e) {
    sourceConns = [];
  }
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

  const variations = data.variations || [
    { id: 'variation_0', label: 'A', percentage: 50, color: '#7C3AED' },
    { id: 'variation_1', label: 'B', percentage: 50, color: '#B45309' }
  ];

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

      <div className="relative flex items-center gap-2 bg-[#EBE5FB]/75 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-purple-100/70 text-[#6D28D9] flex items-center justify-center shrink-0">
          <Shuffle size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#6D28D9]/75 uppercase tracking-wider block leading-none">
            {t('node.randomizer.split_traffic')}
          </span>
          <span className="text-xs font-bold text-[#4C1D95] truncate block mt-0.5">
            {t('node.title.randomizer')}
          </span>
        </div>
      </div>

      <div className="rounded-b-[22px] divide-y divide-slate-100/70">
        {variations.map((v) => {
          const isVarConnected = sourceConns.some((c) => c.sourceHandle === v.id);

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
RandomizerNodeInner.displayName = 'RandomizerNode';
export const RandomizerNode = React.memo(RandomizerNodeInner);
