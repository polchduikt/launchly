import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import type { ButtonData } from '../../../../../../../types/bot';
import { t } from '../../../../../../../i18n/config';

interface BlockActionButtonsProps {
  blockId: string;
  buttons: ButtonData[];
  nodeId: string;
  edges: Array<{ source: string; sourceHandle?: string | null; target: string }>;
  onOpenEditButton: (btn: ButtonData, blockId: string) => void;
  onAddButton: (blockId: string) => void;
  onJumpToNode: (targetNodeId: string) => void;
}

export const BlockActionButtons: React.FC<BlockActionButtonsProps> = ({
  blockId,
  buttons,
  nodeId,
  edges,
  onOpenEditButton,
  onAddButton,
  onJumpToNode,
}) => {
  return (
    <div className="pt-2 bg-white space-y-2 border-t border-slate-100">
      {buttons.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {buttons.map((btn, bIdx) => {
            const edge = edges.find((e) => e.source === nodeId && e.sourceHandle === btn.value);
            const isConnected = !!edge;
            const targetNodeId = edge?.target;

            return (
              <div
                key={btn.value + bIdx}
                onClick={() => onOpenEditButton(btn, blockId)}
                className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-slate-350 cursor-pointer transition-all"
              >
                <span className="truncate flex-1 pr-4">{btn.label}</span>
                {btn.actionType === 'BUY' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-250 flex items-center justify-center font-black text-[9px] shrink-0 mr-1.5 select-none leading-none">
                    $
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isConnected && targetNodeId) {
                      onJumpToNode(targetNodeId);
                    }
                  }}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isConnected
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-250 cursor-pointer'
                      : 'border border-slate-300 text-slate-300 cursor-default'
                  }`}
                >
                  {isConnected ? (
                    <ArrowRight size={11} className="stroke-[2.5]" />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => onAddButton(blockId)}
        className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-250 hover:border-slate-350 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
      >
        <Plus size={13} />
        <span>{t('flow_builder.btn_add_button')}</span>
      </button>
    </div>
  );
};
