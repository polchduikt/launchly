import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useTranslation } from '../../../i18n/config';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (dateTime: string) => void;
  initialText: string;
}

export const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  initialText,
}) => {
  const { t } = useTranslation();
  const [dateTimeValue, setDateTimeValue] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTimeValue) return;
    onSchedule(dateTimeValue);
  };

  const getMinDateTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default animate-fade-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500 shrink-0" />
            {t('crm.reply.schedule_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('crm.reply.schedule_text')}
            </label>
            <textarea
              readOnly
              value={initialText}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-500 focus:outline-none resize-none font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('crm.reply.schedule_datetime')}
            </label>
            <input
              type="datetime-local"
              min={getMinDateTime()}
              value={dateTimeValue}
              onChange={(e) => setDateTimeValue(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 font-medium block">
              {t('crm.reply.schedule_tz_note')}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {t('crm.contacts.bulk.btn_cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
            >
              {t('crm.reply.schedule_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
