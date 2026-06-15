import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Send } from 'lucide-react';

export const StartBroadcastNode: React.FC = () => {
  return (
    <div className="w-60 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs select-none">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Send size={14} className="fill-indigo-100" />
        </span>
        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">When...</span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-600 text-center">
        You send a Broadcast
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="then"
        className="w-2.5 h-2.5 bg-indigo-600 border-2 border-white hover:scale-125 transition-transform"
      />
    </div>
  );
};
