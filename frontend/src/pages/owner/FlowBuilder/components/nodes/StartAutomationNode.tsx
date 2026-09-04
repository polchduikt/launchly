import React, { useMemo } from 'react';
import { Position, useNodeConnections, useConnection, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { SquareArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { useBotStore } from '../../../../../store/useBotStore';
import { t } from '../../../../../i18n/config';

const StartAutomationNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
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
  const navigate = useNavigate();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);
  const { setNodes } = useReactFlow();

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
  }, [isConnecting, id]);

  const { showToolbar, bindHover } = useNodeHover();

  const targetBotName = typeof data?.targetBotName === 'string'
    ? data.targetBotName
    : typeof data?.automationName === 'string'
      ? data.automationName
      : '';

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              targetBotId: null,
              targetBotName: '',
              automationName: '',
            },
          };
        }
        return n;
      })
    );
  };

  const handleOpenAutomation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.targetBotId) {
      setActiveBotId(Number(data.targetBotId));
      navigate('/builder');
    }
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-pick-automation', { detail: { nodeId: id } }));
  };

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

      <div className="relative flex items-center gap-2 bg-lime-200/75 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-lime-100/60 text-lime-700 flex items-center justify-center shrink-0">
          <SquareArrowRight size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-lime-700/70 uppercase tracking-wider block leading-none">
            {t('node.start_automation.category')}
          </span>
          <span className="text-xs font-bold text-lime-800 truncate block mt-0.5">
            {t('node.start_automation.trigger_flow')}
          </span>
        </div>
      </div>

      <div className="p-4 select-none">
        {targetBotName ? (
          <div className="space-y-3">
            <div 
              onClick={handleSelectClick}
              className="relative flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 truncate pr-6 select-all">
                {targetBotName}
              </span>
              <button
                onClick={handleClear}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-150/50 rounded-md transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            <button
              onClick={handleOpenAutomation}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {t('node.start_automation.open')}
            </button>
          </div>
        ) : (
          <div 
            onClick={handleSelectClick}
            className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-slate-400 hover:text-slate-500"
          >
            <SquareArrowRight size={20} className="stroke-[1.5] mb-1.5" />
            <span className="text-[11px] font-bold tracking-tight">{t('node.start_automation.click_to_select')}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-transparent select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2 select-none">{t('node.start_automation.next_step')}</span>
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
StartAutomationNodeInner.displayName = 'StartAutomationNode';
export const StartAutomationNode = React.memo(StartAutomationNodeInner);
