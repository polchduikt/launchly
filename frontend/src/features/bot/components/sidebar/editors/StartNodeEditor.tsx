import React from 'react';

export const StartNodeEditor: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed font-semibold">
      <p>This is the starting block of your chat flow. It initializes automatically when a user clicks /start in Telegram.</p>
    </div>
  );
};
