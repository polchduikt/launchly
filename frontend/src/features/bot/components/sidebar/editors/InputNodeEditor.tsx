import React from 'react';
import type { CustomNodeData } from '../../../../../types/bot';

interface InputNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const InputNodeEditor: React.FC<InputNodeEditorProps> = ({ data, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="inputPrompt" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Input Prompt Message
        </label>
        <textarea
          id="inputPrompt"
          rows={3}
          value={data.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="Enter prompt message..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all resize-none bg-slate-50/20"
        />
      </div>
      <div>
        <label htmlFor="varName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Save response in variable
        </label>
        <input
          id="varName"
          type="text"
          value={data.variableName || ''}
          onChange={(e) => handleChange('variableName', e.target.value)}
          placeholder="e.g. userName"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all bg-slate-50/20"
        />
      </div>
    </div>
  );
};
