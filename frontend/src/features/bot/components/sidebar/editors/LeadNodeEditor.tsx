import React from 'react';
import type { CustomNodeData } from '../../../../../types/bot';

interface LeadNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const LeadNodeEditor: React.FC<LeadNodeEditorProps> = ({ data, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="leadName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Lead Name Map (optional)
        </label>
        <input
          id="leadName"
          type="text"
          value={data.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. {{userName}}"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
      <div>
        <label htmlFor="leadEmail" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Lead Email Map
        </label>
        <input
          id="leadEmail"
          type="text"
          value={data.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="e.g. {{userEmail}}"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
      <div>
        <label htmlFor="leadPhone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Lead Phone Map
        </label>
        <input
          id="leadPhone"
          type="text"
          value={data.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="e.g. {{userPhone}}"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
    </div>
  );
};
