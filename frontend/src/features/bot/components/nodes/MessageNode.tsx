import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, useEdges, useUpdateNodeInternals } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Send, Plus } from 'lucide-react';
import type { ButtonData, CustomNodeData } from '../../../../types/bot';
import { NodeHandle } from './NodeHandle';

export const MessageNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const { setNodes } = useReactFlow();
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const updateNodeInternals = useUpdateNodeInternals();
  const text = data?.text || '';
  const imageUrl = data?.imageUrl || '';
  const buttons = (data?.buttons || []) as ButtonData[];
  const [activeButtonValue, setActiveButtonValue] = useState<string | null>(null);
  const buttonsSerialized = JSON.stringify(buttons);
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, buttonsSerialized, updateNodeInternals]);
  useEffect(() => {
    if (!selected) {
      setActiveButtonValue(null);
    }
  }, [selected]);

  const handleAddButtonInNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttons.length >= 10) return;

    const newBtn: ButtonData = {
      label: `Button ${buttons.length + 1}`,
      value: `btn_${Date.now()}`,
    };

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const currentBtns = (node.data?.buttons || []) as ButtonData[];
          return {
            ...node,
            data: {
              ...node.data,
              buttons: [...currentBtns, newBtn],
            },
          };
        }
        return node;
      })
    );

    setActiveButtonValue(newBtn.value);

    setTimeout(() => {
      const editEvent = new CustomEvent('edit-flow-button', {
        detail: { nodeId: id, button: newBtn },
      });
      window.dispatchEvent(editEvent);
    }, 50);
  };

  const handleButtonClick = (e: React.MouseEvent, btn: ButtonData) => {
    e.stopPropagation();
    setActiveButtonValue(btn.value);
    
    const editEvent = new CustomEvent('edit-flow-button', {
      detail: { nodeId: id, button: btn },
    });
    window.dispatchEvent(editEvent);
  };

  return (
    <div
      className={`w-72 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected ? 'border-emerald-500 ring-4 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 select-none rounded-t-[22px]">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id)}
        />
        <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
          <Send size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block leading-none">
            Telegram
          </span>
          <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">
            Send Message
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {imageUrl ? (
          <div className="rounded-2xl overflow-hidden border border-slate-200/60 max-h-40 flex items-center justify-center bg-slate-50 relative group">
            <img src={imageUrl} alt="Attachment" className="w-full h-full object-cover select-none" />
          </div>
        ) : null}

        {text ? (
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-xs text-slate-800 leading-relaxed break-words whitespace-pre-wrap font-medium">
            {text}
          </div>
        ) : (
          !imageUrl && (
            <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-xs text-slate-400 italic text-center select-none">
              Empty Message Node. Click to add text or image.
            </div>
          )
        )}

        {buttons.length > 0 && (
          <div className="space-y-2 pt-1 nodrag">
            {buttons.map((btn, idx) => {
              const isActive = activeButtonValue === btn.value;
              return (
                <div
                  key={btn.value + idx}
                  onClick={(e) => handleButtonClick(e, btn)}
                  className={`relative border py-2.5 pl-4 pr-10 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer shadow-sm select-none ${
                    isActive
                      ? 'bg-emerald-50/40 border-emerald-500 text-emerald-700 font-extrabold'
                      : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-700 hover:border-slate-350'
                  }`}
                >
                  <span>{btn.label}</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={btn.value}
                    style={{
                      position: 'absolute',
                      left: 'calc(100% - 26px)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                    }}
                    className={`!rounded-full !border-[1.5px] !transition-all hover:!scale-110 !z-20 ${
                      data?._tempSourceHandle !== btn.value && edges.some((e) => e.source === id && e.sourceHandle === btn.value)
                        ? '!bg-[#7b8794] !border-[#7b8794]'
                        : '!bg-white !border-slate-300 hover:!border-slate-400'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleAddButtonInNode}
          disabled={buttons.length >= 10}
          className="w-full py-2 border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 nodrag shadow-sm"
        >
          <Plus size={13} />
          <span>Add Button</span>
        </button>
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Next Step</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && edges.some((e) => e.source === id && (e.sourceHandle === 'next' || e.sourceHandle == null))}
          padded={false}
        />
      </div>
    </div>
  );
};
