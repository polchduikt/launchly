import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Terminal } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const CommandNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isGrayedOut = isConnecting && isSelfSource;
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const command = (data?.command as string) || '/start';
  const description = (data?.description as string) || '';

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

      <div className="relative flex items-center gap-2 bg-teal-100/75 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-teal-100/60 text-[#0d9488] flex items-center justify-center shrink-0">
          <Terminal size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#0d9488]/70 uppercase tracking-wider block leading-none">
            {t('node.command.trigger')}
          </span>
          <span className="text-xs font-bold text-[#115e59] truncate block mt-0.5">
            {t('node.command.title')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-teal-700 truncate select-none">
            {command.startsWith('/') ? command : `/${command}`}
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 flex gap-2.5 items-start">
            <span className="w-5 h-5 rounded-full bg-[#0A0A0A] text-[#F2EBDD] flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">
              /
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#0A0A0A] leading-tight break-all">
                {command.startsWith('/') ? command : `/${command}`}
              </p>
              {description ? (
                <p className="text-[10px] text-[#0A0A0A]/60 font-medium mt-1 truncate">
                  {description}
                </p>
              ) : (
                <p className="text-[10px] text-[#0A0A0A]/50 font-medium mt-1 uppercase">
                  {t('node.command.incoming_cmd')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-[#F2EBDD] select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-black text-[#0A0A0A] uppercase tracking-wider mr-2 font-['Anybody',sans-serif]">
          {t('node.start.then')}
        </span>
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

CommandNodeInner.displayName = 'CommandNode';
export const CommandNode = React.memo(CommandNodeInner);
