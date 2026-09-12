import React from 'react';
import { Position, useNodeConnections, useConnection, useReactFlow } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { SquareArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { useBotStore } from '../../../../../store/useBotStore';
import { useFlowUiStore } from '../../../../../store/useFlowUiStore';
import { t } from '../../../../../i18n/config';

const StartAutomationNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const navigate = useNavigate();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);
  const { setNodes } = useReactFlow();
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isGrayedOut = isConnecting && isSelfSource;

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
    useFlowUiStore.getState().openPickAutomation(id);
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

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace] select-none">
        {targetBotName ? (
          <div className="space-y-2">
            <div 
              onClick={handleSelectClick}
              className="relative flex items-center justify-between px-3 py-2.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl cursor-pointer hover:bg-[#eae1d0] transition-colors"
            >
              <span className="text-xs font-black text-[#0A0A0A] truncate pr-6 select-all">
                {targetBotName}
              </span>
              <button
                onClick={handleClear}
                className="absolute right-2.5 p-1 text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
            
            <button
              onClick={handleOpenAutomation}
              className="w-full py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] rounded-xl transition-all cursor-pointer"
            >
              {t('node.start_automation.open')}
            </button>
          </div>
        ) : (
          <div 
            onClick={handleSelectClick}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#0A0A0A]/40 rounded-2xl bg-[#F2EBDD]/40 hover:bg-[#F2EBDD]/70 transition-colors cursor-pointer text-[#0A0A0A]/70 text-center"
          >
            <SquareArrowRight size={20} className="stroke-[2] mb-1.5" />
            <span className="text-xs font-black tracking-tight text-center block w-full">{t('node.start_automation.click_to_select')}</span>
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
