import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { UserCheck } from 'lucide-react';

interface LeadNodeProps {
  selected?: boolean;
  data: {
    name?: string;
    email?: string;
    phone?: string;
    text?: string;
  };
}

export const LeadNode: React.FC<LeadNodeProps> = ({ selected, data = {} }) => {
  const name = data?.name || '{name}';
  const email = data?.email || '{email}';
  const phone = data?.phone || '{phone}';

  return (
    <div
      className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
        selected ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <UserCheck size={16} />
        </span>
        <div>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">CRM Lead</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Capture Customer Info</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Name</span>
            <span className="text-slate-700 font-bold">{name}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Email</span>
            <span className="text-slate-700 font-bold">{email}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
            <span>Phone</span>
            <span className="text-slate-700 font-bold">{phone}</span>
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
