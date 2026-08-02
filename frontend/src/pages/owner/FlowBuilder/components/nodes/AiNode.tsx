import React, { useMemo } from 'react';
import { Position, useNodeConnections, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const AiNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
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
    return false;
  }, [isConnecting, connection, id]);

  const { showToolbar, bindHover } = useNodeHover();

  const generated = !!data?.generated;
  const prompt = typeof data?.prompt === 'string' ? data.prompt : '';

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected
          ? 'shadow-lg ring-2 ring-[#0A0A0A]'
          : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-emerald-100 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0">
          <Sparkles size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-emerald-600/70 uppercase tracking-wider block leading-none">
            {t('node.ai.category')}
          </span>
          <span className="text-xs font-bold text-emerald-800 truncate block mt-0.5">
            {t('node.ai.title')}
          </span>
        </div>
      </div>

      <div className="p-4">
        {generated && prompt ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 select-none text-xs text-slate-700 font-semibold leading-relaxed">
            {prompt}
          </div>
        ) : (
          <div className="border border-dashed border-slate-250 rounded-2xl p-4 flex items-center justify-center text-center select-none">
            <span className="text-xs text-slate-400 font-bold">
              {t('node.ai.define_instructions')}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2 select-none">{t('node.ai.next_step')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && sourceConns.some((c) => c.sourceHandle === 'next')}
        />
      </div>
    </div>
  );
};
AiNodeInner.displayName = 'AiNode';
export const AiNode = React.memo(AiNodeInner);
