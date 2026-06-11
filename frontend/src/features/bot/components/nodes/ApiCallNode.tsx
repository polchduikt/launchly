import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';

interface ApiCallNodeProps {
  selected?: boolean;
  data: {
    url?: string;
    method?: string;
  };
}

export const ApiCallNode: React.FC<ApiCallNodeProps> = ({ selected, data = {} }) => {
  const url = data?.url || 'https://api.example.com/endpoint';
  const method = data?.method || 'GET';

  const getMethodColor = (m: string) => {
    switch (m.toUpperCase()) {
      case 'GET':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'POST':
        return 'bg-blue-50 text-blue-500 border-blue-100';
      case 'PUT':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DELETE':
        return 'bg-rose-50 text-rose-500 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div
      className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
          <Globe size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">API Call</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">HTTP Integration</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            <span>Request info</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded border ${getMethodColor(method)}`}>
              {method}
            </span>
          </div>
          <div className="text-slate-800 break-all text-[11px] font-mono select-all bg-white border border-slate-100 p-1.5 rounded-lg">
            {url}
          </div>
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
