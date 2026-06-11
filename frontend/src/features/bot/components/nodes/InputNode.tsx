import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

interface InputNodeProps {
  selected?: boolean;
  data: {
    text?: string;
    variableName?: string;
  };
}

export const InputNode: React.FC<InputNodeProps> = ({ selected, data = {} }) => {
  const text = data?.text || 'Please enter a value:';
  const variableName = data?.variableName || 'input';

  return (
    <div
      className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
        selected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <MessageSquare size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">Input Prompt</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Save to Variable</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed break-words">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prompt Message</p>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 text-xs text-amber-900 flex justify-between items-center font-semibold">
          <span className="text-[9px] uppercase font-bold text-amber-500">Variable:</span>
          <span>{`{${variableName}}`}</span>
        </div>
      </div>

      <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">Next Step</span>
        <Handle
          type="source"
          position={Position.Right}
          id="next"
          className="w-3 h-3 bg-slate-400 border-2 border-white hover:scale-125 transition-transform"
        />
      </div>
    </div>
  );
};
