import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import type { ChooseNextStepDrawerProps } from '../../../../../types/bot';
import { STEP_OPTIONS } from '../../../config/stepOptions';

export const ChooseNextStepDrawer: React.FC<ChooseNextStepDrawerProps> = ({ onClose, onSelectStep, isNested }) => {
  return (
    <div className="h-full flex flex-col justify-between bg-white font-sans w-full">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center bg-slate-50/50 select-none shrink-0 gap-3">
        {isNested && (
          <button onClick={onClose} className="text-slate-500 hover:text-indigo-600 transition-colors p-1 hover:bg-slate-100 rounded-lg cursor-pointer mr-1">
            <ArrowLeft size={16} />
          </button>
        )}
        <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex-1">Choose Next Step</h3>
        {!isNested && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer ml-auto">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
        {STEP_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => {
                onSelectStep(opt.type);
                onClose();
              }}
              className="w-full flex items-start gap-4 p-4 bg-white hover:bg-slate-50 border border-dashed border-slate-200 hover:border-indigo-450 rounded-3xl cursor-pointer transition-all text-left group shadow-sm select-none"
            >
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${opt.color} group-hover:scale-105 transition-transform`}>
                <Icon size={18} />
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-650 transition-colors">
                  {opt.label}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
