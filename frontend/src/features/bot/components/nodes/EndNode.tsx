import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Octagon } from 'lucide-react';
import type { EndNodeProps } from '../../../../types/bot';

export const EndNode: React.FC<EndNodeProps> = ({ selected }) => {
  return (
    <div
      className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
        selected ? 'border-slate-400 ring-2 ring-slate-100' : 'border-slate-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
          <Octagon size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">Flow End</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Terminate Walk</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 leading-relaxed text-center font-semibold select-none">
        Bot stops executing and closes session.
      </div>
    </div>
  );
};
