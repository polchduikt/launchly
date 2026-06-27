import React, { useEffect } from 'react';
import { Info, Clock, Calendar, ChevronDown } from 'lucide-react';
import type { SmartDelayNodeEditorProps } from '../../../../../types/bot';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

export const SmartDelayNodeEditor: React.FC<SmartDelayNodeEditorProps> = ({ data, handleChange, editorState }) => {
  const mode = typeof data.mode === 'string' ? data.mode : 'duration';
  const waitAmount = typeof data.waitAmount === 'number' || typeof data.waitAmount === 'string' ? data.waitAmount : 12;
  const waitUnit = typeof data.waitUnit === 'string' ? data.waitUnit : 'Hours';
  const dateTime = typeof data.dateTime === 'string' ? data.dateTime : '';
  const sendWithinSpecificHours = !!data.sendWithinSpecificHours;

  const getTomorrowDateTimeString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${month}/${day}/${year} 09:00`;
  };

  useEffect(() => {
    if (mode === 'date' && !dateTime) {
      handleChange('dateTime', getTomorrowDateTimeString());
    }
  }, [mode, dateTime]);

  const convertStateToInput = (stateVal: string): string => {
    if (!stateVal) return '';
    const trimmed = stateVal.trim();
    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (match) {
      const [, month, day, year, hours, minutes] = match;
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    } catch {
      // ignore parsing error
    }
    return '';
  };

  const convertInputToState = (inputVal: string): string => {
    if (!inputVal) return '';
    const trimmed = inputVal.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (match) {
      const [, year, month, day, hours, minutes] = match;
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100/80 p-1 rounded-2xl select-none mb-6 border border-slate-200/50">
        <button
          type="button"
          onClick={() => handleChange('mode', 'duration')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
            mode === 'duration'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-805 bg-transparent'
          }`}
        >
          <Clock size={13} />
          Duration
        </button>
        <button
          type="button"
          onClick={() => handleChange('mode', 'date')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
            mode === 'date'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-805 bg-transparent'
          }`}
        >
          <Calendar size={13} />
          Date
        </button>
      </div>

      {mode === 'date' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="sdDateTime" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Specific Date & Time
            </label>
            <input
              id="sdDateTime"
              type="datetime-local"
              value={convertStateToInput(dateTime)}
              onChange={(e) => {
                const stateVal = convertInputToState(e.target.value);
                handleChange('dateTime', stateVal);
              }}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-bold text-slate-800 transition-all bg-white cursor-pointer shadow-xs"
            />
          </div>

          <div className="flex gap-2.5 bg-[#FFF7F5] border border-[#FFEDE9] p-3.5 rounded-2xl">
            <span className="text-[#E65F3A] shrink-0 select-none mt-0.5">
              <Info size={14} />
            </span>
            <p className="text-[10px] text-[#A34226]/90 font-semibold leading-relaxed">
              Automation stops here if the date has already passed. We use the contact's timezone, or your account timezone if theirs is unknown.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label htmlFor="sdWaitAmt" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Wait For
            </label>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <input
                  id="sdWaitAmt"
                  type="number"
                  min="1"
                  value={waitAmount}
                  onChange={(e) => handleChange('waitAmount', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-base font-extrabold transition-all bg-white shadow-xs"
                />
              </div>
              <div className="relative">
                <select
                  value={waitUnit}
                  onChange={(e) => handleChange('waitUnit', e.target.value)}
                  className="appearance-none pr-10 pl-7 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-bold bg-white cursor-pointer shadow-xs transition-all"
                >
                  <option value="Minutes">Minutes</option>
                  <option value="Hours">Hours</option>
                  <option value="Days">Days</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                  <ChevronDown size={14} strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-2.5 select-none">
              Enter a number or a numeric contact field formula. Max 365 days.
            </p>
          </div>

          <div className="flex items-center justify-between border border-slate-150 rounded-2xl p-4 shadow-xs bg-slate-50/20">
            <div className="pr-4 select-none">
              <p className="text-xs font-extrabold text-slate-700">Send within specific hours</p>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">
                Sends when the contact's local time is within the hours you set. Your account timezone is used if theirs is unknown.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('sendWithinSpecificHours', !sendWithinSpecificHours)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-all cursor-pointer relative shrink-0 border-none outline-none ${
                sendWithinSpecificHours ? 'bg-[#E65F3A]' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 bg-white rounded-full transition-all shadow-xs ${
                  sendWithinSpecificHours ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            if (editorState) {
              (editorState as EditorStateLocal).setNextStepSourceHandle('next');
              (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true);
            }
          }}
          className="w-full py-3.5 bg-white hover:bg-orange-50/10 border border-dashed border-orange-200 hover:border-orange-400 text-[#C2410C] hover:text-[#A34226] text-xs font-bold rounded-2xl transition-all cursor-pointer text-center select-none shadow-xs"
        >
          Choose Next Step
        </button>
      </div>
    </div>
  );
};
