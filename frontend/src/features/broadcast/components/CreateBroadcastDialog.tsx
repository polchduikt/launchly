import React, { useState } from 'react';
import { AlertTriangle, Send, Loader2, X, User } from 'lucide-react';
import { t } from '../../../i18n';
import type { CreateBroadcastDialogProps } from '../types';

export const CreateBroadcastDialog: React.FC<CreateBroadcastDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  isCreating,
  createError,
  tags,
  bots,
}) => {
  const [selectedAutomation, setSelectedAutomation] = useState<string>('ALL');

  if (!isOpen) return null;

  const connectedBots = bots.filter((b) => b.hasTelegramToken);

  const selectedAutomationCount =
    selectedAutomation === 'ALL'
      ? connectedBots.reduce((acc, b) => acc + (b.totalUsers || 0), 0)
      : connectedBots.find((b) => String(b.id) === selectedAutomation)?.totalUsers || 0;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{t('broadcast.dialog.create_title')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {createError && (
            <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold border border-rose-100 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{createError.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('broadcast.dialog.campaign_name')}</label>
            <input
              type="text"
              placeholder={t('broadcast.dialog.campaign_name_placeholder')}
              {...form.register('name')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-rose-600 font-bold">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('broadcast.dialog.automation')}</label>
            <select
              value={selectedAutomation}
              onChange={(e) => setSelectedAutomation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white font-semibold text-slate-855"
            >
              <option value="ALL">{t('broadcast.dialog.all_automations')}</option>
              {connectedBots.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50/40 border border-indigo-100/50 rounded-xl text-xs font-semibold text-indigo-655 mt-1">
              <User size={13} className="text-indigo-500" />
              <span>
                {t('broadcast.dialog.subscribers_of_automation_desc', { count: selectedAutomationCount })}
              </span>
            </div>
          </div>
          <input type="hidden" value="ALL" {...form.register('filterType')} />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('broadcast.dialog.message_text')}</label>
            <textarea
              rows={4}
              placeholder={t('broadcast.dialog.message_placeholder')}
              {...form.register('message')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none font-medium text-slate-700"
            />
            {form.formState.errors.message && (
              <p className="text-xs text-rose-600 font-bold">{form.formState.errors.message.message}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {t('broadcast.dialog.cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
            >
              {isCreating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>{t('broadcast.dialog.creating')}</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>{t('broadcast.dialog.create_campaign')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
