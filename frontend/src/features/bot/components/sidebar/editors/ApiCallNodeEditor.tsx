import React from 'react';
import type { CustomNodeData } from '../../../../../types/bot';
import { API_METHODS } from '../../../config/editorOptions';

interface ApiCallNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const ApiCallNodeEditor: React.FC<ApiCallNodeEditorProps> = ({ data, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="apiUrl" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Endpoint URL Address
        </label>
        <input
          id="apiUrl"
          type="text"
          value={data.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://api.yourdomain.com/v1/webhook"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
      <div>
        <label htmlFor="apiMethod" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          HTTP Method
        </label>
        <select
          id="apiMethod"
          value={data.method || 'POST'}
          onChange={(e) => handleChange('method', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-bold transition-all bg-white"
        >
          {API_METHODS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
