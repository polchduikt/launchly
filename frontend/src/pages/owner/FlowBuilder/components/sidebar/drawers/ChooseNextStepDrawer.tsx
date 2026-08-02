import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import type { ChooseNextStepDrawerProps } from '../../../../../../types/bot';
import { STEP_OPTIONS } from '../../../../../../const/stepOptions';
import { t } from '../../../../../../i18n/config';

export const ChooseNextStepDrawer: React.FC<ChooseNextStepDrawerProps> = ({ onClose, onSelectStep, isNested }) => {
  return (
    <div className="h-full flex flex-col justify-between bg-[#F2EBDD] font-['JetBrains_Mono',monospace] w-full text-[#0A0A0A]">
      <div className="px-5 py-4 border-b-2 border-[#0A0A0A] flex items-center bg-[#F2EBDD] select-none shrink-0 gap-3">
        {isNested && (
          <button onClick={onClose} className="text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border border-[#0A0A0A]/30 transition-all p-1 rounded-lg cursor-pointer mr-1">
            <ArrowLeft size={16} />
          </button>
        )}
        <h3 className="font-black text-xs text-[#0A0A0A] uppercase tracking-wider flex-1 font-['Anybody',sans-serif]">{t('flow_builder.choose_next_step')}</h3>
        {!isNested && (
          <button onClick={onClose} className="text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] p-1.5 rounded-lg transition-colors cursor-pointer ml-auto border border-[#0A0A0A]/30">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-3.5 custom-scrollbar">
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
              className="w-full flex items-start gap-4 p-4 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl cursor-pointer transition-all text-left group shadow-sm select-none"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-[#0A0A0A] ${opt.color} group-hover:scale-105 transition-transform`}>
                <Icon size={18} />
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-black group-hover:text-[#F2EBDD] text-[#0A0A0A] transition-colors font-['Anybody',sans-serif]">
                  {t(`step_option.${opt.type}.label`)}
                </p>
                <p className="text-[10px] text-[#0A0A0A]/70 group-hover:text-[#F2EBDD]/80 font-bold leading-relaxed">
                  {t(`step_option.${opt.type}.desc`)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
