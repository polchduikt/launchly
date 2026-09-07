import React, { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import type { ButtonData } from '../../../../../../../types/bot';
import { t } from '../../../../../../../i18n/config';
import {
  groupButtonsByRow,
  addButtonToRow,
  addButtonInNewRow,
  reorderButtons,
  moveButtonToRow,
} from '../../../../../../../hooks/flow/useButtonLayout';

interface TelegramMenuEditorProps {
  blockId: string;
  buttons: ButtonData[];
  nodeId: string;
  edges: Array<{ source: string; sourceHandle?: string | null; target: string }>;
  onOpenEditButton: (btn: ButtonData, blockId: string) => void;
  onJumpToNode: (targetNodeId: string) => void;
  onUpdateButtons: (blockId: string, buttons: ButtonData[]) => void;
}

export const TelegramMenuEditor: React.FC<TelegramMenuEditorProps> = ({
  blockId,
  buttons,
  nodeId,
  edges,
  onOpenEditButton,
  onJumpToNode,
  onUpdateButtons,
}) => {
  const [draggedBtnValue, setDraggedBtnValue] = useState<string | null>(null);

  const groups = groupButtonsByRow(buttons);
  const sortedRowKeys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));

  const handleDropBtn = (e: React.DragEvent, targetBtnValue: string) => {
    const sourceBtnValue = e.dataTransfer.getData('text/plain');
    if (!sourceBtnValue || sourceBtnValue === targetBtnValue) return;
    const updated = reorderButtons(buttons, sourceBtnValue, targetBtnValue);
    onUpdateButtons(blockId, updated);
  };

  const handleDropOnRow = (e: React.DragEvent, targetRowKey: string) => {
    const sourceBtnValue = e.dataTransfer.getData('text/plain');
    if (!sourceBtnValue) return;
    const updated = moveButtonToRow(buttons, sourceBtnValue, targetRowKey);
    onUpdateButtons(blockId, updated);
  };

  const handleAddButton = (rowKey: string) => {
    const updated = addButtonToRow(buttons, rowKey);
    onUpdateButtons(blockId, updated);
  };

  const handleAddNewRow = () => {
    const updated = addButtonInNewRow(buttons);
    onUpdateButtons(blockId, updated);
  };

  return (
    <div className="p-4 space-y-3.5">
      <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/40 space-y-2.5">
        {sortedRowKeys.map((rowKey) => {
          const rowBtns = groups[rowKey];
          return (
            <div
              key={rowKey}
              className="flex gap-2 items-stretch w-full"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnRow(e, rowKey)}
            >
              <div className="flex-1 flex flex-wrap gap-2">
                {rowBtns.map((btn, btnIdx) => {
                  const edge = edges.find((e) => e.source === nodeId && e.sourceHandle === btn.value);
                  const isConnected = !!edge;
                  const targetNodeId = edge?.target;
                  const isDragging = draggedBtnValue === btn.value;

                  return (
                    <div
                      key={btn.value + btnIdx}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', btn.value);
                        setDraggedBtnValue(btn.value);
                      }}
                      onDragEnd={() => setDraggedBtnValue(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDropBtn(e, btn.value);
                      }}
                      onClick={() => onOpenEditButton(btn, blockId)}
                      className={`flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-slate-350 py-2 px-3 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-grab active:cursor-grabbing shadow-xs transition-all flex-1 min-w-[70px] text-center select-none ${
                        isDragging ? 'opacity-40 scale-[0.97]' : ''
                      }`}
                    >
                      <span className="truncate max-w-[80px]">{btn.label}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isConnected && targetNodeId) {
                            onJumpToNode(targetNodeId);
                          }
                        }}
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          isConnected
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-250 cursor-pointer'
                            : 'border border-slate-300 text-slate-300 cursor-default'
                        }`}
                      >
                        {isConnected ? (
                          <ArrowRight size={9} className="stroke-[2.5]" />
                        ) : null}
                      </button>
                    </div>
                  );
                })}
              </div>

              {rowBtns.length < 8 && (
                <button
                  type="button"
                  onClick={() => handleAddButton(rowKey)}
                  className="w-8 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 hover:border-slate-300 text-slate-450 hover:text-slate-600 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Add button to this row"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddNewRow}
          className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-200 hover:border-slate-350 text-slate-550 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Plus size={13} />
          <span>{t('ai.builder.add_button')}</span>
        </button>
      </div>
    </div>
  );
};
