import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Sparkles } from 'lucide-react';
import type { StartNodeProps } from '../../../../types/bot';

export const StartNode: React.FC<StartNodeProps> = ({ selected }) => {
  return (
    <div
      className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
        selected ? 'border-indigo-700 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Play size={16} />
        </span>
        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Trigger</span>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed flex gap-2">
        <Sparkles size={14} className="text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900 mb-0.5">User Subscribes</p>
          <p>Triggers when a user clicks the Start button in Telegram.</p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="then"
        className="w-3 h-3 bg-indigo-600 border-2 border-white hover:scale-125 transition-transform"
      />
    </div>
  );
};
