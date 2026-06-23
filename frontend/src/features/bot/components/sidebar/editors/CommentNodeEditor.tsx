import React from 'react';
import type { CustomNodeData } from '../../../../../types/bot';

interface CommentNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const CommentNodeEditor: React.FC<CommentNodeEditorProps> = ({ data, handleChange }) => {
  const text = data.text || '';
  const noteSize = data.noteSize || 'M';
  const fontSize = data.fontSize || 'S';

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="commentText" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Comment Text
        </label>
        <textarea
          id="commentText"
          rows={5}
          value={text}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="Write your comment here..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all resize-none bg-slate-50/20"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Note Size
        </label>
        <div className="flex bg-slate-100/80 p-1 rounded-2xl select-none border border-slate-200/50">
          <button
            type="button"
            onClick={() => handleChange('noteSize', 'S')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center ${
              noteSize === 'S'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            S
          </button>
          <button
            type="button"
            onClick={() => handleChange('noteSize', 'M')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center ${
              noteSize === 'M'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            M
          </button>
          <button
            type="button"
            onClick={() => handleChange('noteSize', 'L')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center ${
              noteSize === 'L'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            L
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Font Size
        </label>
        <div className="flex bg-slate-100/80 p-1 rounded-2xl select-none border border-slate-200/50">
          <button
            type="button"
            onClick={() => handleChange('fontSize', 'S')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center ${
              fontSize === 'S'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            Small (aA)
          </button>
          <button
            type="button"
            onClick={() => handleChange('fontSize', 'L')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center ${
              fontSize === 'L'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            Large (AA)
          </button>
        </div>
      </div>
    </div>
  );
};
