import React from 'react';
import type { CustomNodeData } from '../../../../../types/bot';
import { CONDITION_OPERATORS } from '../../../config/editorOptions';

interface ConditionNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const ConditionNodeEditor: React.FC<ConditionNodeEditorProps> = ({ data, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="condVar" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Variable
        </label>
        <input
          id="condVar"
          type="text"
          value={data.variable || ''}
          onChange={(e) => handleChange('variable', e.target.value)}
          placeholder="e.g. userAge"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
      <div>
        <label htmlFor="condOp" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Operator
        </label>
        <select
          id="condOp"
          value={data.operator || 'EQUALS'}
          onChange={(e) => handleChange('operator', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-bold transition-all bg-white"
        >
          {CONDITION_OPERATORS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="condVal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Value to compare
        </label>
        <input
          id="condVal"
          type="text"
          value={data.value || ''}
          onChange={(e) => handleChange('value', e.target.value)}
          placeholder="e.g. 18"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
    </div>
  );
};
