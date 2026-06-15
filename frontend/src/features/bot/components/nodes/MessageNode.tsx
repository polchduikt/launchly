import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Send } from 'lucide-react';
import type { MessageNodeProps } from '../../../../types/bot';

export const MessageNode: React.FC<MessageNodeProps> = ({ selected, data = {} }) => {
  const text = data?.text || 'Add a text...';
  const buttons = data?.buttons || [];
  const imageUrl = data?.imageUrl || '';

  return (
    <div
      className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
        selected ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
          <Send size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">Telegram</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Send Message</span>
        </div>
      </div>

      <div className="space-y-3">
        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200 max-h-36 flex items-center justify-center bg-slate-50">
            <img src={imageUrl} alt="Message attachment" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
          {text}
        </div>

        {buttons.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {buttons.map((btn, idx) => (
              <div
                key={btn.value + idx}
                className="relative bg-white hover:bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-center text-xs font-bold text-indigo-600 transition-colors select-none group"
              >
                <span>{btn.label}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={btn.value}
                  className="w-3 h-3 bg-indigo-600 border-2 border-white hover:scale-125 transition-transform"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {buttons.length === 0 && (
        <div className="flex justify-end items-center mt-3 pt-2 border-t border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">Next Step</span>
          <Handle
            type="source"
            position={Position.Right}
            id="next"
            className="w-3 h-3 bg-slate-400 border-2 border-white hover:scale-125 transition-transform"
          />
        </div>
      )}
    </div>
  );
};
