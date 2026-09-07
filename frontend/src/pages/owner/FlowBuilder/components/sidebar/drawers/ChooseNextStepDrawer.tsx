import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import type { ChooseNextStepDrawerProps } from '../../../../../../types/bot';
import { STEP_OPTIONS } from '../../../../../../const/stepOptions';
import { t } from '../../../../../../i18n/config';

export const ChooseNextStepDrawer: React.FC<ChooseNextStepDrawerProps> = ({ onClose, onSelectStep, isNested }) => {
  return (
    <div className="h-full flex flex-col justify-between bg-canvas font-['JetBrains_Mono',monospace] w-full text-ink">
      <div className="px-5 py-4 border-b-2 border-ink flex items-center bg-canvas select-none shrink-0 gap-3">
        {isNested && (
          <button onClick={onClose} className="text-ink hover:bg-ink hover:text-canvas border border-ink/30 transition-all p-1 rounded-lg cursor-pointer mr-1">
            <ArrowLeft size={16} />
          </button>
        )}
        <h3 className="font-black text-xs text-ink uppercase tracking-wider flex-1 font-['Anybody',sans-serif]">{t('flow_builder.choose_next_step')}</h3>
        {!isNested && (
          <button onClick={onClose} className="text-ink hover:bg-ink hover:text-canvas p-1.5 rounded-lg transition-colors cursor-pointer ml-auto border border-ink/30">
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
              className="w-full flex items-start gap-4 p-4 bg-white hover:bg-ink hover:text-canvas border-2 border-ink rounded-2xl cursor-pointer transition-all text-left group shadow-sm select-none"
            >
              <span
                data-block-type={opt.type}
                className={`node-icon-badge w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-ink ${opt.color} group-hover:scale-105 transition-transform`}
              >
                <Icon size={18} />
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-black group-hover:text-canvas text-ink transition-colors font-['Anybody',sans-serif]">
                  {t(`step_option.${opt.type}.label`)}
                </p>
                <p className="text-[10px] text-ink/70 group-hover:text-canvas/80 font-bold leading-relaxed">
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
