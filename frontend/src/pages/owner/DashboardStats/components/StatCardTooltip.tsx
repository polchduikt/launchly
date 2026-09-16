import React from 'react';
import { AlertCircle } from 'lucide-react';

interface StatCardTooltipProps {
  text: string;
}

export const StatCardTooltip: React.FC<StatCardTooltipProps> = ({ text }) => (
  <div className="relative group/tooltip">
    <button
      type="button"
      aria-label={text}
      className="text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors cursor-pointer p-0.5 rounded-md hover:bg-black/5 flex items-center justify-center"
    >
      <AlertCircle size={14} />
    </button>
    <div className="absolute right-0 top-6 z-50 hidden group-hover/tooltip:block w-56 p-2.5 bg-white text-[#0A0A0A] text-[11px] font-bold rounded-xl border-2 border-[#0A0A0A] shadow-[3px_3px_0px_0px_#0A0A0A] pointer-events-none animate-in fade-in zoom-in-95 duration-100 leading-snug select-none text-left">
      {text}
    </div>
  </div>
);
