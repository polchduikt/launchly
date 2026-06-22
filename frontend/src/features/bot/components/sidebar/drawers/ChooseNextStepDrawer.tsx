import React from 'react';
import { 
  X, 
  MessageSquare, 
  Type, 
  GitFork, 
  ShoppingCart, 
  UserPlus, 
  Code, 
  Power,
  Sliders
} from 'lucide-react';

interface ChooseNextStepDrawerProps {
  onClose: () => void;
  onSelectStep: (type: string) => void;
}

const STEP_OPTIONS = [
  {
    type: 'MESSAGE',
    label: 'Telegram',
    description: 'Send text, images, files, audio or video',
    icon: MessageSquare,
    color: 'text-sky-500 bg-sky-50 border-sky-100',
  },
  {
    type: 'INPUT',
    label: 'Input Prompt',
    description: 'Capture user text responses as variables',
    icon: Type,
    color: 'text-amber-500 bg-amber-50 border-amber-100',
  },
  {
    type: 'CONDITION',
    label: 'Condition Rule',
    description: 'Filter flows using conditional rules',
    icon: GitFork,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
  {
    type: 'ACTION',
    label: 'Actions',
    description: 'Perform tag actions, custom fields and Google Sheets operations',
    icon: Sliders,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    type: 'ORDER',
    label: 'Create Order',
    description: 'Generate customizable user checkout orders',
    icon: ShoppingCart,
    color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  },
  {
    type: 'LEAD',
    label: 'CRM Lead Capture',
    description: 'Save contact emails, phones and names',
    icon: UserPlus,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
  },
  {
    type: 'API_CALL',
    label: 'API Integration',
    description: 'Execute external JSON webhook API requests',
    icon: Code,
    color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
  },
  {
    type: 'END',
    label: 'End Session',
    description: 'Terminate active user session/flow sequence',
    icon: Power,
    color: 'text-slate-500 bg-slate-50 border-slate-100',
  },
];

export const ChooseNextStepDrawer: React.FC<ChooseNextStepDrawerProps> = ({ onClose, onSelectStep }) => {
  return (
    <div className="h-full flex flex-col justify-between bg-white font-sans w-full">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 select-none shrink-0">
        <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Choose Next Step</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer">
          <X size={16} />
        </button>
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
