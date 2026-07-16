import React from 'react';
import type { CustomNodeData } from '../../../../../types/bot';
import { t } from '../../../../../i18n';

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
          {t('editor.comment.text_label')}
        </label>
        <textarea
          id="commentText"
          rows={5}
          value={text}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder={t('editor.comment.placeholder')}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-semibold transition-all resize-none bg-slate-50/20"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          {t('editor.comment.note_size')}
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
          {t('editor.comment.font_size')}
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
            {t('editor.comment.font_small')}
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
            {t('editor.comment.font_large')}
          </button>
        </div>
      </div>
    </div>
  );
};
