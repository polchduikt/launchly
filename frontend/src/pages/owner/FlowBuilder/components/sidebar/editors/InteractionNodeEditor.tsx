import React from 'react';
import { useEdges, useReactFlow } from '@xyflow/react';
import { ArrowRight } from 'lucide-react';
import { t } from '../../../../../../i18n/config';
import { FLOW_DEFAULTS, TIMING } from '../../../../../../const/constants';

interface InteractionNodeEditorProps {
  nodeId?: string;
  data: Record<string, unknown>;
  handleChange: (keyOrUpdates: string | Record<string, unknown>, value?: unknown) => void;
  editorState?: {
    setIsNextStepDrawerOpen: (open: boolean) => void;
    setNextStepSourceHandle: (handle: string | null) => void;
  };
  onSelectNode?: (nodeId: string | null) => void;
}

export const InteractionNodeEditor: React.FC<InteractionNodeEditorProps> = ({
  nodeId,
  data,
  handleChange,
  editorState,
  onSelectNode,
}) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const { setNodes, fitView } = useReactFlow();

  const interactionType = (data?.interactionType as string) || 'like';
  const checkMutual = data?.checkMutual !== undefined ? Boolean(data.checkMutual) : true;

  const handleJumpToNode = (targetId: string) => {
    if (onSelectNode) {
      onSelectNode(targetId);
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === targetId,
        }))
      );
      setTimeout(() => {
        fitView({
          nodes: [{ id: targetId }],
          duration: FLOW_DEFAULTS.FIT_VIEW_DURATION_MS,
          padding: FLOW_DEFAULTS.FIT_VIEW_PADDING,
        });
      }, TIMING.FOCUS_DELAY_MS);
    }
  };

  const openNextStep = (handleId: string) => {
    if (editorState) {
      editorState.setNextStepSourceHandle(handleId);
      editorState.setIsNextStepDrawerOpen(true);
    }
  };

  const mutualEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'mutual');
  const isMutualConnected = !!mutualEdge;
  const mutualTargetId = mutualEdge?.target;

  const savedEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'saved');
  const isSavedConnected = !!savedEdge;
  const savedTargetId = savedEdge?.target;

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.interaction.action_type', 'Тип взаємодії')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1.5 rounded-2xl select-none">
          {[
            { key: 'like', label: t('editor.interaction.type_like', 'Лайк') },
            { key: 'dislike', label: t('editor.interaction.type_dislike', 'Пропустити') },
            { key: 'favorite', label: t('editor.interaction.type_favorite', 'В обране') },
            { key: 'viewed', label: t('editor.interaction.type_viewed', 'Переглянуто') },
          ].map((item) => {
            const isSelected = interactionType === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleChange('interactionType', item.key)}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center text-center ${
                  isSelected
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div>
            <span className="text-xs font-bold text-[#0A0A0A] block">
              {t('editor.interaction.check_mutual', 'Перевіряти взаємність')}
            </span>
            <span className="text-[10px] text-[#0A0A0A]/60 block font-normal">
              {t('editor.interaction.check_mutual_desc', 'Перевіряє, чи є зустрічна дія від користувача')}
            </span>
          </div>
          <input
            type="checkbox"
            checked={checkMutual}
            onChange={(e) => handleChange('checkMutual', e.target.checked)}
            className="w-4 h-4 accent-[#0A0A0A] cursor-pointer shrink-0 ml-2"
          />
        </label>
      </div>

      <div className="space-y-2 pt-2 border-t-2 border-[#0A0A0A]/10">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.interaction.flow_routing', 'Маршрутизація сценарію')}
        </label>
        {checkMutual && (
          <div
            onClick={() => {
              if (isMutualConnected && mutualTargetId) {
                handleJumpToNode(mutualTargetId);
              } else {
                openNextStep('mutual');
              }
            }}
            className="w-full p-2.5 bg-[#F2EBDD]/40 hover:bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
          >
            <span>{t('editor.interaction.if_mutual', 'Якщо взаємно')}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isMutualConnected && mutualTargetId) {
                  handleJumpToNode(mutualTargetId);
                } else {
                  openNextStep('mutual');
                }
              }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border-2 border-rose-600 ${
                isMutualConnected
                  ? 'bg-rose-500 text-white cursor-pointer'
                  : 'bg-white text-rose-600 cursor-pointer'
              }`}
            >
              {isMutualConnected ? (
                <ArrowRight size={11} className="stroke-[2.5]" />
              ) : null}
            </button>
          </div>
        )}
        <div
          onClick={() => {
            if (isSavedConnected && savedTargetId) {
              handleJumpToNode(savedTargetId);
            } else {
              openNextStep('saved');
            }
          }}
          className="w-full p-2.5 bg-[#F2EBDD]/40 hover:bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
        >
          <span>{t('editor.interaction.saved', 'Збережено')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isSavedConnected && savedTargetId) {
                handleJumpToNode(savedTargetId);
              } else {
                openNextStep('saved');
              }
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border-2 border-slate-600 ${
              isSavedConnected
                ? 'bg-slate-700 text-white cursor-pointer'
                : 'bg-white text-slate-600 cursor-pointer'
            }`}
          >
            {isSavedConnected ? (
              <ArrowRight size={11} className="stroke-[2.5]" />
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
};
