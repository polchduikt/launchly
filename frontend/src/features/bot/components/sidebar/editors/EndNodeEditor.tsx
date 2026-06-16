import React from 'react';

export const EndNodeEditor: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed font-semibold">
      <p className="font-bold text-slate-800 mb-1">End Execution</p>
      <p>Closes active flow execution. The bot will wait for a new user message / start command to evaluate again.</p>
    </div>
  );
};
